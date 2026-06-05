import "server-only";

import { verifyPrivateToken } from "@/lib/crypto/private-token";
import { createSupabaseAdminClient } from "@/lib/database/server";
import { calculateAggregatedResultsFromCounts } from "@/lib/results/calculate-results";
import type {
  AnswerCountRecord,
  BlockDefinition,
  QuestionDefinition,
  ScaleValue,
} from "@/lib/results/types";
import type { PrivateResultsRequestInput } from "@/lib/validation/schemas";

type SpaceRow = {
  id: string;
  public_code: string;
  private_token_hmac: string;
  is_active: boolean;
  questionnaires: {
    id: string;
    version: string;
  } | null;
};

type BlockRow = {
  id: string;
  position: number;
  title: string;
};

type QuestionRow = {
  id: string;
  block_id: string;
  position: number;
  block_position: number;
  text: string;
};

type AnswerRow = {
  question_id: string;
  value: ScaleValue;
  answer_count: number | string;
};

export class ResultsAccessError extends Error {
  constructor() {
    super("Invalid results credentials");
  }
}

function getTokenSecret(): string {
  const tokenSecret = process.env.PRIVATE_TOKEN_HMAC_SECRET;

  if (!tokenSecret) {
    throw new Error("PRIVATE_TOKEN_HMAC_SECRET is required");
  }

  return tokenSecret;
}

async function loadAuthorizedSpace(payload: PrivateResultsRequestInput): Promise<SpaceRow> {
  const supabase = createSupabaseAdminClient();

  const { data: space, error } = await supabase
    .from("diagnostic_spaces")
    .select("id, public_code, private_token_hmac, is_active, questionnaires!inner(id, version)")
    .eq("public_code", payload.publicCode)
    .maybeSingle<SpaceRow>();

  if (error || !space?.questionnaires || !space.is_active) {
    throw new ResultsAccessError();
  }

  if (
    !verifyPrivateToken(
      payload.privateToken,
      space.private_token_hmac,
      getTokenSecret(),
    )
  ) {
    throw new ResultsAccessError();
  }

  return space;
}

export async function getAggregatedResults(payload: PrivateResultsRequestInput) {
  const supabase = createSupabaseAdminClient();
  const space = await loadAuthorizedSpace(payload);
  const questionnaireId = space.questionnaires?.id;

  if (!questionnaireId || !space.questionnaires) {
    throw new ResultsAccessError();
  }

  const [
    { data: blocks, error: blocksError },
    { data: questions, error: questionsError },
    { count: totalSubmissions, error: submissionsError },
    { data: answerCounts, error: answerCountsError },
  ] = await Promise.all([
    supabase
      .from("question_blocks")
      .select("id, position, title")
      .eq("questionnaire_id", questionnaireId)
      .order("position", { ascending: true })
      .returns<BlockRow[]>(),
    supabase
      .from("questions")
      .select("id, block_id, position, block_position, text")
      .eq("questionnaire_id", questionnaireId)
      .order("position", { ascending: true })
      .returns<QuestionRow[]>(),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("diagnostic_space_id", space.id),
    supabase
      .rpc("get_diagnostic_answer_counts", {
        p_diagnostic_space_id: space.id,
      })
      .returns<AnswerRow[]>(),
  ]);

  if (
    blocksError ||
    questionsError ||
    submissionsError ||
    answerCountsError ||
    !blocks ||
    !questions ||
    !answerCounts
  ) {
    throw new Error("Could not load aggregated results");
  }

  const answerCountRows = answerCounts as unknown as AnswerRow[];

  const blockDefinitions: BlockDefinition[] = blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
  }));

  const questionDefinitions: QuestionDefinition[] = questions.map((question) => ({
    id: question.id,
    blockId: question.block_id,
    position: question.position,
    blockPosition: question.block_position,
    text: question.text,
  }));

  const answerCountRecords: AnswerCountRecord[] = answerCountRows.map((answer) => ({
    questionId: answer.question_id,
    value: answer.value,
    count: Number(answer.answer_count),
  }));

  return calculateAggregatedResultsFromCounts({
    publicCode: space.public_code,
    questionnaireVersion: space.questionnaires.version,
    generatedAt: new Date().toISOString(),
    totalSubmissions: totalSubmissions ?? 0,
    blocks: blockDefinitions,
    questions: questionDefinitions,
    answerCounts: answerCountRecords,
  });
}
