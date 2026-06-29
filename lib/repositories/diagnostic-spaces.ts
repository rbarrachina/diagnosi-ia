import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { generatePublicCode } from "@/lib/crypto/public-code";
import { mysqlPool } from "@/lib/db/client";
import {
  buildOwnerResultsUrl,
  buildSharedResultsUrl,
  decryptStoredResultsToken,
  generateResultsToken,
} from "@/lib/results/results-token";

const MAX_PUBLIC_CODE_ATTEMPTS = 8;

export class OwnerSpaceAlreadyExistsError extends Error {
  constructor() {
    super("Owner already has a diagnostic space");
    this.name = "OwnerSpaceAlreadyExistsError";
  }
}

export type CreatedDiagnosticSpace = {
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  sharedResultsUrl: string;
  ownerResultsUrl: string;
  questionnairePreviewUrl: string;
  publicUrl: string;
  totalSubmissions: number;
};

export type OwnerDiagnosticSpace = {
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  isActive: boolean;
  createdAt: string;
  publicUrl: string;
  ownerResultsUrl: string;
  questionnairePreviewUrl: string;
  sharedResultsUrl: string | null;
  resultsTokenEnabled: boolean;
  totalSubmissions: number;
};

export type ResetOwnerDiagnosticSpaceResult = {
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  publicUrl: string;
  ownerResultsUrl: string;
  questionnairePreviewUrl: string;
  sharedResultsUrl: string;
  totalSubmissions: number;
};

type ActiveQuestionnaireRow = RowDataPacket & {
  id: string;
  title: string;
  version: string;
};

type OwnerSpaceRow = RowDataPacket & {
  id: string;
  public_code: string;
  is_active: number | boolean;
  created_at: string | Date;
  results_token_enabled: number | boolean;
  results_token_encrypted: string | null;
  questionnaire_title: string;
  questionnaire_version: string;
  total_submissions: number | string;
};

type ExistingSpaceRow = RowDataPacket & {
  id: string;
  public_code: string;
};

type MysqlDuplicateError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
};

export async function createDiagnosticSpace(
  appUrl: string,
  ownerUserId: string,
): Promise<CreatedDiagnosticSpace> {
  const existingSpace = await getExistingOwnerSpace(ownerUserId);

  if (existingSpace) {
    throw new OwnerSpaceAlreadyExistsError();
  }

  const questionnaire = await getActiveQuestionnaire();
  const resultsToken = generateResultsToken();

  for (let attempt = 0; attempt < MAX_PUBLIC_CODE_ATTEMPTS; attempt += 1) {
    const publicCode = generatePublicCode();

    try {
      await mysqlPool.execute(
        `
          insert into diagnostic_spaces (
            id,
            public_code,
            private_token_hmac,
            owner_user_id,
            results_token_hash,
            results_token_encrypted,
            results_token_enabled,
            results_token_expires_at,
            questionnaire_id,
            is_active
          ) values (?, ?, ?, ?, ?, ?, true, null, ?, true)
        `,
        [
          randomUUID(),
          publicCode,
          resultsToken.hash,
          ownerUserId,
          resultsToken.hash,
          resultsToken.encrypted,
          questionnaire.id,
        ],
      );

      return mapCreatedSpace({
        appUrl,
        publicCode,
        questionnaire,
        token: resultsToken.token,
      });
    } catch (error) {
      if (isDuplicateForIndex(error, "diagnostic_spaces_owner_user_id_unique_idx")) {
        throw new OwnerSpaceAlreadyExistsError();
      }

      if (isDuplicateForIndex(error, "diagnostic_spaces_public_code_key")) {
        continue;
      }

      throw new Error("Could not create diagnostic space");
    }
  }

  throw new Error("Could not generate a unique public code");
}

export async function listOwnerSpaces(
  ownerUserId: string,
  appUrl: string,
): Promise<OwnerDiagnosticSpace[]> {
  const [rows] = await mysqlPool.execute<OwnerSpaceRow[]>(
    `
      select
        diagnostic_spaces.id,
        diagnostic_spaces.public_code,
        diagnostic_spaces.is_active,
        diagnostic_spaces.created_at,
        diagnostic_spaces.results_token_enabled,
        diagnostic_spaces.results_token_encrypted,
        questionnaires.title as questionnaire_title,
        questionnaires.version as questionnaire_version,
        (
          select count(*)
          from submissions
          where submissions.diagnostic_space_id = diagnostic_spaces.id
        ) as total_submissions
      from diagnostic_spaces
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      where diagnostic_spaces.owner_user_id = ?
      order by diagnostic_spaces.created_at desc
    `,
    [ownerUserId],
  );

  return rows.map((row) => mapOwnerSpace(row, appUrl));
}

