import type {
  AggregatedResults,
  AnswerCountRecord,
  AnswerRecord,
  BlockDefinition,
  DistributionBucket,
  QuestionDefinition,
  ScaleOption,
  ScaleValue,
} from "@/lib/results/types";

export const SCALE_OPTIONS: ScaleOption[] = [
  { value: 0, label: "Gens / No ho faig" },
  { value: 1, label: "Una mica / Ocasionalment" },
  { value: 2, label: "Bastant / Habitualment" },
  { value: 3, label: "Molt / Soc un referent al centre" },
];

const LOW_RESPONSE_THRESHOLD = 5;
const MAX_SCALE_VALUE = 3;

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function scoreToPercentage(value: number): number {
  return roundToTwoDecimals((value / MAX_SCALE_VALUE) * 100);
}

function createEmptyDistribution(): Record<ScaleValue, number> {
  return {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
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

function averagePercentage(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return scoreToPercentage(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function weightedAveragePercentage(counts: Record<ScaleValue, number>): number | null {
  const totalCount = SCALE_OPTIONS.reduce(
    (total, option) => total + counts[option.value],
    0,
  );

  if (totalCount === 0) {
    return null;
  }

  const weightedTotal = SCALE_OPTIONS.reduce(
    (total, option) => total + option.value * counts[option.value],
    0,
  );

  return scoreToPercentage(weightedTotal / totalCount);
}

function mergeDistributionCounts(
  distributions: Record<ScaleValue, number>[],
): Record<ScaleValue, number> {
  const merged = createEmptyDistribution();

  for (const distribution of distributions) {
    for (const option of SCALE_OPTIONS) {
      merged[option.value] += distribution[option.value];
    }
  }

  return merged;
}

function interpretationForPercentage(percentageValue: number | null): string {
  if (percentageValue === null) {
    return "Encara no hi ha respostes per interpretar els resultats.";
  }

  if (percentageValue < 25) {
    return "La diagnosi mostra un ús inicial de la IA. Convé prioritzar criteris compartits, alfabetització bàsica i acompanyament docent.";
  }

  if (percentageValue < 50) {
    return "La diagnosi mostra un ús en desenvolupament. Hi ha pràctiques presents, però encara desiguals o no consolidades.";
  }

  if (percentageValue < 75) {
    return "La diagnosi mostra un ús habitual i bastant consolidat de la IA, amb oportunitat de revisar qualitat, coherència i seguretat.";
  }

  return "La diagnosi mostra un ús molt consolidat de la IA, amb persones o pràctiques que poden actuar com a referents per compartir criteris i acompanyar l'equip.";
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
      ? `${block.title}: ${block.average.toFixed(1)}%.`
      : `${block.title}: ${block.average.toFixed(1)}%.`,
  );
}

export function calculateAggregatedResults(params: {
  publicCode: string;
  scopeLabel?: string;
  questionnaireVersion: string;
  generatedAt: string;
  diagnosticSpaceCount?: number;
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
            average: averagePercentage(questionAnswers.map((answer) => answer.value)),
            distribution: formatDistribution(distributionCounts, params.totalSubmissions),
          };
        });

      return {
        position: block.position,
        title: block.title,
        average: averagePercentage(
          blockQuestions.flatMap((question) =>
            (answersByQuestion.get(question.id) ?? []).map((answer) => answer.value),
          ),
        ),
        questions: questionResults,
      };
    });

  const globalAverage = averagePercentage(params.answers.map((answer) => answer.value));

  return {
    publicCode: params.publicCode,
    scopeLabel: params.scopeLabel,
    questionnaireVersion: params.questionnaireVersion,
    generatedAt: params.generatedAt,
    diagnosticSpaceCount: params.diagnosticSpaceCount,
    totalSubmissions: params.totalSubmissions,
    globalAverage,
    lowResponseWarning: params.totalSubmissions > 0 && params.totalSubmissions < LOW_RESPONSE_THRESHOLD,
    scale: SCALE_OPTIONS,
    blocks: blockResults,
    interpretation: interpretationForPercentage(globalAverage),
    strengths: summarizeBlocks(blockResults, "strengths"),
    improvementAreas: summarizeBlocks(blockResults, "improvements"),
  };
}

export function calculateAggregatedResultsFromCounts(params: {
  publicCode: string;
  scopeLabel?: string;
  questionnaireVersion: string;
  generatedAt: string;
  diagnosticSpaceCount?: number;
  totalSubmissions: number;
  blocks: BlockDefinition[];
  questions: QuestionDefinition[];
  answerCounts: AnswerCountRecord[];
}): AggregatedResults {
  const questionsByBlock = new Map<string, QuestionDefinition[]>();
  const countsByQuestion = new Map<string, Record<ScaleValue, number>>();

  for (const question of params.questions) {
    const blockQuestions = questionsByBlock.get(question.blockId) ?? [];
    blockQuestions.push(question);
    questionsByBlock.set(question.blockId, blockQuestions);
    countsByQuestion.set(question.id, createEmptyDistribution());
  }

  for (const answerCount of params.answerCounts) {
    const questionCounts =
      countsByQuestion.get(answerCount.questionId) ?? createEmptyDistribution();
    questionCounts[answerCount.value] += answerCount.count;
    countsByQuestion.set(answerCount.questionId, questionCounts);
  }

  const blockResults = params.blocks
    .sort((a, b) => a.position - b.position)
    .map((block) => {
      const blockQuestions = questionsByBlock.get(block.id) ?? [];
      const questionResults = blockQuestions
        .sort((a, b) => a.blockPosition - b.blockPosition)
        .map((question) => {
          const distributionCounts =
            countsByQuestion.get(question.id) ?? createEmptyDistribution();

          return {
            position: question.position,
            blockPosition: question.blockPosition,
            text: question.text,
            average: weightedAveragePercentage(distributionCounts),
            distribution: formatDistribution(distributionCounts, params.totalSubmissions),
          };
        });

      const blockCounts = mergeDistributionCounts(
        blockQuestions.map(
          (question) => countsByQuestion.get(question.id) ?? createEmptyDistribution(),
        ),
      );

      return {
        position: block.position,
        title: block.title,
        average: weightedAveragePercentage(blockCounts),
        questions: questionResults,
      };
    });

  const globalCounts = mergeDistributionCounts(
    params.questions.map(
      (question) => countsByQuestion.get(question.id) ?? createEmptyDistribution(),
    ),
  );
  const globalAverage = weightedAveragePercentage(globalCounts);

  return {
    publicCode: params.publicCode,
    scopeLabel: params.scopeLabel,
    questionnaireVersion: params.questionnaireVersion,
    generatedAt: params.generatedAt,
    diagnosticSpaceCount: params.diagnosticSpaceCount,
    totalSubmissions: params.totalSubmissions,
    globalAverage,
    lowResponseWarning: params.totalSubmissions > 0 && params.totalSubmissions < LOW_RESPONSE_THRESHOLD,
    scale: SCALE_OPTIONS,
    blocks: blockResults,
    interpretation: interpretationForPercentage(globalAverage),
    strengths: summarizeBlocks(blockResults, "strengths"),
    improvementAreas: summarizeBlocks(blockResults, "improvements"),
  };
}
