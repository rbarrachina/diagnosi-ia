import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { getAdminResultsMinimumSubmissions } from "@/lib/auth/responsible-access";
import { mysqlPool } from "@/lib/db/client";
import { calculateAggregatedResultsFromCounts } from "@/lib/results/calculate-results";
import { verifyResultsToken } from "@/lib/results/results-token";
import type {
  AnswerCountRecord,
  BlockDefinition,
  QuestionDefinition,
  ScaleValue,
} from "@/lib/results/types";
import {
  adminResultsRequestSchema,
  type AdminResultsRequestInput,
  type PrivateResultsRequestInput,
} from "@/lib/validation/schemas";

export class ResultsAccessError extends Error {
  constructor() {
    super("Invalid results credentials");
    this.name = "ResultsAccessError";
  }
}

type SpaceRow = RowDataPacket & {
  id: string;
  public_code: string;
  results_token_hash: string;
  results_token_enabled: number | boolean;
  results_token_expires_at: string | Date | null;
  is_active: number | boolean;
  questionnaire_id: string;
  questionnaire_version: string;
  centre_name: string;
};

type QuestionnaireRow = RowDataPacket & {
  id: string;
  version: string;
};

type AdminResultsCentreRow = RowDataPacket & {
  id: string;
  name: string;
};

type BlockRow = RowDataPacket & {
  id: string;
  position: number;
  title: string;
};

type QuestionRow = RowDataPacket & {
  id: string;
  block_id: string;
  position: number;
  block_position: number;
  text: string;
};

type SubmissionCountRow = RowDataPacket & {
  submission_count: number | string;
};

type DiagnosticSpaceCountRow = RowDataPacket & {
  diagnostic_space_count: number | string;
};

type AnswerCountRow = RowDataPacket & {
  question_id: string;
  value: number;
  answer_count: number | string;
};

export async function getAggregatedResults(payload: PrivateResultsRequestInput) {
  const space = await loadSharedTokenSpace(payload);

  return getAggregatedResultsForSpace(space);
}

export async function getAggregatedResultsForOwner(params: {
  publicCode: string;
  ownerUserId: string;
}) {
  const space = await loadOwnerSpace(params.publicCode, params.ownerUserId);

  return getAggregatedResultsForSpace(space);
}

export async function getAggregatedResultsForQuestionnaireVersion(
  input: AdminResultsRequestInput,
) {
  const payload = adminResultsRequestSchema.parse(input);
  const [questionnaire, minimumSubmissions, centre] = await Promise.all([
    loadQuestionnaireById(payload.questionnaireId),
    getAdminResultsMinimumSubmissions(),
    payload.scope === "centre"
      ? loadAdminResultsCentreById(payload.centreId)
      : Promise.resolve(null),
  ]);

  return getAggregatedResultsForQuestionnaire(
    questionnaire,
    minimumSubmissions,
    centre,
  );
}

async function loadSharedTokenSpace(
  payload: PrivateResultsRequestInput,
): Promise<SpaceRow> {
  const space = await loadSpaceByPublicCode(payload.publicCode);
  const expiresAt = parseNullableDate(space.results_token_expires_at);

  if (
    !toBoolean(space.results_token_enabled) ||
    (expiresAt && expiresAt.getTime() < Date.now()) ||
    !verifyResultsToken(payload.privateToken, space.results_token_hash)
  ) {
    throw new ResultsAccessError();
  }

  return space;
}

async function loadSpaceByPublicCode(publicCode: string): Promise<SpaceRow> {
  const [rows] = await mysqlPool.execute<SpaceRow[]>(
    `
      select
        diagnostic_spaces.id,
        diagnostic_spaces.public_code,
        diagnostic_spaces.results_token_hash,
        diagnostic_spaces.results_token_enabled,
        diagnostic_spaces.results_token_expires_at,
        diagnostic_spaces.is_active,
        questionnaires.id as questionnaire_id,
        questionnaires.version as questionnaire_version
        , coalesce(
            centres.official_name,
            centre_accounts.display_name,
            centres.email,
            admin_users.display_name,
            admin_users.email,
            'Centre educatiu'
          ) as centre_name
      from diagnostic_spaces
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      left join centres on centres.id = diagnostic_spaces.centre_id
      left join centre_accounts on centre_accounts.centre_id = centres.id
      left join admin_users on admin_users.user_id = diagnostic_spaces.owner_user_id
      where diagnostic_spaces.public_code = ?
      limit 1
    `,
    [publicCode],
  );

  const [space] = rows;

  if (!space || !toBoolean(space.is_active)) {
    throw new ResultsAccessError();
  }

  return space;
}

