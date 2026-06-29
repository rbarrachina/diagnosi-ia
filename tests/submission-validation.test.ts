import { randomUUID } from "node:crypto";
import {
  EXPECTED_ANSWER_COUNT,
  MAX_QUESTIONNAIRE_QUESTIONS,
  QUESTIONNAIRE_VERSION,
  submissionRequestSchema,
} from "@/lib/validation/schemas";

function validAnswers() {
  return Array.from({ length: EXPECTED_ANSWER_COUNT }, () => ({
    questionId: randomUUID(),
    value: 1,
  }));
}

function validPayload() {
  return {
    publicCode: "C-7KX9-M2Q8",
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    answers: validAnswers(),
  };
}

describe("submission payload validation", () => {
  it("accepts closed answers for a questionnaire version", () => {
    expect(() => submissionRequestSchema.parse(validPayload())).not.toThrow();
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        questionnaireVersion: "2026.3",
      }),
    ).not.toThrow();
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: Array.from({ length: MAX_QUESTIONNAIRE_QUESTIONS }, () => ({
          questionId: randomUUID(),
          value: 1,
        })),
      }),
    ).not.toThrow();
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: validAnswers().map((answer, index) =>
          index === 0 ? { ...answer, value: 3 } : answer,
        ),
      }),
    ).not.toThrow();
  });

  it("rejects additional top-level fields and answer fields", () => {
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        teacherName: "No personal data",
      }),
    ).toThrow();

    const payload = validPayload();
    expect(() =>
      submissionRequestSchema.parse({
        ...payload,
        answers: [{ ...payload.answers[0], comment: "open text" }, ...payload.answers.slice(1)],
      }),
    ).toThrow();
  });

  it("rejects empty answers, too many answers, duplicated questions, invalid values, and invalid versions", () => {
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: [],
      }),
    ).toThrow();

    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: Array.from({ length: MAX_QUESTIONNAIRE_QUESTIONS + 1 }, () => ({
          questionId: randomUUID(),
          value: 1,
        })),
      }),
    ).toThrow();

    const duplicated = validAnswers();
    duplicated[1] = { ...duplicated[1], questionId: duplicated[0].questionId };
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: duplicated,
      }),
    ).toThrow();

    const invalidValue = validAnswers();
    invalidValue[0] = { ...invalidValue[0], value: 4 };
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: invalidValue,
      }),
    ).toThrow();

    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        questionnaireVersion: "v3",
      }),
    ).toThrow();
  });
});
