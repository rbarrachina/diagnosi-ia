import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { mysqlPool } from "@/lib/db/client";
import { effectiveCentreEmailPolicy, type LoginMode } from "@/lib/auth/login-mode-policy";

export { effectiveCentreEmailPolicy };
export const loginModeSchema = z.enum(["internal", "external"]);
export const LOGIN_MODE_SETTING_KEY = "google_login_mode";

export async function getLoginMode(
  database: Pick<Pool, "execute"> = mysqlPool,
  lock = false,
): Promise<LoginMode> {
  const [rows] = await database.execute<(RowDataPacket & { setting_value: string })[]>(
    `select setting_value from app_settings where setting_key = ? limit 1${lock ? " for share" : ""}`,
    [LOGIN_MODE_SETTING_KEY],
  );
  const parsed = loginModeSchema.safeParse(rows[0]?.setting_value);
  return parsed.success ? parsed.data : "internal";
}

export async function setLoginMode(input: unknown): Promise<void> {
  const mode = loginModeSchema.parse(input);
  await mysqlPool.execute(
    `insert into app_settings (setting_key, setting_value) values (?, ?)
     on duplicate key update setting_value = values(setting_value), updated_at = current_timestamp(3)`,
    [LOGIN_MODE_SETTING_KEY, mode],
  );
}