export async function getOwnerSpace(
  ownerUserId: string,
  publicCode: string,
  appUrl: string,
): Promise<OwnerDiagnosticSpace | null> {
  const [rows] = await mysqlPool.execute<OwnerSpaceRow[]>(
    `
      select
        diagnostic_spaces.id,
        diagnostic_spaces.public_code,
        diagnostic_spaces.is_active,
        diagnostic_spaces.created_at,
        diagnostic_spaces.results_token_enabled,
        diagnostic_spaces.results_token_encrypted,
        questionnaires.title as questionnaire_title,
        questionnaires.version as questionnaire_version,
        (
          select count(*)
          from submissions
          where submissions.diagnostic_space_id = diagnostic_spaces.id
        ) as total_submissions
      from diagnostic_spaces
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      where diagnostic_spaces.owner_user_id = ?
        and diagnostic_spaces.public_code = ?
      limit 1
    `,
    [ownerUserId, publicCode],
  );

  const [space] = rows;

  return space ? mapOwnerSpace(space, appUrl) : null;
}

export async function regenerateOwnerResultsToken(params: {
  ownerUserId: string;
  publicCode: string;
  appUrl: string;
}): Promise<{ sharedResultsUrl: string }> {
  const resultsToken = generateResultsToken();
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    `
      update diagnostic_spaces
      set
        private_token_hmac = ?,
        results_token_hash = ?,
        results_token_encrypted = ?,
        results_token_enabled = true,
        results_token_created_at = current_timestamp(3),
        results_token_expires_at = null
      where owner_user_id = ?
        and public_code = ?
    `,
    [
      resultsToken.hash,
      resultsToken.hash,
      resultsToken.encrypted,
      params.ownerUserId,
      params.publicCode,
    ],
  );

  if (result.affectedRows !== 1) {
    throw new Error("Could not regenerate results token");
  }

  return {
    sharedResultsUrl: buildSharedResultsUrl(
      params.appUrl,
      params.publicCode,
      resultsToken.token,
    ),
  };
}

export async function resetOwnerDiagnosticSpace(params: {
  ownerUserId: string;
  publicCode: string;
  appUrl: string;
}): Promise<ResetOwnerDiagnosticSpaceResult> {
  for (let attempt = 0; attempt < MAX_PUBLIC_CODE_ATTEMPTS; attempt += 1) {
    const connection = await mysqlPool.getConnection();
    const newPublicCode = generatePublicCode();
    const resultsToken = generateResultsToken();

    try {
      await connection.beginTransaction();

      const space = await lockOwnerSpaceForReset(connection, params);
      const questionnaire = await getActiveQuestionnaire(connection);

      await connection.execute(
        `
          delete answers
          from answers
          inner join submissions
            on submissions.id = answers.submission_id
            and submissions.questionnaire_id = answers.questionnaire_id
          where submissions.diagnostic_space_id = ?
        `,
        [space.id],
      );
      await connection.execute(
        `
          delete from submissions
          where diagnostic_space_id = ?
        `,
        [space.id],
      );
      await connection.execute(
        `
          delete from submission_locks
          where diagnostic_space_id = ?
        `,
        [space.id],
      );
      await connection.execute(
        `
          update diagnostic_spaces
          set
            public_code = ?,
            private_token_hmac = ?,
            results_token_hash = ?,
            results_token_encrypted = ?,
            results_token_enabled = true,
            results_token_created_at = current_timestamp(3),
            results_token_expires_at = null,
            questionnaire_id = ?,
            is_active = true,
            closed_at = null
          where id = ?
            and owner_user_id = ?
        `,
        [
          newPublicCode,
          resultsToken.hash,
          resultsToken.hash,
          resultsToken.encrypted,
          questionnaire.id,
          space.id,
          params.ownerUserId,
        ],
      );

      await connection.commit();

      return {
        publicCode: newPublicCode,
        questionnaireTitle: questionnaire.title,
        questionnaireVersion: questionnaire.version,
        publicUrl: `${params.appUrl}/q/${newPublicCode}`,
        ownerResultsUrl: buildOwnerResultsUrl(params.appUrl, newPublicCode),
        questionnairePreviewUrl: `${params.appUrl}/espais/${newPublicCode}/questionari`,
        sharedResultsUrl: buildSharedResultsUrl(
          params.appUrl,
          newPublicCode,
          resultsToken.token,
        ),
        totalSubmissions: 0,
      };
    } catch (error) {
      await connection.rollback();

      if (isDuplicateForIndex(error, "diagnostic_spaces_public_code_key")) {
        continue;
      }

      throw error instanceof Error ? error : new Error("Could not reset diagnostic space");
    } finally {
      connection.release();
    }
  }

  throw new Error("Could not generate a unique public code");
}

