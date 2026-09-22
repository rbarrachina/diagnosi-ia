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
import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";

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
  options: ScaleOption[] = SCALE_OPTIONS,
): DistributionBucket[] {
  return options.slice().sort((a, b) => a.value - b.value).map((option) => ({
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

const interpretations: Record<QuestionnaireLanguageCode, [string, string, string, string, string]> = {
  ca: [
    "Encara no hi ha respostes per interpretar els resultats.",
    "La diagnosi mostra un ús inicial de la IA. Convé prioritzar criteris compartits, alfabetització bàsica i acompanyament docent.",
    "La diagnosi mostra un ús en desenvolupament. Hi ha pràctiques presents, però encara desiguals o no consolidades.",
    "La diagnosi mostra un ús habitual i bastant consolidat de la IA, amb oportunitat de revisar qualitat, coherència i seguretat.",
    "La diagnosi mostra un ús molt consolidat de la IA, amb persones o pràctiques que poden actuar com a referents per compartir criteris i acompanyar l’equip.",
  ],
  es: [
    "Todavía no hay respuestas para interpretar los resultados.",
    "La diagnosis muestra un uso inicial de la IA. Conviene priorizar criterios compartidos, alfabetización básica y acompañamiento docente.",
    "La diagnosis muestra un uso en desarrollo. Hay prácticas presentes, pero todavía son desiguales o no están consolidadas.",
    "La diagnosis muestra un uso habitual y bastante consolidado de la IA, con margen para revisar la calidad, la coherencia y la seguridad.",
    "La diagnosis muestra un uso muy consolidado de la IA, con personas o prácticas que pueden actuar como referentes para compartir criterios y acompañar al equipo.",
  ],
  eu: [
    "Oraindik ez dago emaitzak interpretatzeko erantzunik.",
    "Diagnosiak IAren hasierako erabilera erakusten du. Komeni da irizpide partekatuak, oinarrizko alfabetizazioa eta irakasleen laguntza lehenestea.",
    "Diagnosiak garatzen ari den erabilera erakusten du. Badira praktikak, baina oraindik ez dira berdinak edo sendotuak.",
    "Diagnosiak IAren erabilera ohikoa eta nahiko sendotua erakusten du, kalitatea, koherentzia eta segurtasuna berrikusteko aukerarekin.",
    "Diagnosiak IAren erabilera oso sendotua erakusten du; pertsona edo praktika batzuek erreferente gisa jardun dezakete irizpideak partekatzeko eta taldeari laguntzeko.",
  ],
  gl: [
    "Aínda non hai respostas para interpretar os resultados.",
    "A diagnose mostra un uso inicial da IA. Convén priorizar criterios compartidos, alfabetización básica e acompañamento docente.",
    "A diagnose mostra un uso en desenvolvemento. Hai prácticas presentes, pero aínda son desiguais ou non están consolidadas.",
    "A diagnose mostra un uso habitual e bastante consolidado da IA, con marxe para revisar a calidade, a coherencia e a seguridade.",
    "A diagnose mostra un uso moi consolidado da IA, con persoas ou prácticas que poden actuar como referentes para compartir criterios e acompañar o equipo.",
  ],
  oc: [
    "Encara non i a responses entà interpretar es resultats.",
    "Era diagnòsi mòstre un usatge iniciau dera IA. Cau priorizar critèris compartits, alfabetizacion basica e acompanhament docent.",
    "Era diagnòsi mòstre un usatge en desvolopament. I a practiques presentes, mès encara son desiguaus o non consolidades.",
    "Era diagnòsi mòstre un usatge abituau e pro consolidat dera IA, damb marge entà revisar era qualitat, era coeréncia e era seguretat.",
    "Era diagnòsi mòstre un usatge fòrça consolidat dera IA, damb persones o practiques que pòden actuar coma referents entà compartir critèris e acompanhar er equip.",
  ],
};

function interpretationForPercentage(
  percentageValue: number | null,
  languageCode: QuestionnaireLanguageCode,
): string {
  const messages = interpretations[languageCode];
  if (percentageValue === null) {
    return messages[0];
  }

  if (percentageValue < 25) {
    return messages[1];
  }

  if (percentageValue < 50) {
    return messages[2];
  }

  if (percentageValue < 75) {
    return messages[3];
  }

  return messages[4];
}

function summarizeBlocks(
  blocks: { title: string; average: number | null }[],
  mode: "strengths" | "improvements",
  languageCode: QuestionnaireLanguageCode,
): string[] {
  const eligibleBlocks = blocks.filter(
    (block): block is { title: string; average: number } => block.average !== null,
  );

  if (eligibleBlocks.length === 0) {
    const emptyMessages: Record<QuestionnaireLanguageCode, string> = {
      ca: "Encara no hi ha prou dades de conjunt per identificar patrons.",
      es: "Todavía no hay suficientes datos agregados para identificar patrones.",
      eu: "Oraindik ez dago ereduak identifikatzeko adina datu agregaturik.",
      gl: "Aínda non hai suficientes datos agregados para identificar patróns.",
      oc: "Encara non i a pro donades agregades entà identificar patrons.",
    };
    return [emptyMessages[languageCode]];
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
  languageCode?: AggregatedResults["languageCode"];
  generatedAt: string;
  diagnosticSpaceCount?: number;
  totalSubmissions: number;
  blocks: BlockDefinition[];
  questions: QuestionDefinition[];
  answers: AnswerRecord[];
}): AggregatedResults {
  const languageCode = params.languageCode ?? "ca";
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
            distribution: formatDistribution(
              distributionCounts,
              params.totalSubmissions,
              question.options ?? SCALE_OPTIONS,
            ),
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
    languageCode,
    generatedAt: params.generatedAt,
    diagnosticSpaceCount: params.diagnosticSpaceCount,
    totalSubmissions: params.totalSubmissions,
    globalAverage,
    lowResponseWarning: params.totalSubmissions > 0 && params.totalSubmissions < LOW_RESPONSE_THRESHOLD,
    scale: SCALE_OPTIONS,
    blocks: blockResults,
    interpretation: interpretationForPercentage(globalAverage, languageCode),
    strengths: summarizeBlocks(blockResults, "strengths", languageCode),
    improvementAreas: summarizeBlocks(blockResults, "improvements", languageCode),
  };
}

export function calculateAggregatedResultsFromCounts(params: {
  centreName?: string;
  publicCode: string;
  scopeLabel?: string;
  questionnaireVersion: string;
  languageCode?: AggregatedResults["languageCode"];
  generatedAt: string;
  diagnosticSpaceCount?: number;
  totalSubmissions: number;
  blocks: BlockDefinition[];
  questions: QuestionDefinition[];
  answerCounts: AnswerCountRecord[];
}): AggregatedResults {
  const languageCode = params.languageCode ?? "ca";
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
            distribution: formatDistribution(
              distributionCounts,
              params.totalSubmissions,
              question.options ?? SCALE_OPTIONS,
            ),
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
    centreName: params.centreName,
    publicCode: params.publicCode,
    scopeLabel: params.scopeLabel,
    questionnaireVersion: params.questionnaireVersion,
    languageCode,
    generatedAt: params.generatedAt,
    diagnosticSpaceCount: params.diagnosticSpaceCount,
    totalSubmissions: params.totalSubmissions,
    globalAverage,
    lowResponseWarning: params.totalSubmissions > 0 && params.totalSubmissions < LOW_RESPONSE_THRESHOLD,
    scale: SCALE_OPTIONS,
    blocks: blockResults,
    interpretation: interpretationForPercentage(globalAverage, languageCode),
    strengths: summarizeBlocks(blockResults, "strengths", languageCode),
    improvementAreas: summarizeBlocks(blockResults, "improvements", languageCode),
  };
}
