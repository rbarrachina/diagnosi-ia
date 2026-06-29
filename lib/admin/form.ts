import { replaceQuestionnaireContentInputSchema } from "@/lib/validation/schemas";
import type { ReplaceQuestionnaireContentInput } from "@/lib/validation/schemas";

export function getRequiredFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value;
}

export function parseQuestionnaireContentFormData(
  formData: FormData,
): ReplaceQuestionnaireContentInput {
  const blockPositions = formData
    .getAll("blockPosition")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const payload = {
    questionnaireId: getRequiredFormString(formData, "questionnaireId"),
    title: getRequiredFormString(formData, "title"),
    estimatedMinutes: getRequiredFormString(formData, "estimatedMinutes"),
    confirmAssignedEdit: formData.get("confirmAssignedEdit") === "yes",
    blocks: blockPositions.map((blockPosition) => {
      const questionPositions = formData
        .getAll(`block-${blockPosition}-questionPosition`)
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value));

      return {
        position: blockPosition,
        title: getRequiredFormString(formData, `block-${blockPosition}-title`),
        questions: questionPositions.map((questionPosition) => ({
          blockPosition: questionPosition,
          text: getRequiredFormString(
            formData,
            `block-${blockPosition}-question-${questionPosition}`,
          ),
        })),
      };
    }),
  };

  return replaceQuestionnaireContentInputSchema.parse(payload);
}
