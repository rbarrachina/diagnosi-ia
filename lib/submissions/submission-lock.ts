import "server-only";

import { createHmac } from "node:crypto";

import { getAuthUserIdSecret } from "@/lib/auth/session-cookie";

export function getSubmissionLockSecret(): string | null {
  return process.env.SUBMISSION_LOCK_HMAC_SECRET?.trim() || getAuthUserIdSecret();
}

export function createSubmissionLockHmac(params: {
  publicCode: string;
  accountId: string;
}): string {
  const secret = getSubmissionLockSecret();

  if (!secret || secret.length < 32) {
    throw new Error("SUBMISSION_LOCK_HMAC_SECRET must be at least 32 characters");
  }

  return createHmac("sha256", secret)
    .update(`${params.publicCode}:${params.accountId}`)
    .digest("base64url");
}
