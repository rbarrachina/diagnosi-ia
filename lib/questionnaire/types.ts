import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";
import type { ScaleValue } from "@/lib/questionnaire/scale";

export type QuestionOption = {
  id: string;
  score: ScaleValue;
  text: string;
};

export type Question = {
  id: string;
  criterionId: string;
  position: number;
  blockPosition: number;
  criterionPosition: number;
  text: string;
  randomizeOptions: boolean;
  options: QuestionOption[];
};

export type QuestionBlock = {
  id: string;
  position: number;
  title: string;
  criteria: QuestionCriterion[];
  questions: Question[];
};

export type QuestionCriterion = { id: string; position: number; title: string; questions: Question[] };

export type PublicQuestionnaire = {
  centreName: string;
  publicCode: string;
  questionnaireVersion: string;
  languageCode: QuestionnaireLanguageCode;
  estimatedMinutes: number;
  blocks: QuestionBlock[];
};
