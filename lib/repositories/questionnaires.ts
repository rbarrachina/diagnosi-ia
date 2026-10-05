import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  adminUsers,
  centreAccounts,
  centres,
  diagnosticSpaces,
  questionBlocks,
  questionCriteria,
  questionOptions,
  questionnaires,
  questions,
} from "@/lib/db/schema";
import type { Question, QuestionBlock, QuestionOption } from "@/lib/questionnaire/types";
import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";
import type { ScaleValue } from "@/lib/questionnaire/scale";

export type QuestionnaireWithContent = {
  id: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  isActive: boolean;
  languageCode: QuestionnaireLanguageCode;
  blocks: QuestionBlock[];
};

export type PublicDiagnosticSpaceRecord = {
  centreName: string;
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
  criterionId: string;
  position: number;
  blockPosition: number;
  criterionPosition: number;
  text: string;
  randomizeOptions: boolean;
};

type OptionRow = {
  id: string;
  questionId: string;
  score: number;
  text: string;
};

function mapQuestionnaireContent(params: {
  questionnaire: {
    id: string;
    version: string;
    title: string;
    estimatedMinutes: number;
    isActive: boolean;
    languageCode: QuestionnaireLanguageCode;
  };
  blocks: BlockRow[];
  questions: QuestionRow[];
  criteria: { id: string; dimensionId: string; position: number; title: string }[];
  options: OptionRow[];
}): QuestionnaireWithContent {
  const questionsByBlock = new Map<string, Question[]>();
  const optionsByQuestion = new Map<string, QuestionOption[]>();

  for (const option of params.options) {
    const mappedOption: QuestionOption = {
      id: option.id,
      score: option.score as ScaleValue,
      text: option.text,
    };
    const questionOptions = optionsByQuestion.get(option.questionId) ?? [];
    questionOptions.push(mappedOption);
    optionsByQuestion.set(option.questionId, questionOptions);
  }

  for (const question of params.questions) {
    const mappedQuestion: Question = {
      id: question.id,
      criterionId: question.criterionId,
      position: question.position,
      blockPosition: question.blockPosition,
      criterionPosition: question.criterionPosition,
      text: question.text,
      randomizeOptions: question.randomizeOptions,
      options: (optionsByQuestion.get(question.id) ?? []).sort(
        (a, b) => a.score - b.score,
      ),
    };

    const blockQuestions = questionsByBlock.get(question.blockId) ?? [];
    blockQuestions.push(mappedQuestion);
    questionsByBlock.set(question.blockId, blockQuestions);
  }

  const mappedBlocks: QuestionBlock[] = params.blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
    criteria: params.criteria
      .filter((criterion) => criterion.dimensionId === block.id)
      .sort((a, b) => a.position - b.position)
      .map((criterion) => ({
        id: criterion.id,
        position: criterion.position,
        title: criterion.title,
        questions: (questionsByBlock.get(block.id) ?? [])
          .filter((question) => question.criterionId === criterion.id)
          .sort((a, b) => a.criterionPosition - b.criterionPosition),
      })),
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
      languageCode: questionnaires.languageCode,
    })
    .from(questionnaires)
    .where(eq(questionnaires.id, questionnaireId))
    .limit(1);

  const questionnaire = questionnaireRows[0];

  if (!questionnaire) {
    return null;
  }

  const [blockRows, criterionRows, questionRows, optionRows] = await Promise.all([
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
        id: questionCriteria.id,
        dimensionId: questionCriteria.dimensionId,
        position: questionCriteria.position,
        title: questionCriteria.title,
      })
      .from(questionCriteria)
      .where(eq(questionCriteria.questionnaireId, questionnaire.id))
      .orderBy(asc(questionCriteria.dimensionId), asc(questionCriteria.position)),
    db
      .select({
        id: questions.id,
        blockId: questions.blockId,
        criterionId: questions.criterionId,
        position: questions.position,
        blockPosition: questions.blockPosition,
        criterionPosition: questions.criterionPosition,
        text: questions.text,
        randomizeOptions: questions.randomizeOptions,
      })
      .from(questions)
      .where(eq(questions.questionnaireId, questionnaire.id))
      .orderBy(asc(questions.position)),
    db
      .select({
        id: questionOptions.id,
        questionId: questionOptions.questionId,
        score: questionOptions.score,
        text: questionOptions.text,
      })
      .from(questionOptions)
      .where(eq(questionOptions.questionnaireId, questionnaire.id))
      .orderBy(asc(questionOptions.score)),
  ]);

  return mapQuestionnaireContent({
    questionnaire: {
      ...questionnaire,
      languageCode: questionnaire.languageCode as QuestionnaireLanguageCode,
    },
    blocks: blockRows,
    criteria: criterionRows,
    questions: questionRows,
    options: optionRows,
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
      centreName: sql<string>`coalesce(
        ${centres.officialName},
        ${centreAccounts.displayName},
        ${centres.email},
        ${adminUsers.displayName},
        ${adminUsers.email},
        'Centre educatiu'
      )`,
      isActive: diagnosticSpaces.isActive,
      questionnaireId: diagnosticSpaces.questionnaireId,
      questionnaireVersion: questionnaires.version,
    })
    .from(diagnosticSpaces)
    .innerJoin(questionnaires, eq(questionnaires.id, diagnosticSpaces.questionnaireId))
    .leftJoin(centres, eq(centres.id, diagnosticSpaces.centreId))
    .leftJoin(centreAccounts, eq(centreAccounts.centreId, centres.id))
    .leftJoin(adminUsers, eq(adminUsers.userId, diagnosticSpaces.ownerUserId))
    .where(eq(diagnosticSpaces.publicCode, publicCode))
    .limit(1);

  return rows[0] ?? null;
}
