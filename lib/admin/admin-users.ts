import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  AdminEmailInvitationSummary,
  AdminUserSummary,
} from "@/lib/admin/types";
import { getXtecSessionState } from "@/lib/auth/session";
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
  role: "admin";
  is_active: number | boolean;
  created_at: string | Date;
  created_by: string | null;
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

function mapAdminUser(
  row: AdminUserRow,
  profiles: Map<string, string>,
  currentEmail: string | null,
): AdminUserSummary {
  const email = profiles.get(row.user_id) ?? currentEmail;

  return {
    userId: row.user_id,
    role: row.role,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    createdBy: row.created_by,
    displayName: null,
    email,
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
  const currentUser = await getCurrentAuthUser();
  const currentEmailByUserId =
    currentUser && currentUser.email ? new Map([[currentUser.id, currentUser.email]]) : new Map();
  const invitationEmailsByUserId = await getAcceptedInvitationEmailsByUserId();

  return rows.map((row) =>
    mapAdminUser(
      row,
      invitationEmailsByUserId,
      currentEmailByUserId.get(row.user_id) ?? null,
    ),
  );
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

export async function acceptAdminEmailInvitationForUser(params: {
  email: string;
  userId: string;
}): Promise<boolean> {
  const payload = adminEmailInvitationInputSchema.parse({ email: params.email });
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
        insert into admin_users (user_id, role, is_active, created_by)
        values (?, 'admin', true, null)
        on duplicate key update
          role = 'admin',
          is_active = true
      `,
      [params.userId],
    );
    await connection.execute(
      `
        update admin_email_invitations
        set is_active = false,
            accepted_at = current_timestamp(3),
            accepted_by = ?
        where email = ?
      `,
      [params.userId, payload.email],
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

export async function rememberAdminEmailForUser(params: {
  email: string;
  userId: string;
}): Promise<void> {
  const payload = adminEmailInvitationInputSchema.parse({ email: params.email });

  await mysqlPool.execute(
    `
      insert into admin_email_invitations (
        email,
        is_active,
        invited_by,
        accepted_at,
        accepted_by
      )
      values (?, false, ?, current_timestamp(3), ?)
      on duplicate key update
        is_active = false,
        accepted_at = coalesce(accepted_at, current_timestamp(3)),
        accepted_by = values(accepted_by)
    `,
    [payload.email, params.userId, params.userId],
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
      select user_id, role, is_active, created_at, created_by
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

  return mapAdminUser(row, await getAcceptedInvitationEmailsByUserId(), null);
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

async function getCurrentAuthUser() {
  const session = await getXtecSessionState();

  if (session.status !== "authenticated") {
    return null;
  }

  return session.user;
}

async function getAcceptedInvitationEmailsByUserId(): Promise<Map<string, string>> {
  const [rows] = await mysqlPool.execute<
    Array<RowDataPacket & { accepted_by: string; email: string }>
  >(
    `
      select accepted_by, email
      from admin_email_invitations
      where accepted_by is not null
      order by accepted_at asc, created_at asc
    `,
  );

  return new Map(rows.map((row) => [row.accepted_by, row.email]));
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
