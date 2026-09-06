import "server-only";

import { randomUUID } from "node:crypto";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";
import { rotateAdminCentreDiagnosticSpace } from "@/lib/repositories/diagnostic-spaces";

const MAX_SPACE_RESET_ATTEMPTS = 8;

export type AdminCentreAction =
  | "suspended"
  | "reactivated"
  | "responses_reset"
  | "space_reset"
  | "deleted";

export type AdminManagedCentreSummary = {
  id: string;
  displayName: string;
  officialCode: string | null;
  municipality: string | null;
  responsibleEmail: string;
  lastLoginAt: string | null;
  isSuspended: boolean;
  hasSpace: boolean;
  totalSubmissions: number;
};

export type AdminCentreFilter =
  | "all"
  | "active"
  | "suspended"
  | "pending"
  | "active_without_questionnaire"
  | "without_questionnaire"
  | "with_questionnaire_without_responses"
  | "without_responses";

export type AdminCentreActionSummary = {
  id: string;
  action: AdminCentreAction;
  actorName: string;
  affectedSubmissions: number;
  createdAt: string;
};

export type AdminManagedCentreDetail = AdminManagedCentreSummary & {
  centreEmail: string;
  territorialArea: string | null;
  educationalService: string | null;
  sourceStatus: string;
  profileConfirmedAt: string | null;
  emailPolicyConfiguredAt: string | null;
  allowXtec: boolean;
  customDomain: string | null;
  responsibleName: string | null;
  responsibleCreatedAt: string;
  space: null | {
    publicCode: string;
    questionnaireId: string;
    questionnaireTitle: string;
    questionnaireVersion: string;
    isActive: boolean;
    createdAt: string;
  };
  recentActions: AdminCentreActionSummary[];
};

type CentreRow = RowDataPacket & {
  id: string;
  centre_email: string;
  official_code: string | null;
  official_name: string | null;
  municipality: string | null;
  territorial_area: string | null;
  educational_service: string | null;
  source_status: string;
  profile_confirmed_at: string | Date | null;
  allow_xtec: number | boolean;
  custom_domain: string | null;
  email_policy_configured_at: string | Date | null;
  is_suspended: number | boolean;
  responsible_email: string;
  responsible_name: string | null;
  responsible_created_at: string | Date;
  last_login_at: string | Date | null;
  public_code: string | null;
  questionnaire_id: string | null;
  questionnaire_title: string | null;
  questionnaire_version: string | null;
  space_is_active: number | boolean | null;
  space_created_at: string | Date | null;
  total_submissions: number | string;
};

type ActionRow = RowDataPacket & {
  id: string;
  action: AdminCentreAction;
  actor_name: string | null;
  actor_user_id: string;
  affected_submissions: number | string;
  created_at: string | Date;
};

type LockedCentreRow = RowDataPacket & {
  id: string;
  label: string;
  official_code: string | null;
  centre_email: string;
  is_suspended: number | boolean;
  space_id: string | null;
};

type SubmissionCountRow = RowDataPacket & {
  submission_count: number | string;
};

export class AdminCentreOperationError extends Error {
  constructor(message = "Could not manage centre") {
    super(message);
    this.name = "AdminCentreOperationError";
  }
}

