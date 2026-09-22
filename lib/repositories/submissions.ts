import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";
import {
  MAX_SUBMISSIONS_PER_SPACE,
  type SubmissionRequestInput,
} from "@/lib/validation/schemas";
import type { AppAuthenticatedUser } from "@/lib/auth/local";
import { isEmailAllowedByCentrePolicy } from "@/lib/centres/email-policy";

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
  allow_xtec: number | boolean;
  custom_domain: string | null;
  email_policy_configured_at: string | Date | null;
};

type SubmissionCountRow = RowDataPacket & {
  submission_count: number | string;
};

type ParticipantSubmissionCountRow = RowDataPacket & {
  participation_count: number | string;
};

type QuestionRow = RowDataPacket & {
  id: string;
  option_id: string;
  score: 0 | 1 | 2 | 3;
};

type SubmissionAnswerPayload = {
  questionId: string;
  optionId: string;
  value: 0 | 1 | 2 | 3;
};

type MysqlDuplicateError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
};

const answerKeys = new Set(["questionId", "optionId"]);

export async function hasAccountSubmittedToPublicQuestionnaire(params: {
  publicCode: string;
  accountId: string;
}): Promise<boolean> {
  const [rows] = await mysqlPool.execute<ParticipantSubmissionCountRow[]>(
    `
      select count(*) as participation_count
      from participant_submissions
      inner join diagnostic_spaces
        on diagnostic_spaces.id = participant_submissions.diagnostic_space_id
      where diagnostic_spaces.public_code = ?
        and participant_submissions.participant_user_id = ?
      limit 1
    `,
    [params.publicCode, params.accountId],
  );

  return Number(rows[0]?.participation_count ?? 0) > 0;
}

export async function createSubmissionWithAnswers(
  payload: SubmissionRequestInput,
  user: Pick<AppAuthenticatedUser, "id" | "email">,
): Promise<void> {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const space = await lockActiveDiagnosticSpace(connection, payload);
    if (
      !isEmailAllowedByCentrePolicy(user.email, {
        allowXtec: Boolean(space.allow_xtec),
        customDomain: space.custom_domain,
        configured: Boolean(space.email_policy_configured_at),
      })
    ) {
      throw new InvalidSubmissionRepositoryError();
    }
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

    await insertParticipantSubmission(connection, {
      participantUserId: user.id,
      diagnosticSpaceId: space.diagnostic_space_id,
      submissionId,
    });
    await insertAnswers(connection, submissionId, space.questionnaire_id, answers);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertParticipantSubmission(
  connection: PoolConnection,
  params: {
    participantUserId: string;
    diagnosticSpaceId: string;
    submissionId: string;
  },
): Promise<void> {
  try {
    await connection.execute(
      `
        insert into participant_submissions
          (submission_id, diagnostic_space_id, participant_user_id)
        values (?, ?, ?)
      `,
      [params.submissionId, params.diagnosticSpaceId, params.participantUserId],
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
        diagnostic_spaces.questionnaire_id as questionnaire_id,
        centres.allow_xtec,
        centres.custom_domain,
        centres.email_policy_configured_at
      from diagnostic_spaces
      inner join centres on centres.id = diagnostic_spaces.centre_id
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      where diagnostic_spaces.public_code = ?
        and diagnostic_spaces.is_active = true
        and centres.is_suspended = false
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
      select
        questions.id,
        question_options.id as option_id,
        question_options.score
      from questions
      inner join question_options
        on question_options.question_id = questions.id
       and question_options.questionnaire_id = questions.questionnaire_id
      where questions.questionnaire_id = ?
    `,
    [questionnaireId],
  );

  if (rows.length === 0 || rows.length % 4 !== 0) {
    throw new InvalidSubmissionRepositoryError();
  }

  const scoresByQuestion = new Map<string, Set<number>>();
  for (const row of rows) {
    const scores = scoresByQuestion.get(row.id) ?? new Set<number>();
    scores.add(row.score);
    scoresByQuestion.set(row.id, scores);
  }

  if ([...scoresByQuestion.values()].some((scores) => scores.size !== 4)) {
    throw new InvalidSubmissionRepositoryError();
  }

  return rows;
}

function validateSubmissionAnswers(
  answers: SubmissionRequestInput["answers"],
  expectedQuestions: QuestionRow[],
): SubmissionAnswerPayload[] {
  const expectedQuestionIds = new Set(expectedQuestions.map((question) => question.id));

  if (!Array.isArray(answers) || answers.length !== expectedQuestionIds.size) {
    throw new InvalidSubmissionRepositoryError();
  }

  const expectedOptionsById = new Map(
    expectedQuestions.map((question) => [question.option_id, question]),
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

    const expectedOption = expectedOptionsById.get(answer.optionId);

    if (!expectedOption || expectedOption.id !== answer.questionId) {
      throw new InvalidSubmissionRepositoryError();
    }

    seenQuestionIds.add(answer.questionId);
    sanitizedAnswers.push({
      questionId: answer.questionId,
      optionId: answer.optionId,
      value: expectedOption.score,
    });
  }

  if (seenQuestionIds.size !== expectedQuestionIds.size) {
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
    typeof answer.optionId === "string"
  );
}

async function insertAnswers(
  connection: PoolConnection,
  submissionId: string,
  questionnaireId: string,
  answers: SubmissionAnswerPayload[],
): Promise<void> {
  const placeholders = answers.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const values = answers.flatMap((answer) => [
    submissionId,
    questionnaireId,
    answer.questionId,
    answer.optionId,
    answer.value,
  ]);

  await connection.execute(
    `
      insert into answers (submission_id, questionnaire_id, question_id, option_id, value)
      values ${placeholders}
    `,
    values,
  );
}

function isDuplicateError(error: unknown): boolean {
  const duplicateError = error as MysqlDuplicateError;

  return duplicateError.code === "ER_DUP_ENTRY" || duplicateError.errno === 1062;
}
