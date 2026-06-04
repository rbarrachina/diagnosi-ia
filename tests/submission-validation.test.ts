import { randomUUID } from "node:crypto";
import {
  EXPECTED_ANSWER_COUNT,
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
  it("accepts exactly 20 closed answers for the active questionnaire version", () => {
    expect(() => submissionRequestSchema.parse(validPayload())).not.toThrow();
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

  it("rejects missing answers, duplicated questions, invalid values, and wrong versions", () => {
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: validAnswers().slice(1),
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
    invalidValue[0] = { ...invalidValue[0], value: 3 };
    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        answers: invalidValue,
      }),
    ).toThrow();

    expect(() =>
      submissionRequestSchema.parse({
        ...validPayload(),
        questionnaireVersion: "2026.3",
      }),
    ).toThrow();
  });
});