export async function listAdminManagedCentres(
  search = "",
  filter: AdminCentreFilter = "all",
): Promise<AdminManagedCentreSummary[]> {
  const normalizedSearch = search.trim().slice(0, 100);
  const searchPattern = `%${normalizedSearch}%`;
  const filterClause: Record<AdminCentreFilter, string> = {
    all: "true",
    active: `
      centres.is_suspended = false
      and centres.profile_confirmed_at is not null
      and centres.email_policy_configured_at is not null
    `,
    suspended: "centres.is_suspended = true",
    pending: `
      centres.is_suspended = false
      and (
        centres.profile_confirmed_at is null
        or centres.email_policy_configured_at is null
      )
    `,
    active_without_questionnaire: `
      centres.is_suspended = false
      and centres.profile_confirmed_at is not null
      and centres.email_policy_configured_at is not null
      and diagnostic_spaces.id is null
    `,
    without_questionnaire: "diagnostic_spaces.id is null",
    with_questionnaire_without_responses: `
      diagnostic_spaces.id is not null
      and not exists (
        select 1 from submissions
        where submissions.diagnostic_space_id = diagnostic_spaces.id
      )
    `,
    without_responses:
      "not exists (select 1 from submissions where submissions.diagnostic_space_id = diagnostic_spaces.id)",
  };
  const [rows] = await mysqlPool.execute<CentreRow[]>(
    `
      ${CENTRE_SELECT}
      where (
        ? = ''
        or coalesce(centres.official_name, '') like ?
        or coalesce(centres.official_code, '') like ?
        or centres.email like ?
        or centre_accounts.email like ?
        or coalesce(centres.municipality, '') like ?
      )
      and (${filterClause[filter]})
      order by centres.is_suspended asc,
        coalesce(centres.official_name, centre_accounts.display_name, centres.email) asc
      limit 250
    `,
    [
      normalizedSearch,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    ],
  );

  return rows.map(mapCentreSummary);
}

export async function getAdminManagedCentre(
  centreId: string,
): Promise<AdminManagedCentreDetail | null> {
  const [rows] = await mysqlPool.execute<CentreRow[]>(
    `${CENTRE_SELECT} where centres.id = ? limit 1`,
    [centreId],
  );
  const row = rows[0];

  if (!row) return null;

  const [actionRows] = await mysqlPool.execute<ActionRow[]>(
    `
      select
        admin_centre_actions.id,
        admin_centre_actions.action,
        coalesce(admin_users.display_name, admin_users.email) as actor_name,
        admin_centre_actions.actor_user_id,
        admin_centre_actions.affected_submissions,
        admin_centre_actions.created_at
      from admin_centre_actions
      left join admin_users
        on admin_users.user_id = admin_centre_actions.actor_user_id
      where admin_centre_actions.centre_id = ?
      order by admin_centre_actions.created_at desc
      limit 10
    `,
    [centreId],
  );

  return {
    ...mapCentreSummary(row),
    centreEmail: row.centre_email,
    territorialArea: row.territorial_area,
    educationalService: row.educational_service,
    sourceStatus: row.source_status,
    profileConfirmedAt: formatNullableDate(row.profile_confirmed_at),
    emailPolicyConfiguredAt: formatNullableDate(row.email_policy_configured_at),
    allowXtec: Boolean(row.allow_xtec),
    customDomain: row.custom_domain,
    responsibleName: row.responsible_name,
    responsibleCreatedAt: formatDate(row.responsible_created_at),
    space:
      row.public_code &&
      row.questionnaire_id &&
      row.questionnaire_title &&
      row.questionnaire_version &&
      row.space_created_at
        ? {
            publicCode: row.public_code,
            questionnaireId: row.questionnaire_id,
            questionnaireTitle: row.questionnaire_title,
            questionnaireVersion: row.questionnaire_version,
            isActive: Boolean(row.space_is_active),
            createdAt: formatDate(row.space_created_at),
          }
        : null,
    recentActions: actionRows.map((action) => ({
      id: action.id,
      action: action.action,
      actorName: action.actor_name ?? action.actor_user_id,
      affectedSubmissions: Number(action.affected_submissions),
      createdAt: formatDate(action.created_at),
    })),
  };
}

export async function setAdminCentreSuspended(params: {
  actorUserId: string;
  centreId: string;
  suspended: boolean;
}): Promise<void> {
  await inCentreTransaction(params.centreId, async (connection, centre) => {
    await connection.execute(
      `
        update centres
        set is_suspended = ?,
            suspended_at = case when ? then current_timestamp(3) else null end,
            suspended_by = case when ? then ? else null end,
            updated_at = current_timestamp(3)
        where id = ?
      `,
      [
        params.suspended,
        params.suspended,
        params.suspended,
        params.actorUserId,
        params.centreId,
      ],
    );
    await connection.execute(
      "update diagnostic_spaces set is_active = ? where centre_id = ?",
      [!params.suspended, params.centreId],
    );
    await insertAuditAction(connection, {
      action: params.suspended ? "suspended" : "reactivated",
      actorUserId: params.actorUserId,
      affectedSubmissions: 0,
      centre,
    });
  });
}

