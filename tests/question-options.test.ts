import { describe, expect, it } from "vitest";
import {
  adminQuestionInputSchema,
  submissionAnswerSchema,
} from "@/lib/validation/schemas";
import { getReportCopy } from "@/lib/pdf/report-copy";

const options = [
  { score: 0 as const, text: "Mai" },
  { score: 1 as const, text: "De vegades" },
  { score: 2 as const, text: "Sovint" },
  { score: 3 as const, text: "Sempre" },
];

describe("question options", () => {
  it("requires exactly one distinct text for every fixed score", () => {
    expect(
      adminQuestionInputSchema.safeParse({
        blockPosition: 1,
        text: "Pregunta",
        randomizeOptions: true,
        options,
      }).success,
    ).toBe(true);

    expect(
      adminQuestionInputSchema.safeParse({
        blockPosition: 1,
        text: "Pregunta",
        randomizeOptions: false,
        options: options.map((option) => ({ ...option, text: "Duplicada" })),
      }).success,
    ).toBe(false);
  });

  it("accepts an option identifier but rejects a score from the browser", () => {
    expect(
      submissionAnswerSchema.safeParse({
        questionId: "00000000-0000-4000-8000-000000000001",
        optionId: "10000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true);
    expect(
      submissionAnswerSchema.safeParse({
        questionId: "00000000-0000-4000-8000-000000000001",
        value: 3,
      }).success,
    ).toBe(false);
  });

  it("provides report copy for every questionnaire language", () => {
    for (const code of ["ca", "es", "eu", "gl", "oc"] as const) {
      const copy = getReportCopy(code);
      expect(copy.locale).toBeTruthy();
      expect(copy.selectedAnswer).toBeTruthy();
      expect(copy.aggregatePrivacy).toBeTruthy();
    }
  });
});
