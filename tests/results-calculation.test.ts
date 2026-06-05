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
    text: "Pregunta 1",
  },
  {
    id: "question-2",
    blockId: "block-1",
    position: 2,
    blockPosition: 2,
    text: "Pregunta 2",
  },
  {
    id: "question-3",
    blockId: "block-2",
    position: 3,
    blockPosition: 1,
    text: "Pregunta 3",
  },
];

const answers: AnswerRecord[] = [
  { questionId: "question-1", value: 2 },
  { questionId: "question-2", value: 1 },
  { questionId: "question-3", value: 0 },
  { questionId: "question-1", value: 2 },
  { questionId: "question-2", value: 2 },
  { questionId: "question-3", value: 1 },
];

const answerCounts: AnswerCountRecord[] = [
  { questionId: "question-1", value: 2, count: 2 },
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

    expect(results.globalAverage).toBe(1.33);
    expect(results.blocks[0].average).toBe(1.75);
    expect(results.blocks[1].average).toBe(0.5);
    expect(results.blocks[0].questions[0].average).toBe(2);
    expect(results.blocks[0].questions[1].distribution).toEqual([
      { value: 0, label: "Encara no", count: 0, percentage: 0 },
      { value: 1, label: "Parcialment", count: 1, percentage: 50 },
      { value: 2, label: "Sí, de manera habitual", count: 1, percentage: 50 },
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
    });

    expect(results.globalAverage).toBe(1.33);
    expect(results.blocks[0].average).toBe(1.75);
    expect(results.blocks[1].average).toBe(0.5);
    expect(results.blocks[0].questions[0].average).toBe(2);
    expect(results.blocks[0].questions[1].distribution).toEqual([
      { value: 0, label: "Encara no", count: 0, percentage: 0 },
      { value: 1, label: "Parcialment", count: 1, percentage: 50 },
      { value: 2, label: "Sí, de manera habitual", count: 1, percentage: 50 },
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