export async function resetAdminCentreResponses(params: {
  actorUserId: string;
  centreId: string;
}): Promise<number> {
  return inCentreTransaction(params.centreId, async (connection, centre) => {
    const affectedSubmissions = await countCentreSubmissions(
      connection,
      params.centreId,
    );
    await deleteCentreResponses(connection, params.centreId);
    await insertAuditAction(connection, {
      action: "responses_reset",
      actorUserId: params.actorUserId,
      affectedSubmissions,
      centre,
    });
    return affectedSubmissions;
  });
}

export async function resetAdminCentreSpace(params: {
  actorUserId: string;
  centreId: string;
}): Promise<number> {
  for (let attempt = 0; attempt < MAX_SPACE_RESET_ATTEMPTS; attempt += 1) {
    try {
      return await inCentreTransaction(
        params.centreId,
        async (connection, centre) => {
          if (!centre.space_id) throw new AdminCentreOperationError();

          const affectedSubmissions = await countCentreSubmissions(
            connection,
            params.centreId,
          );
          await deleteCentreResponses(connection, params.centreId);
          await rotateAdminCentreDiagnosticSpace(connection, {
            centreId: params.centreId,
            keepSuspended: Boolean(centre.is_suspended),
          });
          await insertAuditAction(connection, {
            action: "space_reset",
            actorUserId: params.actorUserId,
            affectedSubmissions,
            centre,
          });
          return affectedSubmissions;
        },
      );
    } catch (error) {
      if (isDuplicatePublicCodeError(error)) continue;
      throw error;
    }
  }

  throw new AdminCentreOperationError();
}

export async function deleteAdminCentre(params: {
  actorUserId: string;
  centreId: string;
  confirmation: string;
}): Promise<number> {
  return inCentreTransaction(params.centreId, async (connection, centre) => {
    const expectedConfirmation = centre.official_code ?? centre.centre_email;
    if (params.confirmation.trim().toLowerCase() !== expectedConfirmation.toLowerCase()) {
      throw new AdminCentreOperationError("Invalid deletion confirmation");
    }

    const affectedSubmissions = await countCentreSubmissions(
      connection,
      params.centreId,
    );
    await deleteCentreResponses(connection, params.centreId);
    await connection.execute(
      "delete from diagnostic_spaces where centre_id = ?",
      [params.centreId],
    );
    await insertAuditAction(connection, {
      action: "deleted",
      actorUserId: params.actorUserId,
      affectedSubmissions,
      centre,
    });
    const [result] = await connection.execute<ResultSetHeader>(
      "delete from centres where id = ?",
      [params.centreId],
    );
    if (result.affectedRows !== 1) throw new AdminCentreOperationError();
    return affectedSubmissions;
  });
}

const CENTRE_SELECT = `
  select
    centres.id,
    centres.email as centre_email,
    centres.official_code,
    centres.official_name,
    centres.municipality,
    centres.territorial_area,
    centres.educational_service,
    centres.source_status,
    centres.profile_confirmed_at,
    centres.allow_xtec,
    centres.custom_domain,
    centres.email_policy_configured_at,
    centres.is_suspended,
    centre_accounts.email as responsible_email,
    centre_accounts.display_name as responsible_name,
    centre_accounts.created_at as responsible_created_at,
    centre_accounts.last_login_at,
    diagnostic_spaces.public_code,
    diagnostic_spaces.questionnaire_id,
    questionnaires.title as questionnaire_title,
    questionnaires.version as questionnaire_version,
    diagnostic_spaces.is_active as space_is_active,
    diagnostic_spaces.created_at as space_created_at,
    case
      when diagnostic_spaces.id is null then 0
      else (
        select count(*)
        from submissions
        where submissions.diagnostic_space_id = diagnostic_spaces.id
      )
    end as total_submissions
  from centres
  inner join centre_accounts on centre_accounts.centre_id = centres.id
  left join diagnostic_spaces on diagnostic_spaces.centre_id = centres.id
  left join questionnaires on questionnaires.id = diagnostic_spaces.questionnaire_id
`;

