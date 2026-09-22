import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "@/lib/db/client";
import type { ScaleValue } from "@/lib/results/types";
import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";
import type {
  ParticipantBlockResult,
  ParticipantResult,
  ParticipantSummary,
} from "@/lib/participants/types";

type SummaryRow = RowDataPacket & {
  centre_name: string;
  public_code: string;
  questionnaire_title: string;
  questionnaire_version: string;
  language_code: QuestionnaireLanguageCode;
  completed_at: string | Date;
  global_score: number | string;
};

type AnswerRow = RowDataPacket & {
  block_position: number;
  block_title: string;
  question_position: number;
  question_block_position: number;
  question_text: string;
  value: ScaleValue;
  option_text: string;
};

const SUMMARY_SELECT = `
  select
    coalesce(centres.official_name, centre_accounts.display_name, centres.email) as centre_name,
    diagnostic_spaces.public_code,
    questionnaires.title as questionnaire_title,
    questionnaires.version as questionnaire_version,
    questionnaires.language_code,
    submissions.created_at as completed_at,
    round(avg(answers.value) / 3 * 100, 2) as global_score
  from participant_submissions
  inner join submissions
    on submissions.id = participant_submissions.submission_id
    and submissions.diagnostic_space_id = participant_submissions.diagnostic_space_id
  inner join diagnostic_spaces
    on diagnostic_spaces.id = participant_submissions.diagnostic_space_id
  inner join centres on centres.id = diagnostic_spaces.centre_id
  left join centre_accounts on centre_accounts.centre_id = centres.id
  inner join questionnaires on questionnaires.id = submissions.questionnaire_id
  inner join answers on answers.submission_id = submissions.id
`;

export async function listParticipantResults(
  participantUserId: string,
): Promise<ParticipantSummary[]> {
  const [rows] = await mysqlPool.execute<SummaryRow[]>(
    `${SUMMARY_SELECT}
      where participant_submissions.participant_user_id = ?
      group by participant_submissions.submission_id,
        centres.official_name, centre_accounts.display_name, centres.email, diagnostic_spaces.public_code,
        questionnaires.title, questionnaires.version, questionnaires.language_code, submissions.created_at
      order by submissions.created_at desc`,
    [participantUserId],
  );

  return rows.map(mapSummary);
}

export async function getParticipantResult(params: {
  participantUserId: string;
  publicCode: string;
}): Promise<ParticipantResult | null> {
  const [summaryRows] = await mysqlPool.execute<SummaryRow[]>(
    `${SUMMARY_SELECT}
      where participant_submissions.participant_user_id = ?
        and diagnostic_spaces.public_code = ?
      group by participant_submissions.submission_id,
        centres.official_name, centre_accounts.display_name, centres.email, diagnostic_spaces.public_code,
        questionnaires.title, questionnaires.version, questionnaires.language_code, submissions.created_at
      limit 1`,
    [params.participantUserId, params.publicCode],
  );
  const summary = summaryRows[0];
  if (!summary) return null;

  const [answerRows] = await mysqlPool.execute<AnswerRow[]>(
    `
      select
        question_blocks.position as block_position,
        question_blocks.title as block_title,
        questions.position as question_position,
        questions.block_position as question_block_position,
        questions.text as question_text,
        answers.value,
        question_options.text as option_text
      from participant_submissions
      inner join diagnostic_spaces
        on diagnostic_spaces.id = participant_submissions.diagnostic_space_id
      inner join submissions
        on submissions.id = participant_submissions.submission_id
      inner join answers on answers.submission_id = submissions.id
      inner join questions
        on questions.id = answers.question_id
        and questions.questionnaire_id = answers.questionnaire_id
      inner join question_options
        on question_options.id = answers.option_id
        and question_options.question_id = answers.question_id
        and question_options.questionnaire_id = answers.questionnaire_id
      inner join question_blocks
        on question_blocks.id = questions.block_id
        and question_blocks.questionnaire_id = questions.questionnaire_id
      where participant_submissions.participant_user_id = ?
        and diagnostic_spaces.public_code = ?
      order by question_blocks.position, questions.block_position
    `,
    [params.participantUserId, params.publicCode],
  );

  return {
    ...mapSummary(summary),
    blocks: groupAnswers(answerRows),
  };
}

function mapSummary(row: SummaryRow): ParticipantSummary {
  return {
    centreName: row.centre_name,
    publicCode: row.public_code,
    questionnaireTitle: row.questionnaire_title,
    questionnaireVersion: row.questionnaire_version,
    languageCode: row.language_code,
    completedAt: new Date(row.completed_at).toISOString(),
    globalScore: Number(row.global_score),
  };
}

function groupAnswers(rows: AnswerRow[]): ParticipantBlockResult[] {
  const blocks = new Map<number, ParticipantBlockResult>();

  for (const row of rows) {
    const block = blocks.get(row.block_position) ?? {
      position: row.block_position,
      title: row.block_title,
      score: 0,
      questions: [],
    };
    block.questions.push({
      position: row.question_position,
      blockPosition: row.question_block_position,
      text: row.question_text,
      value: row.value,
      label: row.option_text,
    });
    blocks.set(row.block_position, block);
  }

  return [...blocks.values()].map((block) => ({
    ...block,
    score: round(
      (block.questions.reduce((total, question) => total + question.value, 0) /
        (block.questions.length * 3)) *
        100,
    ),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
