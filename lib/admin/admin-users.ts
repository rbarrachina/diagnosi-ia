import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type { AdminUserSearchResult, AdminUserSummary } from "@/lib/admin/types";
import { getXtecSessionState } from "@/lib/auth/session";
import { mysqlPool } from "@/lib/db/client";
import {
  adminUserInputSchema,
  adminUserSearchQuerySchema,
  setAdminUserActiveInputSchema,
  type AdminUserInput,
  type AdminUserSearchQuery,
  type SetAdminUserActiveInput,
} from "@/lib/validation/schemas";

type AdminUserRow = RowDataPacket & {
  user_id: string;
  role: "admin";
  is_active: number | boolean;
  created_at: string | Date;
  created_by: string | null;
};

export class AdminUserOperationError extends Error {
  constructor(message = "Could not manage administrator") {
    super(message);
    this.name = "AdminUserOperationError";
  }
}

function mapAdminUser(
  row: AdminUserRow,
  profile?: AdminUserSearchResult | null,
): AdminUserSummary {
  return {
    userId: row.user_id,
    role: row.role,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    createdBy: row.created_by,
    displayName: profile?.userId === row.user_id ? profile.displayName : null,
    email: profile?.userId === row.user_id ? profile.email : null,
  };
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const [rows] = await mysqlPool.execute<AdminUserRow[]>(
    `
      select user_id, role, is_active, created_at, created_by
      from admin_users
      order by created_at asc
    `,
  );
  const currentProfile = await getCurrentAuthUserSearchProfile();

  return rows.map((row) => mapAdminUser(row, currentProfile));
}

export async function searchAuthUsersForAdmin(
  query: AdminUserSearchQuery,
): Promise<AdminUserSearchResult[]> {
  const parsedQuery = adminUserSearchQuerySchema.parse(query).toLowerCase();
  const currentProfile = await getCurrentAuthUserSearchProfile();

  if (!currentProfile) {
    return [];
  }

  const searchable = [currentProfile.userId, currentProfile.email, currentProfile.displayName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(parsedQuery) ? [currentProfile] : [];
}

export async function addOrReactivateAdminUser(
  input: AdminUserInput,
  actorUserId: string,
): Promise<AdminUserSummary> {
  const payload = adminUserInputSchema.parse(input);

  await mysqlPool.execute(
    `
      insert into admin_users (user_id, role, is_active, created_by)
      values (?, 'admin', true, ?)
      on duplicate key update
        role = 'admin',
        is_active = true,
        created_by = values(created_by)
    `,
    [payload.userId, actorUserId],
  );

  const admin = await getAdminUserById(payload.userId);

  if (!admin) {
    throw new AdminUserOperationError();
  }

  return admin;
}

export async function deleteAdminUser(
  input: AdminUserInput,
  actorUserId: string,
): Promise<void> {
  const payload = adminUserInputSchema.parse(input);

  if (payload.userId === actorUserId) {
    throw new AdminUserOperationError("Administrators cannot remove themselves");
  }

  const [result] = await mysqlPool.execute<ResultSetHeader>(
    "delete from admin_users where user_id = ?",
    [payload.userId],
  );

  if (result.affectedRows !== 1) {
    throw new AdminUserOperationError();
  }
}

export async function setAdminUserActive(
  input: SetAdminUserActiveInput,
  actorUserId: string,
): Promise<AdminUserSummary> {
  const payload = setAdminUserActiveInputSchema.parse(input);

  if (payload.userId === actorUserId && !payload.isActive) {
    throw new AdminUserOperationError("Administrators cannot deactivate themselves");
  }

  const [result] = await mysqlPool.execute<ResultSetHeader>(
    `
      update admin_users
      set is_active = ?
      where user_id = ?
    `,
    [payload.isActive, payload.userId],
  );

  if (result.affectedRows !== 1) {
    throw new AdminUserOperationError();
  }

  const admin = await getAdminUserById(payload.userId);

  if (!admin) {
    throw new AdminUserOperationError();
  }

  return admin;
}

async function getAdminUserById(userId: string): Promise<AdminUserSummary | null> {
  const [rows] = await mysqlPool.execute<AdminUserRow[]>(
    `
      select user_id, role, is_active, created_at, created_by
      from admin_users
      where user_id = ?
      limit 1
    `,
    [userId],
  );
  const [row] = rows;

  return row ? mapAdminUser(row, await getCurrentAuthUserSearchProfile()) : null;
}

async function getCurrentAuthUserSearchProfile(): Promise<AdminUserSearchResult | null> {
  const session = await getXtecSessionState();

  if (session.status !== "authenticated") {
    return null;
  }

  return {
    userId: session.user.id,
    displayName: "Usuari XTEC",
    email: session.user.email,
  };
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function formatDateTime(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
