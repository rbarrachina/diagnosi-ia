import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";

import { mysqlPool } from "@/lib/db/client";
import type { CentreEmailPolicy } from "@/lib/centres/types";

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/,
    "El domini no és vàlid.",
  )
  .refine((domain) => domain !== "xtec.cat", {
    message: "Per a @xtec.cat, selecciona l’opció recomanada.",
  });

export const centreEmailPolicySchema = z
  .object({
    allowXtec: z.boolean(),
    customDomain: z.union([domainSchema, z.literal(""), z.null()]),
  })
  .strict()
  .transform((value) => ({
    allowXtec: value.allowXtec,
    customDomain: value.customDomain || null,
  }))
  .refine((value) => value.allowXtec !== (value.customDomain !== null), {
    message: "Selecciona un únic domini admès.",
  });

type PolicyRow = RowDataPacket & {
  allow_xtec: number | boolean;
  custom_domain: string | null;
  email_policy_configured_at: string | Date | null;
};

export function emailDomain(email: string): string | null {
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1) {
    return null;
  }
  return email.slice(separator + 1).toLowerCase();
}

export function isEmailAllowedByCentrePolicy(
  email: string,
  policy: Pick<CentreEmailPolicy, "allowXtec" | "customDomain" | "configured">,
): boolean {
  if (!policy.configured) {
    return false;
  }
  const domain = emailDomain(email);
  return Boolean(
    domain &&
      ((policy.allowXtec && domain === "xtec.cat") ||
        (policy.customDomain && domain === policy.customDomain)),
  );
}

export function acceptedDomainLabels(
  policy: Pick<CentreEmailPolicy, "allowXtec" | "customDomain">,
): string[] {
  return [
    ...(policy.allowXtec ? ["@xtec.cat"] : []),
    ...(policy.customDomain ? [`@${policy.customDomain}`] : []),
  ];
}

export async function getCentreEmailPolicyForPublicCode(
  publicCode: string,
): Promise<CentreEmailPolicy | null> {
  const [rows] = await mysqlPool.execute<PolicyRow[]>(
    `
      select
        centres.allow_xtec,
        centres.custom_domain,
        centres.email_policy_configured_at
      from diagnostic_spaces
      inner join centres on centres.id = diagnostic_spaces.centre_id
      where diagnostic_spaces.public_code = ?
        and diagnostic_spaces.is_active = true
        and centres.is_suspended = false
      limit 1
    `,
    [publicCode],
  );

  return rows[0] ? mapPolicy(rows[0]) : null;
}

export async function confirmCentreProfileForUser(userId: string): Promise<boolean> {
  const [result] = await mysqlPool.execute(
    `
      update centres
      inner join centre_accounts on centre_accounts.centre_id = centres.id
      set centres.profile_confirmed_at = coalesce(
        centres.profile_confirmed_at,
        current_timestamp(3)
      )
      where centre_accounts.user_id = ?
    `,
    [userId],
  );
  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function updateCentreEmailPolicyForUser(
  userId: string,
  input: unknown,
): Promise<CentreEmailPolicy | null> {
  const policy = centreEmailPolicySchema.parse(input);
  const [result] = await mysqlPool.execute(
    `
      update centres
      inner join centre_accounts on centre_accounts.centre_id = centres.id
      set centres.allow_xtec = ?,
          centres.custom_domain = ?,
          centres.email_policy_configured_at = current_timestamp(3),
          centres.updated_at = current_timestamp(3)
      where centre_accounts.user_id = ?
        and centres.profile_confirmed_at is not null
    `,
    [policy.allowXtec, policy.customDomain, userId],
  );

  if (Number((result as { affectedRows?: number }).affectedRows ?? 0) === 0) {
    return null;
  }

  return { ...policy, configured: true };
}

function mapPolicy(row: PolicyRow): CentreEmailPolicy {
  return {
    allowXtec: Boolean(row.allow_xtec),
    customDomain: row.custom_domain,
    configured: Boolean(row.email_policy_configured_at),
  };
}
