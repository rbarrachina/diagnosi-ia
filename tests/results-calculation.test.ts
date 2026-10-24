import { stageForScore } from "@/components/results/stage-scale";
import {
  calculateAggregatedResults,
  calculateAggregatedResultsFromCounts,
} from "@/lib/results/calculate-results";
import type {
  AnswerCountRecord,
  AnswerRecord,
  BlockDefinition,
  QuestionDefinition,
} from "@/lib/results/types";

const blocks: BlockDefinition[] = [
  { id: "block-1", position: 1, title: "Bloc 1" },
  { id: "block-2", position: 2, title: "Bloc 2" },
];

const questions: QuestionDefinition[] = [
  {
    id: "question-1",
    blockId: "block-1",
    position: 1,
    blockPosition: 1,
    criterionPosition: 1,
    criterionQuestionPosition: 1,
    criterionTitle: "Criteri 1",
    text: "Pregunta 1",
  },
  {
    id: "question-2",
    blockId: "block-1",
    position: 2,
    blockPosition: 2,
    criterionPosition: 1,
    criterionQuestionPosition: 2,
    criterionTitle: "Criteri 1",
    text: "Pregunta 2",
  },
  {
    id: "question-3",
    blockId: "block-2",
    position: 3,
    blockPosition: 1,
    criterionPosition: 1,
    criterionQuestionPosition: 1,
    criterionTitle: "Criteri 1",
    text: "Pregunta 3",
  },
];

const answers: AnswerRecord[] = [
  { questionId: "question-1", value: 3 },
  { questionId: "question-2", value: 1 },
  { questionId: "question-3", value: 0 },
  { questionId: "question-1", value: 2 },
  { questionId: "question-2", value: 2 },
  { questionId: "question-3", value: 1 },
];

const answerCounts: AnswerCountRecord[] = [
  { questionId: "question-1", value: 2, count: 1 },
  { questionId: "question-1", value: 3, count: 1 },
  { questionId: "question-2", value: 1, count: 1 },
  { questionId: "question-2", value: 2, count: 1 },
  { questionId: "question-3", value: 0, count: 1 },
  { questionId: "question-3", value: 1, count: 1 },
];

describe("calculateAggregatedResults", () => {
  it("calculates global, block, question and distribution aggregates", () => {
    const results = calculateAggregatedResults({
      publicCode: "C-7KX9-M2Q8",
      questionnaireVersion: "2026.2",
      generatedAt: "2026-06-04T10:00:00.000Z",
      totalSubmissions: 2,
      blocks,
      questions,
      answers,
    });

    expect(results.globalAverage).toBe(50);
    expect(results.blocks[0].average).toBeCloseTo(200 / 3, 12);
    expect(results.blocks[1].average).toBeCloseTo(50 / 3, 12);
    expect(results.blocks[0].questions[0].average).toBeCloseTo(250 / 3, 12);
    expect(results.blocks[0].questions[1].distribution).toEqual([
      { value: 0, label: "Gens / No ho faig", count: 0, percentage: 0 },
      { value: 1, label: "Una mica / Ocasionalment", count: 1, percentage: 50 },
      { value: 2, label: "Bastant / Habitualment", count: 1, percentage: 50 },
      { value: 3, label: "Molt / Soc un referent al centre", count: 0, percentage: 0 },
    ]);
  });

  it("does not expose submission identifiers or row-level answer combinations", () => {
    const results = calculateAggregatedResults({
      publicCode: "C-7KX9-M2Q8",
      questionnaireVersion: "2026.2",
      generatedAt: "2026-06-04T10:00:00.000Z",
      totalSubmissions: 2,
      blocks,
      questions,
      answers,
    });

    const serialized = JSON.stringify(results);

    expect(serialized).not.toContain("submission");
    expect(serialized).not.toContain("diagnostic_space_id");
    expect(serialized).not.toContain("question-1");
  });
});

describe("calculateAggregatedResultsFromCounts", () => {
  it("calculates the same aggregates from database counts without answer rows", () => {
    const results = calculateAggregatedResultsFromCounts({
      publicCode: "C-7KX9-M2Q8",
      questionnaireVersion: "2026.2",
      generatedAt: "2026-06-04T10:00:00.000Z",
      totalSubmissions: 2,
      blocks,
      questions,
      answerCounts,
      blockScoreCounts: [
        { blockId: "block-1", bucket: 0, count: 1 },
        { blockId: "block-1", bucket: 8, count: 1 },
      ],
    });

    expect(results.globalAverage).toBe(50);
    expect(results.blocks[0].average).toBeCloseTo(200 / 3, 12);
    expect(results.blocks[0].scoreDistribution).toHaveLength(9);
    expect(results.blocks[0].scoreDistribution[0]).toEqual({
      startPercentage: 0,
      count: 1,
    });
    expect(results.blocks[0].scoreDistribution[8]).toEqual({
      startPercentage: (100 / 9) * 8,
      count: 1,
    });
    expect(results.blocks[1].average).toBeCloseTo(50 / 3, 12);
    expect(results.blocks[0].questions[0].average).toBeCloseTo(250 / 3, 12);
    expect(results.blocks[0].questions[1].distribution).toEqual([
      { value: 0, label: "Gens / No ho faig", count: 0, percentage: 0 },
      { value: 1, label: "Una mica / Ocasionalment", count: 1, percentage: 50 },
      { value: 2, label: "Bastant / Habitualment", count: 1, percentage: 50 },
      { value: 3, label: "Molt / Soc un referent al centre", count: 0, percentage: 0 },
    ]);
  });

  it("does not expose submission identifiers or row-level answer combinations", () => {
    const results = calculateAggregatedResultsFromCounts({
      publicCode: "C-7KX9-M2Q8",
      questionnaireVersion: "2026.2",
      generatedAt: "2026-06-04T10:00:00.000Z",
      totalSubmissions: 2,
      blocks,
      questions,
      answerCounts,
    });

    const serialized = JSON.stringify(results);

    expect(serialized).not.toContain("submission");
    expect(serialized).not.toContain("diagnostic_space_id");
    expect(serialized).not.toContain("question-1");
  });
});


describe("aggregate stage boundaries", () => {
  it.each([
    [1, "basic"],
    [2, "intermediate"],
    [3, "advanced"],
  ] as const)("classifies score %s before display rounding", (value, stage) => {
    const results = calculateAggregatedResultsFromCounts({
      publicCode: "C-7KX9-M2Q8",
      questionnaireVersion: "2026.2",
      generatedAt: "2026-10-24T10:00:00.000Z",
      totalSubmissions: 2,
      blocks: [blocks[0]],
      questions: [questions[0]],
      answerCounts: [{ questionId: "question-1", value, count: 2 }],
    });
    const block = results.blocks[0];
    for (const score of [results.globalAverage, block.average, block.questions[0].average]) {
      expect(score).not.toBeNull();
      expect(stageForScore(score!)).toBe(stage);
    }
  });

  it("keeps scores immediately above the boundaries in the next stage", () => {
    expect(stageForScore(100 / 3 + 0.00001)).toBe("intermediate");
    expect(stageForScore(200 / 3 + 0.00001)).toBe("advanced");
  });
});
