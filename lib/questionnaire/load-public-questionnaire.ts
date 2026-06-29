import "server-only";

import {
  getDiagnosticSpaceByPublicCode,
  getQuestionnaireById,
} from "@/lib/repositories/questionnaires";
import type { PublicQuestionnaire } from "@/lib/questionnaire/types";

export async function loadPublicQuestionnaire(
  publicCode: string,
): Promise<PublicQuestionnaire | null> {
  const space = await getDiagnosticSpaceByPublicCode(publicCode);

  if (!space?.isActive) {
    return null;
  }

  const questionnaire = await getQuestionnaireById(space.questionnaireId);

  if (!questionnaire) {
    throw new Error("Could not load questionnaire");
  }

  return {
    publicCode: space.publicCode,
    questionnaireVersion: space.questionnaireVersion,
    estimatedMinutes: questionnaire.estimatedMinutes,
    blocks: questionnaire.blocks,
  };
}
