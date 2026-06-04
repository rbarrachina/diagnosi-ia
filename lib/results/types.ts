export type ScaleValue = 0 | 1 | 2;

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

export type QuestionResult = {
  position: number;
  blockPosition: number;
  text: string;
  average: number | null;
  distribution: DistributionBucket[];
};

export type BlockResult = {
  position: number;
  title: string;
  average: number | null;
  questions: QuestionResult[];
};

export type AggregatedResults = {
  publicCode: string;
  questionnaireVersion: string;
  generatedAt: string;
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
  text: string;
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
