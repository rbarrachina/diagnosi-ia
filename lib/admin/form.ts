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
  const dimensionPositions = formData
    .getAll("blockPosition")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const payload = {
    questionnaireId: getRequiredFormString(formData, "questionnaireId"),
    title: getRequiredFormString(formData, "title"),
    estimatedMinutes: getRequiredFormString(formData, "estimatedMinutes"),
    languageCode: getRequiredFormString(formData, "languageCode"),
    confirmAssignedEdit: formData.get("confirmAssignedEdit") === "yes",
    blocks: dimensionPositions.map((blockPosition) => {
      let dimensionQuestionPosition = 0;
      const criterionPositions = formData
        .getAll(`dimension-${blockPosition}-criterionPosition`)
        .map(Number)
        .filter(Number.isInteger);
      return {
        position: blockPosition,
        title: getRequiredFormString(formData, `block-${blockPosition}-title`),
        criteria: criterionPositions.map((criterionPosition) => {
          const questionPositions = formData
            .getAll(`dimension-${blockPosition}-criterion-${criterionPosition}-questionPosition`)
            .map(Number)
            .filter(Number.isInteger);
          return {
            position: criterionPosition,
            title: getRequiredFormString(
              formData,
              `dimension-${blockPosition}-criterion-${criterionPosition}-title`,
            ),
            questions: questionPositions.map((questionPosition) => {
              dimensionQuestionPosition += 1;
              const questionKey = `dimension-${blockPosition}-criterion-${criterionPosition}-question-${questionPosition}`;
              return {
                blockPosition: dimensionQuestionPosition,
                criterionPosition: questionPosition,
                text: getRequiredFormString(formData, questionKey),
                randomizeOptions: formData.get(`${questionKey}-randomize`) === "yes",
                options: ([0, 1, 2, 3] as const).map((score) => ({
                  score,
                  text: getRequiredFormString(formData, `${questionKey}-option-${score}`),
                })),
              };
            }),
          };
        }),
      };
    }),
  };

  return replaceQuestionnaireContentInputSchema.parse(payload);
}
