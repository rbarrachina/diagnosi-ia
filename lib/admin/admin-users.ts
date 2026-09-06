import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  AdminEmailInvitationSummary,
  AdminUserSummary,
} from "@/lib/admin/types";
import type { AppAuthenticatedUser } from "@/lib/auth/local";
import { mysqlPool } from "@/lib/db/client";
import {
  adminEmailInvitationInputSchema,
  adminUserInputSchema,
  setAdminUserActiveInputSchema,
  type AdminEmailInvitationInput,
  type AdminUserInput,
  type SetAdminUserActiveInput,
} from "@/lib/validation/schemas";

type AdminUserRow = RowDataPacket & {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: "admin";
  is_active: number | boolean;
  created_at: string | Date;
  created_by: string | null;
  last_login_at: string | Date | null;
};

type AdminEmailInvitationRow = RowDataPacket & {
  email: string;
  is_active: number | boolean;
  created_at: string | Date;
  invited_by: string;
  accepted_at: string | Date | null;
  accepted_by: string | null;
};

export class AdminUserOperationError extends Error {
  constructor(message = "Could not manage administrator") {
    super(message);
    this.name = "AdminUserOperationError";
  }
}

function mapAdminUser(row: AdminUserRow): AdminUserSummary {
  return {
    userId: row.user_id,
    role: row.role,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    createdBy: row.created_by,
    displayName: row.display_name,
    email: row.email,
    lastLoginAt: row.last_login_at ? formatDateTime(row.last_login_at) : null,
  };
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const [rows] = await mysqlPool.execute<AdminUserRow[]>(
    `
      select
        user_id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        created_by,
        last_login_at
      from admin_users
      order by created_at asc
    `,
  );

  return rows.map(mapAdminUser);
}

export async function listAdminEmailInvitations(): Promise<
  AdminEmailInvitationSummary[]
> {
  const [rows] = await mysqlPool.execute<AdminEmailInvitationRow[]>(
    `
      select email, is_active, created_at, invited_by, accepted_at, accepted_by
      from admin_email_invitations
      where is_active = true
        and accepted_at is null
      order by created_at asc
    `,
  );

  return rows.map(mapAdminEmailInvitation);
}

export async function inviteAdminByEmail(
  input: AdminEmailInvitationInput,
  actorUserId: string,
): Promise<AdminEmailInvitationSummary> {
  const payload = adminEmailInvitationInputSchema.parse(input);

  await mysqlPool.execute(
    `
      insert into admin_email_invitations (email, is_active, invited_by)
      values (?, true, ?)
      on duplicate key update
        is_active = true,
        invited_by = values(invited_by),
        accepted_at = null,
        accepted_by = null
    `,
    [payload.email, actorUserId],
  );

  const invitation = await getAdminEmailInvitationByEmail(payload.email);

  if (!invitation) {
    throw new AdminUserOperationError();
  }

  return invitation;
}

export async function deletePendingAdminEmailInvitation(
  input: AdminEmailInvitationInput,
): Promise<void> {
  const payload = adminEmailInvitationInputSchema.parse(input);
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    `
      delete from admin_email_invitations
      where email = ?
        and is_active = true
        and accepted_at is null
    `,
    [payload.email],
  );

  if (result.affectedRows !== 1) {
    throw new AdminUserOperationError("Pending invitation could not be removed");
  }
}

export async function acceptAdminEmailInvitationForUser(
  user: AppAuthenticatedUser,
): Promise<boolean> {
  const payload = adminEmailInvitationInputSchema.parse({ email: user.email });
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const [invitationRows] = await connection.execute<AdminEmailInvitationRow[]>(
      `
        select email
        from admin_email_invitations
        where email = ?
          and is_active = true
          and accepted_at is null
        limit 1
        for update
      `,
      [payload.email],
    );

    if (!invitationRows[0]) {
      await connection.commit();
      return false;
    }

    await connection.execute(
      `
        insert into admin_users (
          user_id,
          email,
          display_name,
          role,
          is_active,
          created_by,
          last_login_at
        )
        values (?, ?, ?, 'admin', true, null, current_timestamp(3))
        on duplicate key update
          role = 'admin',
          is_active = true,
          email = values(email),
          display_name = values(display_name),
          last_login_at = values(last_login_at)
      `,
      [user.id, payload.email, user.displayName],
    );
    await connection.execute(
      `
        update admin_email_invitations
        set is_active = false,
            accepted_at = current_timestamp(3),
            accepted_by = ?
        where email = ?
      `,
      [user.id, payload.email],
    );
    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminLoginProfile(
  user: AppAuthenticatedUser,
): Promise<void> {
  const payload = adminEmailInvitationInputSchema.parse({ email: user.email });

  await mysqlPool.execute(
    `
      update admin_users
      set email = ?,
          display_name = ?,
          last_login_at = current_timestamp(3)
      where user_id = ?
        and role = 'admin'
    `,
    [payload.email, user.displayName, user.id],
  );
  await mysqlPool.execute(
    `
      update admin_email_invitations
      set is_active = false,
          accepted_at = coalesce(accepted_at, current_timestamp(3)),
          accepted_by = coalesce(accepted_by, ?)
      where email = ?
        and is_active = true
        and accepted_at is null
    `,
    [user.id, payload.email],
  );
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
      select
        user_id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        created_by,
        last_login_at
      from admin_users
      where user_id = ?
      limit 1
    `,
    [userId],
  );
  const [row] = rows;

  if (!row) {
    return null;
  }

  return mapAdminUser(row);
}

async function getAdminEmailInvitationByEmail(
  email: string,
): Promise<AdminEmailInvitationSummary | null> {
  const [rows] = await mysqlPool.execute<AdminEmailInvitationRow[]>(
    `
      select email, is_active, created_at, invited_by, accepted_at, accepted_by
      from admin_email_invitations
      where email = ?
      limit 1
    `,
    [email],
  );
  const [row] = rows;

  return row ? mapAdminEmailInvitation(row) : null;
}

function mapAdminEmailInvitation(
  row: AdminEmailInvitationRow,
): AdminEmailInvitationSummary {
  return {
    email: row.email,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    invitedBy: row.invited_by,
    acceptedAt: row.accepted_at ? formatDateTime(row.accepted_at) : null,
    acceptedBy: row.accepted_by,
  };
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function formatDateTime(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
