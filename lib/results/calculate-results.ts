import type {
  AggregatedResults,
  AnswerRecord,
  BlockDefinition,
  DistributionBucket,
  QuestionDefinition,
  ScaleOption,
  ScaleValue,
} from "@/lib/results/types";

export const SCALE_OPTIONS: ScaleOption[] = [
  { value: 0, label: "Encara no" },
  { value: 1, label: "Parcialment" },
  { value: 2, label: "Sí, de manera habitual" },
];

const LOW_RESPONSE_THRESHOLD = 5;

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyDistribution(): Record<ScaleValue, number> {
  return {
    0: 0,
    1: 0,
    2: 0,
  };
}

function formatDistribution(
  counts: Record<ScaleValue, number>,
  total: number,
): DistributionBucket[] {
  return SCALE_OPTIONS.map((option) => ({
    ...option,
    count: counts[option.value],
    percentage: total === 0 ? 0 : roundToTwoDecimals((counts[option.value] / total) * 100),
  }));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return roundToTwoDecimals(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function interpretationForAverage(averageValue: number | null): string {
  if (averageValue === null) {
    return "Encara no hi ha respostes per interpretar els resultats.";
  }

  if (averageValue < 0.75) {
    return "La diagnosi mostra un ús inicial de la IA. Convé prioritzar criteris compartits, alfabetització bàsica i acompanyament docent.";
  }

  if (averageValue < 1.5) {
    return "La diagnosi mostra un ús en desenvolupament. Hi ha pràctiques presents, però encara desiguals o no consolidades.";
  }

  return "La diagnosi mostra un ús habitual i bastant consolidat de la IA, amb oportunitat de revisar qualitat, coherència i seguretat.";
}

function summarizeBlocks(
  blocks: { title: string; average: number | null }[],
  mode: "strengths" | "improvements",
): string[] {
  const eligibleBlocks = blocks.filter(
    (block): block is { title: string; average: number } => block.average !== null,
  );

  if (eligibleBlocks.length === 0) {
    return ["Encara no hi ha prou dades de conjunt per identificar patrons."];
  }

  const sortedBlocks = [...eligibleBlocks].sort((a, b) =>
    mode === "strengths" ? b.average - a.average : a.average - b.average,
  );

  return sortedBlocks.slice(0, 2).map((block) =>
    mode === "strengths"
      ? `${block.title}: mitjana ${block.average.toFixed(2)} sobre 2.`
      : `${block.title}: mitjana ${block.average.toFixed(2)} sobre 2.`,
  );
}

export function calculateAggregatedResults(params: {
  publicCode: string;
  questionnaireVersion: string;
  generatedAt: string;
  totalSubmissions: number;
  blocks: BlockDefinition[];
  questions: QuestionDefinition[];
  answers: AnswerRecord[];
}): AggregatedResults {
  const questionsByBlock = new Map<string, QuestionDefinition[]>();
  const answersByQuestion = new Map<string, AnswerRecord[]>();

  for (const question of params.questions) {
    const blockQuestions = questionsByBlock.get(question.blockId) ?? [];
    blockQuestions.push(question);
    questionsByBlock.set(question.blockId, blockQuestions);
  }

  for (const answer of params.answers) {
    const questionAnswers = answersByQuestion.get(answer.questionId) ?? [];
    questionAnswers.push(answer);
    answersByQuestion.set(answer.questionId, questionAnswers);
  }

  const blockResults = params.blocks
    .sort((a, b) => a.position - b.position)
    .map((block) => {
      const blockQuestions = questionsByBlock.get(block.id) ?? [];
      const questionResults = blockQuestions
        .sort((a, b) => a.blockPosition - b.blockPosition)
        .map((question) => {
          const questionAnswers = answersByQuestion.get(question.id) ?? [];
          const distributionCounts = createEmptyDistribution();

          for (const answer of questionAnswers) {
            distributionCounts[answer.value] += 1;
          }

          return {
            position: question.position,
            blockPosition: question.blockPosition,
            text: question.text,
            average: average(questionAnswers.map((answer) => answer.value)),
            distribution: formatDistribution(distributionCounts, params.totalSubmissions),
          };
        });

      return {
        position: block.position,
        title: block.title,
        average: average(
          blockQuestions.flatMap((question) =>
            (answersByQuestion.get(question.id) ?? []).map((answer) => answer.value),
          ),
        ),
        questions: questionResults,
      };
    });

  const globalAverage = average(params.answers.map((answer) => answer.value));

  return {
    publicCode: params.publicCode,
    questionnaireVersion: params.questionnaireVersion,
    generatedAt: params.generatedAt,
    totalSubmissions: params.totalSubmissions,
    globalAverage,
    lowResponseWarning: params.totalSubmissions > 0 && params.totalSubmissions < LOW_RESPONSE_THRESHOLD,
    scale: SCALE_OPTIONS,
    blocks: blockResults,
    interpretation: interpretationForAverage(globalAverage),
    strengths: summarizeBlocks(blockResults, "strengths"),
    improvementAreas: summarizeBlocks(blockResults, "improvements"),
  };
}
