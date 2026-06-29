import { parseQuestionnaireContentFormData } from "@/lib/admin/form";

function buildFormData() {
  const formData = new FormData();
  formData.set("questionnaireId", "003");
  formData.set("title", "Diagnosi IA - Qüestionari 2026.3");
  formData.set("estimatedMinutes", "10");

  for (let blockPosition = 1; blockPosition <= 5; blockPosition += 1) {
    formData.append("blockPosition", String(blockPosition));
    formData.set(`block-${blockPosition}-title`, `Bloc ${blockPosition}`);

    for (let questionPosition = 1; questionPosition <= 4; questionPosition += 1) {
      formData.append(
        `block-${blockPosition}-questionPosition`,
        String(questionPosition),
      );
      formData.set(
        `block-${blockPosition}-question-${questionPosition}`,
        `Pregunta ${blockPosition}.${questionPosition}`,
      );
    }
  }

  return formData;
}

describe("admin questionnaire form parsing", () => {
  it("parses the editable block and question form", () => {
    const parsed = parseQuestionnaireContentFormData(buildFormData());

    expect(parsed).toEqual({
      questionnaireId: "003",
      title: "Diagnosi IA - Qüestionari 2026.3",
      estimatedMinutes: 10,
      confirmAssignedEdit: false,
      blocks: expect.arrayContaining([
        expect.objectContaining({
          position: 1,
          title: "Bloc 1",
          questions: expect.arrayContaining([
            { blockPosition: 1, text: "Pregunta 1.1" },
            { blockPosition: 4, text: "Pregunta 1.4" },
          ]),
        }),
        expect.objectContaining({
          position: 5,
          title: "Bloc 5",
          questions: expect.arrayContaining([
            { blockPosition: 4, text: "Pregunta 5.4" },
          ]),
        }),
      ]),
    });
  });

  it("parses partial editor forms before activation", () => {
    const formData = buildFormData();
    formData.delete("blockPosition");
    formData.append("blockPosition", "1");

    expect(parseQuestionnaireContentFormData(formData).blocks).toHaveLength(1);
  });

  it("parses confirmed assigned-version edits", () => {
    const formData = buildFormData();
    formData.set("confirmAssignedEdit", "yes");

    expect(parseQuestionnaireContentFormData(formData).confirmAssignedEdit).toBe(true);
  });

  it("rejects declared questions without text", () => {
    const formData = buildFormData();
    formData.delete("block-3-question-2");

    expect(() => parseQuestionnaireContentFormData(formData)).toThrow();
  });
});