function mapCentreSummary(row: CentreRow): AdminManagedCentreSummary {
  return {
    id: row.id,
    displayName: row.official_name ?? row.responsible_name ?? row.centre_email,
    officialCode: row.official_code,
    municipality: row.municipality,
    responsibleEmail: row.responsible_email,
    lastLoginAt: formatNullableDate(row.last_login_at),
    isSuspended: Boolean(row.is_suspended),
    hasSpace: Boolean(row.public_code),
    totalSubmissions: Number(row.total_submissions),
  };
}

async function inCentreTransaction<T>(
  centreId: string,
  operation: (
    connection: PoolConnection,
    centre: LockedCentreRow,
  ) => Promise<T>,
): Promise<T> {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<LockedCentreRow[]>(
      `
        select
          centres.id,
          coalesce(centres.official_name, centre_accounts.display_name, centres.email) as label,
          centres.official_code,
          centres.email as centre_email,
          centres.is_suspended,
          diagnostic_spaces.id as space_id
        from centres
        inner join centre_accounts on centre_accounts.centre_id = centres.id
        left join diagnostic_spaces on diagnostic_spaces.centre_id = centres.id
        where centres.id = ?
        limit 1
        for update
      `,
      [centreId],
    );
    const centre = rows[0];
    if (!centre) throw new AdminCentreOperationError();
    const result = await operation(connection, centre);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function countCentreSubmissions(
  connection: PoolConnection,
  centreId: string,
): Promise<number> {
  const [rows] = await connection.execute<SubmissionCountRow[]>(
    `
      select count(*) as submission_count
      from submissions
      inner join diagnostic_spaces
        on diagnostic_spaces.id = submissions.diagnostic_space_id
      where diagnostic_spaces.centre_id = ?
    `,
    [centreId],
  );
  return Number(rows[0]?.submission_count ?? 0);
}

async function deleteCentreResponses(
  connection: PoolConnection,
  centreId: string,
): Promise<void> {
  await connection.execute(
    `
      delete answers
      from answers
      inner join submissions
        on submissions.id = answers.submission_id
        and submissions.questionnaire_id = answers.questionnaire_id
      inner join diagnostic_spaces
        on diagnostic_spaces.id = submissions.diagnostic_space_id
      where diagnostic_spaces.centre_id = ?
    `,
    [centreId],
  );
  await connection.execute(
    `
      delete submissions
      from submissions
      inner join diagnostic_spaces
        on diagnostic_spaces.id = submissions.diagnostic_space_id
      where diagnostic_spaces.centre_id = ?
    `,
    [centreId],
  );
  await connection.execute(
    `
      delete submission_locks
      from submission_locks
      inner join diagnostic_spaces
        on diagnostic_spaces.id = submission_locks.diagnostic_space_id
      where diagnostic_spaces.centre_id = ?
    `,
    [centreId],
  );
}

async function insertAuditAction(
  connection: PoolConnection,
  params: {
    action: AdminCentreAction;
    actorUserId: string;
    affectedSubmissions: number;
    centre: LockedCentreRow;
  },
): Promise<void> {
  await connection.execute(
    `
      insert into admin_centre_actions (
        id, centre_id, centre_label, action, actor_user_id, affected_submissions
      ) values (?, ?, ?, ?, ?, ?)
    `,
    [
      randomUUID(),
      params.centre.id,
      params.centre.label,
      params.action,
      params.actorUserId,
      params.affectedSubmissions,
    ],
  );
}

function isDuplicatePublicCodeError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY" &&
    "message" in error &&
    String(error.message).includes("diagnostic_spaces_public_code_key")
  );
}

function formatDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function formatNullableDate(value: string | Date | null): string | null {
  return value ? formatDate(value) : null;
}
