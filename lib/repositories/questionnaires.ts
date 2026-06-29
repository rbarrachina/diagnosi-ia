import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  diagnosticSpaces,
  questionBlocks,
  questionnaires,
  questions,
} from "@/lib/db/schema";
import type { Question, QuestionBlock } from "@/lib/questionnaire/types";

export type QuestionnaireWithContent = {
  id: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  isActive: boolean;
  blocks: QuestionBlock[];
};

export type PublicDiagnosticSpaceRecord = {
  publicCode: string;
  isActive: boolean;
  questionnaireId: string;
  questionnaireVersion: string;
};

type BlockRow = {
  id: string;
  position: number;
  title: string;
};

type QuestionRow = {
  id: string;
  blockId: string;
  position: number;
  blockPosition: number;
  text: string;
};

function mapQuestionnaireContent(params: {
  questionnaire: {
    id: string;
    version: string;
    title: string;
    estimatedMinutes: number;
    isActive: boolean;
  };
  blocks: BlockRow[];
  questions: QuestionRow[];
}): QuestionnaireWithContent {
  const questionsByBlock = new Map<string, Question[]>();

  for (const question of params.questions) {
    const mappedQuestion: Question = {
      id: question.id,
      position: question.position,
      blockPosition: question.blockPosition,
      text: question.text,
    };

    const blockQuestions = questionsByBlock.get(question.blockId) ?? [];
    blockQuestions.push(mappedQuestion);
    questionsByBlock.set(question.blockId, blockQuestions);
  }

  const mappedBlocks: QuestionBlock[] = params.blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
    questions: (questionsByBlock.get(block.id) ?? []).sort(
      (a, b) => a.blockPosition - b.blockPosition,
    ),
  }));

  return {
    ...params.questionnaire,
    blocks: mappedBlocks,
  };
}

export async function getQuestionnaireById(
  questionnaireId: string,
): Promise<QuestionnaireWithContent | null> {
  const questionnaireRows = await db
    .select({
      id: questionnaires.id,
      version: questionnaires.version,
      title: questionnaires.title,
      estimatedMinutes: questionnaires.estimatedMinutes,
      isActive: questionnaires.isActive,
    })
    .from(questionnaires)
    .where(eq(questionnaires.id, questionnaireId))
    .limit(1);

  const questionnaire = questionnaireRows[0];

  if (!questionnaire) {
    return null;
  }

  const [blockRows, questionRows] = await Promise.all([
    db
      .select({
        id: questionBlocks.id,
        position: questionBlocks.position,
        title: questionBlocks.title,
      })
      .from(questionBlocks)
      .where(eq(questionBlocks.questionnaireId, questionnaire.id))
      .orderBy(asc(questionBlocks.position)),
    db
      .select({
        id: questions.id,
        blockId: questions.blockId,
        position: questions.position,
        blockPosition: questions.blockPosition,
        text: questions.text,
      })
      .from(questions)
      .where(eq(questions.questionnaireId, questionnaire.id))
      .orderBy(asc(questions.position)),
  ]);

  return mapQuestionnaireContent({
    questionnaire,
    blocks: blockRows,
    questions: questionRows,
  });
}

export async function getActiveQuestionnaire(): Promise<QuestionnaireWithContent | null> {
  const activeQuestionnaireRows = await db
    .select({
      id: questionnaires.id,
    })
    .from(questionnaires)
    .where(eq(questionnaires.isActive, true))
    .orderBy(desc(questionnaires.createdAt), desc(questionnaires.id))
    .limit(1);

  const activeQuestionnaire = activeQuestionnaireRows[0];

  if (!activeQuestionnaire) {
    return null;
  }

  return getQuestionnaireById(activeQuestionnaire.id);
}

export async function getDiagnosticSpaceByPublicCode(
  publicCode: string,
): Promise<PublicDiagnosticSpaceRecord | null> {
  const rows = await db
    .select({
      publicCode: diagnosticSpaces.publicCode,
      isActive: diagnosticSpaces.isActive,
      questionnaireId: diagnosticSpaces.questionnaireId,
      questionnaireVersion: questionnaires.version,
    })
    .from(diagnosticSpaces)
    .innerJoin(questionnaires, eq(questionnaires.id, diagnosticSpaces.questionnaireId))
    .where(eq(diagnosticSpaces.publicCode, publicCode))
    .limit(1);

  return rows[0] ?? null;
}