async function loadOwnerSpace(
  publicCode: string,
  ownerUserId: string,
): Promise<SpaceRow> {
  const [rows] = await mysqlPool.execute<SpaceRow[]>(
    `
      select
        diagnostic_spaces.id,
        diagnostic_spaces.public_code,
        diagnostic_spaces.results_token_hash,
        diagnostic_spaces.results_token_enabled,
        diagnostic_spaces.results_token_expires_at,
        diagnostic_spaces.is_active,
        questionnaires.id as questionnaire_id,
        questionnaires.version as questionnaire_version
        , coalesce(
            centres.official_name,
            centre_accounts.display_name,
            centres.email,
            admin_users.display_name,
            admin_users.email,
            'Centre educatiu'
          ) as centre_name
      from diagnostic_spaces
      inner join questionnaires
        on questionnaires.id = diagnostic_spaces.questionnaire_id
      left join centres on centres.id = diagnostic_spaces.centre_id
      left join centre_accounts on centre_accounts.centre_id = centres.id
      left join admin_users on admin_users.user_id = diagnostic_spaces.owner_user_id
      where diagnostic_spaces.public_code = ?
        and diagnostic_spaces.owner_user_id = ?
      limit 1
    `,
    [publicCode, ownerUserId],
  );

  const [space] = rows;

  if (!space || !toBoolean(space.is_active)) {
    throw new ResultsAccessError();
  }

  return space;
}

async function loadQuestionnaireById(questionnaireId: string): Promise<QuestionnaireRow> {
  const [rows] = await mysqlPool.execute<QuestionnaireRow[]>(
    `
      select id, version
      from questionnaires
      where id = ?
      limit 1
    `,
    [questionnaireId],
  );

  const [questionnaire] = rows;

  if (!questionnaire) {
    throw new ResultsAccessError();
  }

  return questionnaire;
}

async function loadAdminResultsCentreById(
  centreId: string,
): Promise<AdminResultsCentreRow> {
  const [rows] = await mysqlPool.execute<AdminResultsCentreRow[]>(
    `
      select
        centres.id,
        coalesce(centres.official_name, centres.email) as name
      from centres
      where centres.id = ?
        and exists (
          select 1
          from diagnostic_spaces
          where diagnostic_spaces.centre_id = centres.id
        )
      limit 1
    `,
    [centreId],
  );

  const [centre] = rows;

  if (!centre) {
    throw new ResultsAccessError();
  }

  return centre;
}

async function getAggregatedResultsForSpace(space: SpaceRow) {
  const [
    [blocks],
    [questions],
    [submissionCounts],
    [answerCounts],
  ] = await Promise.all([
    mysqlPool.execute<BlockRow[]>(
      `
        select id, position, title
        from question_blocks
        where questionnaire_id = ?
        order by position asc
      `,
      [space.questionnaire_id],
    ),
    mysqlPool.execute<QuestionRow[]>(
      `
        select id, block_id, position, block_position, text
        from questions
        where questionnaire_id = ?
        order by position asc
      `,
      [space.questionnaire_id],
    ),
    mysqlPool.execute<SubmissionCountRow[]>(
      `
        select count(*) as submission_count
        from submissions
        where diagnostic_space_id = ?
          and questionnaire_id = ?
      `,
      [space.id, space.questionnaire_id],
    ),
    mysqlPool.execute<AnswerCountRow[]>(
      `
        select
          answers.question_id,
          answers.value,
          count(*) as answer_count
        from answers
        inner join submissions
          on submissions.id = answers.submission_id
          and submissions.questionnaire_id = answers.questionnaire_id
        where submissions.diagnostic_space_id = ?
          and submissions.questionnaire_id = ?
        group by answers.question_id, answers.value
      `,
      [space.id, space.questionnaire_id],
    ),
  ]);

  return calculateAggregatedResultsFromCounts({
    centreName: space.centre_name,
    publicCode: space.public_code,
    scopeLabel: space.centre_name,
    questionnaireVersion: space.questionnaire_version,
    generatedAt: new Date().toISOString(),
    totalSubmissions: Number(submissionCounts[0]?.submission_count ?? 0),
    blocks: mapBlocks(blocks),
    questions: mapQuestions(questions),
    answerCounts: mapAnswerCounts(answerCounts),
  });
}

