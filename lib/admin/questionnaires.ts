import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/server";
import type {
  AdminQuestionBlockSummary,
  AdminQuestionnaireDetail,
  AdminQuestionnaireMutationResult,
  AdminQuestionnaireSummary,
  AdminQuestionSummary,
} from "@/lib/admin/types";
import {
  activateQuestionnaireVersionInputSchema,
  copyQuestionnaireVersionInputSchema,
  createQuestionnaireDraftInputSchema,
  createQuestionnaireVersionInputSchema,
  deleteQuestionnaireVersionInputSchema,
  questionnaireIdSchema,
  replaceQuestionnaireContentInputSchema,
  type ActivateQuestionnaireVersionInput,
  type CopyQuestionnaireVersionInput,
  type CreateQuestionnaireDraftInput,
  type CreateQuestionnaireVersionInput,
  type DeleteQuestionnaireVersionInput,
  type ReplaceQuestionnaireContentInput,
} from "@/lib/validation/schemas";

type QuestionnaireRow = {
  id: string;
  version: string;
  title: string;
  is_active: boolean;
  created_at: string;
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

type QuestionnaireMutationRow = {
  id: string;
  version: string;
  title: string;
  is_active: boolean;
};

export class AdminQuestionnaireOperationError extends Error {
  constructor(message = "Could not manage questionnaire") {
    super(message);
    this.name = "AdminQuestionnaireOperationError";
  }
}

async function countRows(
  table: "diagnostic_spaces" | "question_blocks" | "questions" | "submissions",
  questionnaireId: string,
): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("questionnaire_id", questionnaireId);

  if (error || count === null) {
    throw new AdminQuestionnaireOperationError("Could not count questionnaire rows");
  }

  return count;
}

async function buildSummary(row: QuestionnaireRow): Promise<AdminQuestionnaireSummary> {
  const [diagnosticSpaceCount, totalSubmissions, blockCount, questionCount] =
    await Promise.all([
      countRows("diagnostic_spaces", row.id),
      countRows("submissions", row.id),
      countRows("question_blocks", row.id),
      countRows("questions", row.id),
    ]);

  return {
    id: row.id,
    version: row.version,
    title: row.title,
    isActive: row.is_active,
    createdAt: row.created_at,
    diagnosticSpaceCount,
    totalSubmissions,
    blockCount,
    questionCount,
  };
}

function mapMutationResult(row: QuestionnaireMutationRow): AdminQuestionnaireMutationResult {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    isActive: row.is_active,
  };
}

function mapBlocks(blocks: BlockRow[], questions: QuestionRow[]): AdminQuestionBlockSummary[] {
  const questionsByBlock = new Map<string, AdminQuestionSummary[]>();

  for (const question of questions) {
    const blockQuestions = questionsByBlock.get(question.block_id) ?? [];
    blockQuestions.push({
      id: question.id,
      position: question.position,
      blockPosition: question.block_position,
      text: question.text,
    });
    questionsByBlock.set(question.block_id, blockQuestions);
  }

  return blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
    questions: (questionsByBlock.get(block.id) ?? []).sort(
      (a, b) => a.blockPosition - b.blockPosition,
    ),
  }));
}

async function assertQuestionnaireTitleIsAvailable(
  title: string,
  excludeQuestionnaireId?: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("questionnaires")
    .select("id, title")
    .returns<Array<Pick<QuestionnaireRow, "id" | "title">>>();

  if (error || !data) {
    throw new AdminQuestionnaireOperationError("Could not validate title");
  }

  const normalizedTitle = title.trim().toLocaleLowerCase("ca-ES");
  const titleExists = data.some(
    (row) =>
      row.id !== excludeQuestionnaireId &&
      row.title.trim().toLocaleLowerCase("ca-ES") === normalizedTitle,
  );

  if (titleExists) {
    throw new AdminQuestionnaireOperationError("Questionnaire title already exists");
  }
}

async function getSingleMutationRow(
  data: unknown,
  error: unknown,
): Promise<AdminQuestionnaireMutationResult> {
  const rows = data as QuestionnaireMutationRow[] | null;

  if (error || !rows?.[0]) {
    throw new AdminQuestionnaireOperationError();
  }

  return mapMutationResult(rows[0]);
}

