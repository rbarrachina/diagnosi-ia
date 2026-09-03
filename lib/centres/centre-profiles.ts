import "server-only";

import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AppAuthenticatedUser } from "@/lib/auth/local";
import { canUseResponsibleAccess } from "@/lib/auth/responsible-access";
import { canHaveCentreProfile } from "@/lib/centres/access";
import { mysqlPool } from "@/lib/db/client";
import { lookupCentreOpenData } from "@/lib/centres/open-data";
import type { CentreProfile, CentreSourceStatus } from "@/lib/centres/types";

type CentreRow = RowDataPacket & {
  id: string;
  email: string;
  display_name: string | null;
  official_code: string | null;
  official_name: string | null;
  municipality: string | null;
  territorial_area: string | null;
  educational_service: string | null;
  source_status: CentreSourceStatus;
  last_attempt_at: string | Date | null;
  last_success_at: string | Date | null;
  profile_confirmed_at: string | Date | null;
  allow_xtec: number | boolean;
  custom_domain: string | null;
  email_policy_configured_at: string | Date | null;
};

export async function registerCentreAccount(
  user: AppAuthenticatedUser,
  options: { allowNonCentre?: boolean; refresh?: boolean } = {},
): Promise<CentreProfile | null> {
  if (!canHaveCentreProfile(user.email, options.allowNonCentre)) {
    return null;
  }

  const centreId = await upsertCentreAndAccount(user);
  const current = await getCentreProfileById(centreId);

  if (options.refresh || !current?.lastAttemptAt) {
    await refreshCentreProfile(centreId, user.email);
  }

  return getCentreProfileById(centreId);
}

export async function registerResponsibleCentreAccount(
  user: AppAuthenticatedUser,
  options: { refresh?: boolean } = {},
): Promise<CentreProfile | null> {
  if (!(await canUseResponsibleAccess(user))) {
    return null;
  }

  return registerCentreAccount(user, {
    allowNonCentre: true,
    refresh: options.refresh,
  });
}

export async function getCentreProfileForUser(
  userId: string,
): Promise<CentreProfile | null> {
  const [rows] = await mysqlPool.execute<CentreRow[]>(
    `${CENTRE_PROFILE_SELECT} where centre_accounts.user_id = ? limit 1`,
    [userId],
  );

  return rows[0] ? mapCentreProfile(rows[0]) : null;
}

export async function refreshCentreProfileForUser(
  user: AppAuthenticatedUser,
): Promise<CentreProfile | null> {
  return registerResponsibleCentreAccount(user, {
    refresh: true,
  });
}

async function upsertCentreAndAccount(user: AppAuthenticatedUser): Promise<string> {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
      "select id from centres where email = ? limit 1 for update",
      [user.email.toLowerCase()],
    );
    const centreId = existingRows[0]?.id ?? randomUUID();

    if (!existingRows[0]) {
      await connection.execute(
        "insert into centres (id, email, source_status) values (?, ?, 'pending')",
        [centreId, user.email.toLowerCase()],
      );
    }

    await connection.execute(
      `
        insert into centre_accounts (
          user_id, centre_id, email, display_name, last_login_at
        ) values (?, ?, ?, ?, current_timestamp(3))
        on duplicate key update
          centre_id = values(centre_id),
          email = values(email),
          display_name = values(display_name),
          last_login_at = current_timestamp(3)
      `,
      [user.id, centreId, user.email.toLowerCase(), user.displayName],
    );
    await connection.execute(
      `
        update diagnostic_spaces
        set centre_id = ?
        where owner_user_id = ?
          and centre_id is null
      `,
      [centreId, user.id],
    );
    await connection.commit();
    return centreId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function refreshCentreProfile(centreId: string, email: string): Promise<void> {
  const lookup = await lookupCentreOpenData(email);

  if (lookup.status === "ok") {
    await mysqlPool.execute(
      `
        update centres
        set official_code = ?,
            official_name = ?,
            municipality = ?,
            territorial_area = ?,
            educational_service = ?,
            source_status = 'ok',
            last_attempt_at = current_timestamp(3),
            last_success_at = current_timestamp(3),
            updated_at = current_timestamp(3)
        where id = ?
      `,
      [
        lookup.data.officialCode,
        lookup.data.officialName,
        lookup.data.municipality,
        lookup.data.territorialArea,
        lookup.data.educationalService,
        centreId,
      ],
    );
    return;
  }

  await mysqlPool.execute(
    `
      update centres
      set source_status = ?,
          last_attempt_at = current_timestamp(3),
          updated_at = current_timestamp(3)
      where id = ?
    `,
    [lookup.status, centreId],
  );
}

async function getCentreProfileById(centreId: string): Promise<CentreProfile | null> {
  const [rows] = await mysqlPool.execute<CentreRow[]>(
    `${CENTRE_PROFILE_SELECT} where centres.id = ? limit 1`,
    [centreId],
  );

  return rows[0] ? mapCentreProfile(rows[0]) : null;
}

const CENTRE_PROFILE_SELECT = `
  select
    centres.id,
    centres.email,
    centre_accounts.display_name,
    centres.official_code,
    centres.official_name,
    centres.municipality,
    centres.territorial_area,
    centres.educational_service,
    centres.source_status,
    centres.last_attempt_at,
    centres.last_success_at
    ,centres.profile_confirmed_at
    ,centres.allow_xtec
    ,centres.custom_domain
    ,centres.email_policy_configured_at
  from centres
  inner join centre_accounts on centre_accounts.centre_id = centres.id
`;

function mapCentreProfile(row: CentreRow): CentreProfile {
  return {
    id: row.id,
    email: row.email,
    accountDisplayName: row.display_name,
    officialCode: row.official_code,
    officialName: row.official_name,
    municipality: row.municipality,
    territorialArea: row.territorial_area,
    educationalService: row.educational_service,
    sourceStatus: row.source_status,
    lastAttemptAt: formatNullableDate(row.last_attempt_at),
    lastSuccessAt: formatNullableDate(row.last_success_at),
    profileConfirmedAt: formatNullableDate(row.profile_confirmed_at),
    allowXtec: Boolean(row.allow_xtec),
    customDomain: row.custom_domain,
    emailPolicyConfiguredAt: formatNullableDate(row.email_policy_configured_at),
    displayName: row.official_name ?? row.display_name ?? row.email,
  };
}

function formatNullableDate(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}
