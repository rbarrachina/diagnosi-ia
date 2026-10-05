export type ScaleValue = 0 | 1 | 2 | 3;

export type ScaleOption = {
  value: ScaleValue;
  label: string;
};

export type DistributionBucket = {
  value: ScaleValue;
  label: string;
  count: number;
  percentage: number;
};

export type BlockScoreCountRecord = {
  blockId: string;
  bucket: number;
  count: number;
};

export type BlockScoreBucket = {
  startPercentage: number;
  count: number;
};

export type CriterionDefinition = {
  id: string;
  blockId: string;
  position: number;
  title: string;
};

export type CriterionResult = {
  position: number;
  title: string;
  average: number | null;
};

export type QuestionResult = {
  position: number;
  blockPosition: number;
  criterionPosition: number;
  criterionQuestionPosition: number;
  criterionTitle: string;
  text: string;
  average: number | null;
  distribution: DistributionBucket[];
};

export type BlockResult = {
  position: number;
  title: string;
  average: number | null;
  criteria: CriterionResult[];
  scoreDistribution: BlockScoreBucket[];
  questions: QuestionResult[];
};

export type AggregatedResults = {
  centreName?: string;
  publicCode: string;
  scopeLabel?: string;
  questionnaireVersion: string;
  languageCode?: import("@/lib/questionnaire/languages").QuestionnaireLanguageCode;
  generatedAt: string;
  diagnosticSpaceCount?: number;
  totalSubmissions: number;
  globalAverage: number | null;
  lowResponseWarning: boolean;
  scale: ScaleOption[];
  blocks: BlockResult[];
  interpretation: string;
  strengths: string[];
  improvementAreas: string[];
};

export type QuestionDefinition = {
  id: string;
  blockId: string;
  position: number;
  blockPosition: number;
  criterionPosition: number;
  criterionQuestionPosition: number;
  criterionTitle: string;
  text: string;
  options?: ScaleOption[];
};

export type BlockDefinition = {
  id: string;
  position: number;
  title: string;
};

export type AnswerRecord = {
  questionId: string;
  value: ScaleValue;
};

export type AnswerCountRecord = {
  questionId: string;
  value: ScaleValue;
  count: number;
};