async function getAggregatedResultsForQuestionnaire(
  questionnaire: QuestionnaireRow,
  minimumSubmissions: number,
  centre: AdminResultsCentreRow | null,
) {
  const centreFilter = centre ? "and diagnostic_spaces.centre_id = ?" : "";
  const eligibilityValues = centre
    ? [questionnaire.id, centre.id, minimumSubmissions]
    : [questionnaire.id, minimumSubmissions];
  const [
    [blocks],
    [questions],
    [diagnosticSpaceCounts],
    [submissionCounts],
    [answerCounts],
  ] = await Promise.all([
    mysqlPool.execute<BlockRow[]>(
      `
        select id, position, title
        from question_blocks
        where questionnaire_id = ?
        order by position asc
      `,
      [questionnaire.id],
    ),
    mysqlPool.execute<QuestionRow[]>(
      `
        select id, block_id, position, block_position, text
        from questions
        where questionnaire_id = ?
        order by position asc
      `,
      [questionnaire.id],
    ),
    mysqlPool.execute<DiagnosticSpaceCountRow[]>(
      `
        select count(*) as diagnostic_space_count
        from (
          select diagnostic_spaces.id
          from diagnostic_spaces
          left join submissions
            on submissions.diagnostic_space_id = diagnostic_spaces.id
            and submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
          where diagnostic_spaces.questionnaire_id = ?
            ${centreFilter}
          group by diagnostic_spaces.id
          having count(submissions.id) > ?
        ) eligible_spaces
      `,
      eligibilityValues,
    ),
    mysqlPool.execute<SubmissionCountRow[]>(
      `
        select count(*) as submission_count
        from submissions
        inner join (
          select diagnostic_spaces.id
          from diagnostic_spaces
          left join submissions as space_submissions
            on space_submissions.diagnostic_space_id = diagnostic_spaces.id
            and space_submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
          where diagnostic_spaces.questionnaire_id = ?
            ${centreFilter}
          group by diagnostic_spaces.id
          having count(space_submissions.id) > ?
        ) eligible_spaces
          on eligible_spaces.id = submissions.diagnostic_space_id
        where submissions.questionnaire_id = ?
      `,
      [...eligibilityValues, questionnaire.id],
    ),
    mysqlPool.execute<AnswerCountRow[]>(
      `
        select
          answers.question_id,
          answers.value,
          count(*) as answer_count
        from answers
        inner join submissions
          on submissions.id = answers.submission_id
          and submissions.questionnaire_id = answers.questionnaire_id
        inner join (
          select diagnostic_spaces.id
          from diagnostic_spaces
          left join submissions as space_submissions
            on space_submissions.diagnostic_space_id = diagnostic_spaces.id
            and space_submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
          where diagnostic_spaces.questionnaire_id = ?
            ${centreFilter}
          group by diagnostic_spaces.id
          having count(space_submissions.id) > ?
        ) eligible_spaces
          on eligible_spaces.id = submissions.diagnostic_space_id
        where answers.questionnaire_id = ?
        group by answers.question_id, answers.value
      `,
      [...eligibilityValues, questionnaire.id],
    ),
  ]);

  return calculateAggregatedResultsFromCounts({
    centreName: centre?.name,
    publicCode: centre ? "CENTRE" : "GLOBAL",
    scopeLabel: centre?.name ?? "Tots els centres",
    questionnaireVersion: questionnaire.version,
    generatedAt: new Date().toISOString(),
    diagnosticSpaceCount: centre
      ? undefined
      : Number(diagnosticSpaceCounts[0]?.diagnostic_space_count ?? 0),
    totalSubmissions: Number(submissionCounts[0]?.submission_count ?? 0),
    blocks: mapBlocks(blocks),
    questions: mapQuestions(questions),
    answerCounts: mapAnswerCounts(answerCounts),
  });
}

function mapBlocks(blocks: BlockRow[]): BlockDefinition[] {
  return blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
  }));
}

function mapQuestions(questions: QuestionRow[]): QuestionDefinition[] {
  return questions.map((question) => ({
    id: question.id,
    blockId: question.block_id,
    position: question.position,
    blockPosition: question.block_position,
    text: question.text,
  }));
}

function mapAnswerCounts(answerCounts: AnswerCountRow[]): AnswerCountRecord[] {
  return answerCounts.map((answerCount) => ({
    questionId: answerCount.question_id,
    value: toScaleValue(answerCount.value),
    count: Number(answerCount.answer_count),
  }));
}

function toScaleValue(value: number): ScaleValue {
  if (value !== 0 && value !== 1 && value !== 2 && value !== 3) {
    throw new Error("Invalid aggregated answer value");
  }

  return value;
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function parseNullableDate(value: string | Date | null): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}
