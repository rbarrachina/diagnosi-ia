import type { ScaleValue } from "@/lib/results/types";
import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";

export type ParticipantQuestionResult = {
  position: number;
  blockPosition: number;
  criterionPosition: number;
  questionPosition: number;
  criterionTitle: string;
  text: string;
  value: ScaleValue;
  label: string;
  randomizeOptions: boolean;
  options: { value: ScaleValue; label: string }[];
};

export type ParticipantBlockResult = {
  position: number;
  title: string;
  score: number;
  questions: ParticipantQuestionResult[];
};

export type ParticipantResult = {
  centreName: string;
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  languageCode?: QuestionnaireLanguageCode;
  completedAt: string;
  globalScore: number;
  blocks: ParticipantBlockResult[];
};

export type ParticipantSummary = {
  centreName: string;
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  languageCode?: QuestionnaireLanguageCode;
  completedAt: string;
  globalScore: number;
};