async function getExistingOwnerSpace(ownerUserId: string): Promise<ExistingSpaceRow | null> {
  const [rows] = await mysqlPool.execute<ExistingSpaceRow[]>(
    `
      select id, public_code
      from diagnostic_spaces
      where owner_user_id = ?
      limit 1
    `,
    [ownerUserId],
  );

  return rows[0] ?? null;
}

async function getActiveQuestionnaire(
  connection: Pick<PoolConnection, "execute"> = mysqlPool,
): Promise<ActiveQuestionnaireRow> {
  const [rows] = await connection.execute<ActiveQuestionnaireRow[]>(
    `
      select id, title, version
      from questionnaires
      where is_active = true
      order by created_at desc, id desc
      limit 1
    `,
  );

  const [questionnaire] = rows;

  if (!questionnaire) {
    throw new Error("Active questionnaire version not found");
  }

  return questionnaire;
}

async function lockOwnerSpaceForReset(
  connection: PoolConnection,
  params: { ownerUserId: string; publicCode: string },
): Promise<ExistingSpaceRow> {
  const [rows] = await connection.execute<ExistingSpaceRow[]>(
    `
      select id, public_code
      from diagnostic_spaces
      where owner_user_id = ?
        and public_code = ?
      limit 1
      for update
    `,
    [params.ownerUserId, params.publicCode],
  );

  const [space] = rows;

  if (!space) {
    throw new Error("Could not load owner diagnostic space");
  }

  return space;
}

function mapCreatedSpace(params: {
  appUrl: string;
  publicCode: string;
  questionnaire: ActiveQuestionnaireRow;
  token: string;
}): CreatedDiagnosticSpace {
  return {
    publicCode: params.publicCode,
    questionnaireTitle: params.questionnaire.title,
    questionnaireVersion: params.questionnaire.version,
    publicUrl: `${params.appUrl}/q/${params.publicCode}`,
    sharedResultsUrl: buildSharedResultsUrl(
      params.appUrl,
      params.publicCode,
      params.token,
    ),
    ownerResultsUrl: buildOwnerResultsUrl(params.appUrl, params.publicCode),
    questionnairePreviewUrl: `${params.appUrl}/espais/${params.publicCode}/questionari`,
    totalSubmissions: 0,
  };
}

function mapOwnerSpace(row: OwnerSpaceRow, appUrl: string): OwnerDiagnosticSpace {
  const token = decryptStoredResultsToken(row.results_token_encrypted);

  return {
    publicCode: row.public_code,
    questionnaireTitle: row.questionnaire_title,
    questionnaireVersion: row.questionnaire_version,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    publicUrl: `${appUrl}/q/${row.public_code}`,
    ownerResultsUrl: buildOwnerResultsUrl(appUrl, row.public_code),
    questionnairePreviewUrl: `${appUrl}/espais/${row.public_code}/questionari`,
    sharedResultsUrl: token ? buildSharedResultsUrl(appUrl, row.public_code, token) : null,
    resultsTokenEnabled: toBoolean(row.results_token_enabled),
    totalSubmissions: Number(row.total_submissions),
  };
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function formatDateTime(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function isDuplicateForIndex(error: unknown, indexName: string): boolean {
  const duplicateError = error as MysqlDuplicateError;
  const message = `${duplicateError.sqlMessage ?? ""} ${duplicateError.message ?? ""}`;

  return (
    (duplicateError.code === "ER_DUP_ENTRY" || duplicateError.errno === 1062) &&
    message.includes(indexName)
  );
}
