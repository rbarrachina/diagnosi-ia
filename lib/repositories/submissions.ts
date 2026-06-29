import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";
import { createSubmissionLockHmac } from "@/lib/submissions/submission-lock";
import {
  MAX_SUBMISSIONS_PER_SPACE,
  type SubmissionRequestInput,
} from "@/lib/validation/schemas";

export class InvalidSubmissionRepositoryError extends Error {
  constructor() {
    super("Invalid submission payload");
    this.name = "InvalidSubmissionRepositoryError";
  }
}

export class SubmissionLimitReachedRepositoryError extends Error {
  constructor() {
    super("Submission limit reached");
    this.name = "SubmissionLimitReachedRepositoryError";
  }
}

export class DuplicateSubmissionRepositoryError extends Error {
  constructor() {
    super("Submission already exists for this account");
    this.name = "DuplicateSubmissionRepositoryError";
  }
}

type DiagnosticSpaceRow = RowDataPacket & {
  diagnostic_space_id: string;
  questionnaire_id: string;
};

type SubmissionCountRow = RowDataPacket & {
  submission_count: number | string;
};

type SubmissionLockCountRow = RowDataPacket & {
  lock_count: number | string;
};

type QuestionRow = RowDataPacket & {
  id: string;
  scale_min: number;
  scale_max: number;
};

type SubmissionAnswerPayload = {
  questionId: string;
  value: 0 | 1 | 2 | 3;
};

type MysqlDuplicateError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
};

const answerKeys = new Set(["questionId", "value"]);

export async function hasAccountSubmittedToPublicQuestionnaire(params: {
  publicCode: string;
  accountId: string;
}): Promise<boolean> {
  const lockHmac = createSubmissionLockHmac({
    accountId: params.accountId,
    publicCode: params.publicCode,
  });
  const [rows] = await mysqlPool.execute<SubmissionLockCountRow[]>(
    `
      select count(*) as lock_count
      from submission_locks
      inner join diagnostic_spaces
        on diagnostic_spaces.id = submission_locks.diagnostic_space_id
      where diagnostic_spaces.public_code = ?
        and submission_locks.lock_hmac = ?
      limit 1
    `,
    [params.publicCode, lockHmac],
  );

  return Number(rows[0]?.lock_count ?? 0) > 0;
}

