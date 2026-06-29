import {
  adminUserSearchQuerySchema,
  adminUserInputSchema,
  copyQuestionnaireVersionInputSchema,
  createQuestionnaireDraftInputSchema,
  createQuestionnaireVersionInputSchema,
  replaceQuestionnaireContentInputSchema,
} from "@/lib/validation/schemas";

function validBlocks() {
  return Array.from({ length: 10 }, (_, blockIndex) => ({
    position: blockIndex + 1,
    title: `Bloc ${blockIndex + 1}`,
    questions: Array.from({ length: 10 }, (_, questionIndex) => ({
      blockPosition: questionIndex + 1,
      text: `Pregunta ${blockIndex + 1}.${questionIndex + 1}`,
    })),
  }));
}

describe("admin validation schemas", () => {
  it("accepts strict questionnaire draft metadata", () => {
    expect(() =>
      createQuestionnaireDraftInputSchema.parse({
        version: "2026-27 v1",
        title: "Diagnosi IA - Qüestionari 2026-27 v1",
        estimatedMinutes: 10,
      }),
    ).not.toThrow();

    expect(() =>
      createQuestionnaireDraftInputSchema.parse({
        version: "2026.3",
        title: "Diagnosi IA",
        estimatedMinutes: 10,
        unexpected: true,
      }),
    ).toThrow();
  });

  it("validates copied questionnaire metadata", () => {
    expect(() =>
      copyQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "002",
        newVersion: "2026.3",
        newTitle: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
      }),
    ).not.toThrow();

    expect(() =>
      copyQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "2",
        newVersion: "v3",
        newTitle: "Diagnosi IA",
        estimatedMinutes: 10,
      }),
    ).toThrow();
  });

  it("validates unified questionnaire version creation metadata", () => {
    expect(() =>
      createQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "blank",
        version: "2026-27 v1",
        title: "Diagnosi IA - Qüestionari 2026-27 v1",
        estimatedMinutes: "10",
      }),
    ).not.toThrow();

    expect(() =>
      createQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "002",
        version: "2026.3",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 12,
      }),
    ).not.toThrow();

    expect(() =>
      createQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "2",
        version: "2026.3",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
      }),
    ).toThrow();

    expect(() =>
      createQuestionnaireVersionInputSchema.parse({
        sourceQuestionnaireId: "blank",
        version: "2026.3",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 0,
      }),
    ).toThrow();
  });

  it("allows partial questionnaire drafts but caps blocks and questions", () => {
    expect(() =>
      replaceQuestionnaireContentInputSchema.parse({
        questionnaireId: "003",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
        blocks: validBlocks(),
      }),
    ).not.toThrow();

    expect(() =>
      replaceQuestionnaireContentInputSchema.parse({
        questionnaireId: "003",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
        blocks: validBlocks().slice(0, 4),
      }),
    ).not.toThrow();

    expect(() =>
      replaceQuestionnaireContentInputSchema.parse({
        questionnaireId: "003",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
        blocks: [
          ...validBlocks(),
          {
            position: 11,
            title: "Bloc 11",
            questions: [],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects duplicate block and question positions", () => {
    const duplicateBlocks = validBlocks();
    duplicateBlocks[1] = { ...duplicateBlocks[1], position: 1 };

    expect(() =>
      replaceQuestionnaireContentInputSchema.parse({
        questionnaireId: "003",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
        blocks: duplicateBlocks,
      }),
    ).toThrow();

    const duplicateQuestions = validBlocks();
    duplicateQuestions[0].questions[1] = {
      ...duplicateQuestions[0].questions[1],
      blockPosition: 1,
    };

    expect(() =>
      replaceQuestionnaireContentInputSchema.parse({
        questionnaireId: "003",
        title: "Diagnosi IA - Qüestionari 2026.3",
        estimatedMinutes: 10,
        blocks: duplicateQuestions,
      }),
    ).toThrow();
  });

  it("validates admin user ids without accepting extra data", () => {
    expect(() =>
      adminUserInputSchema.parse({
        userId: "11111111-1111-4111-8111-111111111111",
      }),
    ).not.toThrow();

    expect(() =>
      adminUserInputSchema.parse({
        userId: "11111111-1111-4111-8111-111111111111",
        email: "admin@example.test",
      }),
    ).toThrow();
  });

  it("validates administrator search queries", () => {
    expect(adminUserSearchQuerySchema.parse(" rbarrach ")).toBe("rbarrach");
    expect(() => adminUserSearchQuerySchema.parse("r")).toThrow();
    expect(() => adminUserSearchQuerySchema.parse("x".repeat(81))).toThrow();
  });
});