export async function listQuestionnaireVersions(): Promise<AdminQuestionnaireSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("questionnaires")
    .select("id, version, title, is_active, created_at")
    .order("created_at", { ascending: false })
    .returns<QuestionnaireRow[]>();

  if (error || !data) {
    throw new AdminQuestionnaireOperationError("Could not list questionnaire versions");
  }

  return Promise.all(data.map(buildSummary));
}

export async function getQuestionnaireVersionDetail(
  questionnaireId: string,
): Promise<AdminQuestionnaireDetail | null> {
  const parsedQuestionnaireId = questionnaireIdSchema.parse(questionnaireId);
  const supabase = createSupabaseAdminClient();

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("id, version, title, is_active, created_at")
    .eq("id", parsedQuestionnaireId)
    .maybeSingle<QuestionnaireRow>();

  if (questionnaireError) {
    throw new AdminQuestionnaireOperationError("Could not load questionnaire version");
  }

  if (!questionnaire) {
    return null;
  }

  const [
    summary,
    { data: blocks, error: blocksError },
    { data: questions, error: questionsError },
  ] = await Promise.all([
    buildSummary(questionnaire),
    supabase
      .from("question_blocks")
      .select("id, position, title")
      .eq("questionnaire_id", parsedQuestionnaireId)
      .order("position", { ascending: true })
      .returns<BlockRow[]>(),
    supabase
      .from("questions")
      .select("id, block_id, position, block_position, text")
      .eq("questionnaire_id", parsedQuestionnaireId)
      .order("position", { ascending: true })
      .returns<QuestionRow[]>(),
  ]);

  if (blocksError || questionsError || !blocks || !questions) {
    throw new AdminQuestionnaireOperationError("Could not load questionnaire content");
  }

  return {
    ...summary,
    blocks: mapBlocks(blocks, questions),
  };
}

export async function createQuestionnaireDraft(
  input: CreateQuestionnaireDraftInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = createQuestionnaireDraftInputSchema.parse(input);
  await assertQuestionnaireTitleIsAvailable(payload.title);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_questionnaire_draft", {
    p_version: payload.version,
    p_title: payload.title,
  });

  return getSingleMutationRow(data, error);
}

export async function copyQuestionnaireVersion(
  input: CopyQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = copyQuestionnaireVersionInputSchema.parse(input);
  await assertQuestionnaireTitleIsAvailable(payload.newTitle);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("copy_questionnaire_version", {
    p_source_questionnaire_id: payload.sourceQuestionnaireId,
    p_new_version: payload.newVersion,
    p_new_title: payload.newTitle,
  });

  return getSingleMutationRow(data, error);
}

export async function createQuestionnaireVersion(
  input: CreateQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = createQuestionnaireVersionInputSchema.parse(input);

  if (payload.sourceQuestionnaireId === "blank") {
    return createQuestionnaireDraft({
      title: payload.title,
      version: payload.version,
    });
  }

  return copyQuestionnaireVersion({
    newTitle: payload.title,
    newVersion: payload.version,
    sourceQuestionnaireId: payload.sourceQuestionnaireId,
  });
}

export async function replaceQuestionnaireContent(
  input: ReplaceQuestionnaireContentInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = replaceQuestionnaireContentInputSchema.parse(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("replace_questionnaire_content", {
    p_confirm_assigned_edit: payload.confirmAssignedEdit,
    p_questionnaire_id: payload.questionnaireId,
    p_title: payload.title,
    p_blocks: payload.blocks,
  });

  return getSingleMutationRow(data, error);
}

export async function activateQuestionnaireVersion(
  input: ActivateQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = activateQuestionnaireVersionInputSchema.parse(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("activate_questionnaire_version", {
    p_questionnaire_id: payload.questionnaireId,
  });

  return getSingleMutationRow(data, error);
}

export async function deleteQuestionnaireVersion(
  input: DeleteQuestionnaireVersionInput,
): Promise<void> {
  const payload = deleteQuestionnaireVersionInputSchema.parse(input);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("delete_questionnaire_version", {
    p_questionnaire_id: payload.questionnaireId,
  });

  if (error) {
    throw new AdminQuestionnaireOperationError("Could not delete questionnaire version");
  }
}
