import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";
import { isXtecCentreEmail } from "@/lib/auth/xtec";
import type { AppAuthenticatedUser } from "@/lib/auth/local";

export const RESPONSIBLE_ACCESS_MODES = ["all_xtec", "centre_xtec"] as const;
export const DEFAULT_RESPONSIBLE_ACCESS_MODE = "all_xtec";
export const RESPONSIBLE_ACCESS_MODE_SETTING_KEY = "responsible_access_mode";
export const ADMIN_RESULTS_MINIMUM_SUBMISSIONS_SETTING_KEY =
  "admin_results_minimum_submissions";
export const DEFAULT_ADMIN_RESULTS_MINIMUM_SUBMISSIONS = 0;
export const MIN_ADMIN_RESULTS_MINIMUM_SUBMISSIONS = 0;
export const MAX_ADMIN_RESULTS_MINIMUM_SUBMISSIONS = 10;

export type ResponsibleAccessMode = (typeof RESPONSIBLE_ACCESS_MODES)[number];

type SettingRow = RowDataPacket & {
  setting_value: string;
};

type AdminUserRow = RowDataPacket & {
  user_id: string;
};

export class ResponsibleAccessSettingsError extends Error {
  constructor(message = "Could not update responsible access settings") {
    super(message);
    this.name = "ResponsibleAccessSettingsError";
  }
}

export function isResponsibleAccessMode(
  value: string | null | undefined,
): value is ResponsibleAccessMode {
  return RESPONSIBLE_ACCESS_MODES.includes(value as ResponsibleAccessMode);
}

export async function getResponsibleAccessMode(): Promise<ResponsibleAccessMode> {
  try {
    const [rows] = await mysqlPool.execute<SettingRow[]>(
      `
        select setting_value
        from app_settings
        where setting_key = ?
        limit 1
      `,
      [RESPONSIBLE_ACCESS_MODE_SETTING_KEY],
    );
    const mode = rows[0]?.setting_value;

    return isResponsibleAccessMode(mode) ? mode : DEFAULT_RESPONSIBLE_ACCESS_MODE;
  } catch (error) {
    if (isMissingSettingsTableError(error)) {
      return DEFAULT_RESPONSIBLE_ACCESS_MODE;
    }

    throw error;
  }
}

export async function setResponsibleAccessMode(
  mode: ResponsibleAccessMode,
): Promise<ResponsibleAccessMode> {
  if (!isResponsibleAccessMode(mode)) {
    throw new ResponsibleAccessSettingsError();
  }

  await mysqlPool.execute(
    `
      insert into app_settings (setting_key, setting_value)
      values (?, ?)
      on duplicate key update
        setting_value = values(setting_value),
        updated_at = current_timestamp(3)
    `,
    [RESPONSIBLE_ACCESS_MODE_SETTING_KEY, mode],
  );

  return mode;
}

export function isAdminResultsMinimumSubmissions(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_ADMIN_RESULTS_MINIMUM_SUBMISSIONS &&
    value <= MAX_ADMIN_RESULTS_MINIMUM_SUBMISSIONS
  );
}

export async function getAdminResultsMinimumSubmissions(): Promise<number> {
  try {
    const [rows] = await mysqlPool.execute<SettingRow[]>(
      `
        select setting_value
        from app_settings
        where setting_key = ?
        limit 1
      `,
      [ADMIN_RESULTS_MINIMUM_SUBMISSIONS_SETTING_KEY],
    );
    const value = Number(rows[0]?.setting_value);

    return isAdminResultsMinimumSubmissions(value)
      ? value
      : DEFAULT_ADMIN_RESULTS_MINIMUM_SUBMISSIONS;
  } catch (error) {
    if (isMissingSettingsTableError(error)) {
      return DEFAULT_ADMIN_RESULTS_MINIMUM_SUBMISSIONS;
    }

    throw error;
  }
}

export async function setAdminResultsMinimumSubmissions(
  value: number,
): Promise<number> {
  if (!isAdminResultsMinimumSubmissions(value)) {
    throw new ResponsibleAccessSettingsError();
  }

  await mysqlPool.execute(
    `
      insert into app_settings (setting_key, setting_value)
      values (?, ?)
      on duplicate key update
        setting_value = values(setting_value),
        updated_at = current_timestamp(3)
    `,
    [ADMIN_RESULTS_MINIMUM_SUBMISSIONS_SETTING_KEY, String(value)],
  );

  return value;
}

export async function canUseResponsibleAccess(
  user: AppAuthenticatedUser,
): Promise<boolean> {
  if (isXtecCentreEmail(user.email)) {
    return true;
  }

  const mode = await getResponsibleAccessMode();

  if (mode === "all_xtec") {
    return true;
  }

  return isActiveAdminUser(user.id);
}

async function isActiveAdminUser(userId: string): Promise<boolean> {
  const [rows] = await mysqlPool.execute<AdminUserRow[]>(
    `
      select user_id
      from admin_users
      where user_id = ?
        and role = 'admin'
        and is_active = true
      limit 1
    `,
    [userId],
  );

  return Boolean(rows[0]);
}

function isMissingSettingsTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_NO_SUCH_TABLE"
  );
}
