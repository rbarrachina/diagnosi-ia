import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import type { AppAuthenticatedUser } from "@/lib/auth/local";
import { getXtecSessionState } from "@/lib/auth/session";
import { mysqlPool } from "@/lib/db/client";

export type AdminSessionState =
  | { status: "authenticated"; user: AppAuthenticatedUser; bootstrapped: boolean }
  | { status: "forbidden"; reason: "not_xtec" | "not_admin"; email: string | null }
  | { status: "setup_error"; reason: "admin_storage_unavailable" }
  | { status: "unauthenticated" };

export class AdminAccessError extends Error {
  constructor() {
    super("Active administrator access is required");
    this.name = "AdminAccessError";
  }
}

type AdminUserRow = RowDataPacket & {
  user_id: string;
};

type CountRow = RowDataPacket & {
  admin_count: number | string;
};

type LockRow = RowDataPacket & {
  lock_result: number | null;
};

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

async function bootstrapFirstAdmin(userId: string): Promise<boolean> {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const [lockRows] = await connection.execute<LockRow[]>(
      "select get_lock('diagnosi_ia_admin_bootstrap', 10) as lock_result",
    );

    if (lockRows[0]?.lock_result !== 1) {
      throw new Error("Could not acquire admin bootstrap lock");
    }

    const [countRows] = await connection.execute<CountRow[]>(
      "select count(*) as admin_count from admin_users",
    );

    if (Number(countRows[0]?.admin_count ?? 0) !== 0) {
      await connection.commit();
      return false;
    }

    await connection.execute(
      `
        insert into admin_users (user_id, role, is_active, created_by)
        values (?, 'admin', true, null)
      `,
      [userId],
    );
    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.execute("select release_lock('diagnosi_ia_admin_bootstrap')");
    connection.release();
  }
}

export async function getAdminSessionState(options: {
  allowBootstrap?: boolean;
} = {}): Promise<AdminSessionState> {
  const session = await getXtecSessionState();

  if (session.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (session.status === "forbidden") {
    return { status: "forbidden", reason: "not_xtec", email: session.email };
  }

  try {
    if (await isActiveAdminUser(session.user.id)) {
      return {
        status: "authenticated",
        user: session.user,
        bootstrapped: false,
      };
    }

    const bootstrapped = options.allowBootstrap
      ? await bootstrapFirstAdmin(session.user.id)
      : false;

    if (bootstrapped || (await isActiveAdminUser(session.user.id))) {
      return {
        status: "authenticated",
        user: session.user,
        bootstrapped,
      };
    }
  } catch {
    return {
      status: "setup_error",
      reason: "admin_storage_unavailable",
    };
  }

  return {
    status: "forbidden",
    reason: "not_admin",
    email: session.user.email,
  };
}

export async function getRequiredAdminUser(): Promise<AppAuthenticatedUser> {
  const session = await getAdminSessionState();

  if (session.status !== "authenticated") {
    throw new AdminAccessError();
  }

  return session.user;
}