export async function createSubmissionWithAnswers(
  payload: SubmissionRequestInput,
  accountId: string,
): Promise<void> {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const space = await lockActiveDiagnosticSpace(connection, payload);
    await insertSubmissionLock(connection, {
      accountId,
      diagnosticSpaceId: space.diagnostic_space_id,
      publicCode: payload.publicCode,
    });
    const currentSubmissionCount = await countSubmissionsForSpace(
      connection,
      space.diagnostic_space_id,
    );

    if (currentSubmissionCount >= MAX_SUBMISSIONS_PER_SPACE) {
      throw new SubmissionLimitReachedRepositoryError();
    }

    const expectedQuestions = await getQuestionsForQuestionnaire(
      connection,
      space.questionnaire_id,
    );
    const answers = validateSubmissionAnswers(payload.answers, expectedQuestions);
    const submissionId = randomUUID();

    await connection.execute(
      `
        insert into submissions (id, diagnostic_space_id, questionnaire_id)
        values (?, ?, ?)
      `,
      [submissionId, space.diagnostic_space_id, space.questionnaire_id],
    );

    await insertAnswers(connection, submissionId, space.questionnaire_id, answers);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertSubmissionLock(
  connection: PoolConnection,
  params: {
    accountId: string;
    diagnosticSpaceId: string;
    publicCode: string;
  },
): Promise<void> {
  const lockHmac = createSubmissionLockHmac({
    accountId: params.accountId,
    publicCode: params.publicCode,
  });

  try {
    await connection.execute(
      `
        insert into submission_locks (diagnostic_space_id, public_code, lock_hmac)
        values (?, ?, ?)
      `,
      [params.diagnosticSpaceId, params.publicCode, lockHmac],
    );
  } catch (error) {
    if (isDuplicateError(error)) {
      throw new DuplicateSubmissionRepositoryError();
    }

    throw error;
  }
}

async function lockActiveDiagnosticSpace(
  connection: PoolConnection,
  payload: SubmissionRequestInput,
): Promise<DiagnosticSpaceRow> {
  const [rows] = await connection.execute<DiagnosticSpaceRow[]>(
    `
      select
        diagnostic_spaces.id as diagnostic_space_id,
        diagnostic_spaces.questionnaire_id as questionnaire_id
      from diagnostic_spaces
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      where diagnostic_spaces.public_code = ?
        and diagnostic_spaces.is_active = true
        and questionnaires.version = ?
      limit 1
      for update
    `,
    [payload.publicCode, payload.questionnaireVersion],
  );

  const [space] = rows;

  if (!space) {
    throw new InvalidSubmissionRepositoryError();
  }

  return space;
}

async function countSubmissionsForSpace(
  connection: PoolConnection,
  diagnosticSpaceId: string,
): Promise<number> {
  const [rows] = await connection.execute<SubmissionCountRow[]>(
    `
      select count(*) as submission_count
      from submissions
      where diagnostic_space_id = ?
    `,
    [diagnosticSpaceId],
  );

  return Number(rows[0]?.submission_count ?? 0);
}

async function getQuestionsForQuestionnaire(
  connection: PoolConnection,
  questionnaireId: string,
): Promise<QuestionRow[]> {
  const [rows] = await connection.execute<QuestionRow[]>(
    `
      select id, scale_min, scale_max
      from questions
      where questionnaire_id = ?
    `,
    [questionnaireId],
  );

  if (rows.length === 0) {
    throw new InvalidSubmissionRepositoryError();
  }

  return rows;
}

function validateSubmissionAnswers(
  answers: SubmissionRequestInput["answers"],
  expectedQuestions: QuestionRow[],
): SubmissionAnswerPayload[] {
  if (!Array.isArray(answers) || answers.length !== expectedQuestions.length) {
    throw new InvalidSubmissionRepositoryError();
  }

  const expectedQuestionsById = new Map(
    expectedQuestions.map((question) => [question.id, question]),
  );
  const seenQuestionIds = new Set<string>();
  const sanitizedAnswers: SubmissionAnswerPayload[] = [];

  for (const answer of answers) {
    if (!isStrictAnswerPayload(answer)) {
      throw new InvalidSubmissionRepositoryError();
    }

    if (seenQuestionIds.has(answer.questionId)) {
      throw new InvalidSubmissionRepositoryError();
    }

    const expectedQuestion = expectedQuestionsById.get(answer.questionId);

    if (!expectedQuestion) {
      throw new InvalidSubmissionRepositoryError();
    }

    if (answer.value < expectedQuestion.scale_min || answer.value > expectedQuestion.scale_max) {
      throw new InvalidSubmissionRepositoryError();
    }

    seenQuestionIds.add(answer.questionId);
    sanitizedAnswers.push({
      questionId: answer.questionId,
      value: answer.value,
    });
  }

  if (seenQuestionIds.size !== expectedQuestions.length) {
    throw new InvalidSubmissionRepositoryError();
  }

  return sanitizedAnswers;
}

function isStrictAnswerPayload(value: unknown): value is SubmissionAnswerPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length !== answerKeys.size || keys.some((key) => !answerKeys.has(key))) {
    return false;
  }

  const answer = value as Record<string, unknown>;

  return (
    typeof answer.questionId === "string" &&
    Number.isInteger(answer.value) &&
    (
      answer.value === 0 ||
      answer.value === 1 ||
      answer.value === 2 ||
      answer.value === 3
    )
  );
}

async function insertAnswers(
  connection: PoolConnection,
  submissionId: string,
  questionnaireId: string,
  answers: SubmissionAnswerPayload[],
): Promise<void> {
  const placeholders = answers.map(() => "(?, ?, ?, ?)").join(", ");
  const values = answers.flatMap((answer) => [
    submissionId,
    questionnaireId,
    answer.questionId,
    answer.value,
  ]);

  await connection.execute(
    `
      insert into answers (submission_id, questionnaire_id, question_id, value)
      values ${placeholders}
    `,
    values,
  );
}

function isDuplicateError(error: unknown): boolean {
  const duplicateError = error as MysqlDuplicateError;

  return duplicateError.code === "ER_DUP_ENTRY" || duplicateError.errno === 1062;
}
