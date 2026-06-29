export type Question = {
  id: string;
  position: number;
  blockPosition: number;
  text: string;
};

export type QuestionBlock = {
  id: string;
  position: number;
  title: string;
  questions: Question[];
};

export type PublicQuestionnaire = {
  publicCode: string;
  questionnaireVersion: string;
  estimatedMinutes: number;
  blocks: QuestionBlock[];
};
