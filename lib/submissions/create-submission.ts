import "server-only";

import {
  createSubmissionWithAnswers,
  DuplicateSubmissionRepositoryError,
  SubmissionLimitReachedRepositoryError,
} from "@/lib/repositories/submissions";
import type { SubmissionRequestInput } from "@/lib/validation/schemas";

export class SubmissionLimitReachedError extends Error {
  constructor() {
    super("Submission limit reached");
    this.name = "SubmissionLimitReachedError";
  }
}

export class DuplicateSubmissionError extends Error {
  constructor() {
    super("Duplicate submission");
    this.name = "DuplicateSubmissionError";
  }
}

export async function createSubmission(
  payload: SubmissionRequestInput,
  accountId: string,
): Promise<void> {
  try {
    await createSubmissionWithAnswers(payload, accountId);
  } catch (error) {
    if (error instanceof SubmissionLimitReachedRepositoryError) {
      throw new SubmissionLimitReachedError();
    }

    if (error instanceof DuplicateSubmissionRepositoryError) {
      throw new DuplicateSubmissionError();
    }

    throw error;
  }
}
