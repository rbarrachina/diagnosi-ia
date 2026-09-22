import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";
import type { ScaleValue } from "@/lib/questionnaire/scale";

export type AdminQuestionOptionSummary = {
  id: string;
  score: ScaleValue;
  text: string;
};

export type AdminUserSummary = {
  userId: string;
  role: "admin";
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  displayName: string | null;
  email: string | null;
  lastLoginAt: string | null;
};

export type AdminEmailInvitationSummary = {
  email: string;
  isActive: boolean;
  createdAt: string;
  invitedBy: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
};

export type AdminCentreOption = {
  id: string;
  name: string;
  officialCode: string | null;
  municipality: string | null;
  questionnaireIds: string[];
};

export type AdminQuestionSummary = {
  id: string;
  position: number;
  blockPosition: number;
  text: string;
  randomizeOptions: boolean;
  options: AdminQuestionOptionSummary[];
};

export type AdminQuestionBlockSummary = {
  id: string;
  position: number;
  title: string;
  questions: AdminQuestionSummary[];
};

export type AdminQuestionnaireSummary = {
  id: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  languageCode: QuestionnaireLanguageCode;
  isActive: boolean;
  createdAt: string;
  diagnosticSpaceCount: number;
  totalSubmissions: number;
  blockCount: number;
  questionCount: number;
};

export type AdminQuestionnaireDetail = AdminQuestionnaireSummary & {
  blocks: AdminQuestionBlockSummary[];
};

export type AdminQuestionnaireMutationResult = {
  id: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  languageCode: QuestionnaireLanguageCode;
  isActive: boolean;
};
