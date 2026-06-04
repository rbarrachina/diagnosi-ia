import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/server";
import type { PublicQuestionnaire, Question, QuestionBlock } from "@/lib/questionnaire/types";

type SpaceRow = {
  public_code: string;
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

export async function loadPublicQuestionnaire(
  publicCode: string,
): Promise<PublicQuestionnaire | null> {
  const supabase = createSupabaseAdminClient();

  const { data: space, error: spaceError } = await supabase
    .from("diagnostic_spaces")
    .select("public_code, is_active, questionnaires!inner(id, version)")
    .eq("public_code", publicCode)
    .maybeSingle<SpaceRow>();

  if (spaceError) {
    throw new Error("Could not load diagnostic space");
  }

  if (!space?.is_active || !space.questionnaires) {
    return null;
  }

  const questionnaireId = space.questionnaires.id;

  const [{ data: blocks, error: blocksError }, { data: questions, error: questionsError }] =
    await Promise.all([
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
    ]);

  if (blocksError || questionsError || !blocks || !questions) {
    throw new Error("Could not load questionnaire");
  }

  const questionsByBlock = new Map<string, Question[]>();
  for (const question of questions) {
    const mappedQuestion: Question = {
      id: question.id,
      position: question.position,
      blockPosition: question.block_position,
      text: question.text,
    };

    const blockQuestions = questionsByBlock.get(question.block_id) ?? [];
    blockQuestions.push(mappedQuestion);
    questionsByBlock.set(question.block_id, blockQuestions);
  }

  const mappedBlocks: QuestionBlock[] = blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
    questions: (questionsByBlock.get(block.id) ?? []).sort(
      (a, b) => a.blockPosition - b.blockPosition,
    ),
  }));

  return {
    publicCode: space.public_code,
    questionnaireVersion: space.questionnaires.version,
    blocks: mappedBlocks,
  };
}
