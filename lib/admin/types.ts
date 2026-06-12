export type AdminUserSummary = {
  userId: string;
  role: "admin";
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  displayName: string | null;
  email: string | null;
};

export type AdminUserSearchResult = {
  userId: string;
  displayName: string | null;
  email: string;
};

export type AdminQuestionSummary = {
  id: string;
  position: number;
  blockPosition: number;
  text: string;
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
  isActive: boolean;
};
