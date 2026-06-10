import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/server";
import type { SubmissionRequestInput } from "@/lib/validation/schemas";

export class SubmissionLimitReachedError extends Error {
  constructor() {
    super("Submission limit reached");
    this.name = "SubmissionLimitReachedError";
  }
}

type SubmissionRpcAnswer = {
  questionId: string;
  value: 0 | 1 | 2;
};

export async function createSubmission(payload: SubmissionRequestInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const rpcAnswers: SubmissionRpcAnswer[] = payload.answers.map((answer) => ({
    questionId: answer.questionId,
    value: answer.value,
  }));

  const { error } = await supabase.rpc("create_submission_with_answers", {
    p_public_code: payload.publicCode,
    p_questionnaire_version: payload.questionnaireVersion,
    p_answers: rpcAnswers,
  });

  if (error) {
    if (error.code === "23514") {
      throw new SubmissionLimitReachedError();
    }

    throw new Error("Could not create submission");
  }
}
