import { describe, expect, it } from "vitest";
import {
  canAttemptParticipantCode,
  clearParticipantCodeFailures,
  recordParticipantCodeFailure,
} from "@/lib/participants/access-rate-limit";

describe("participant code rate limit", () => {
  it("temporarily blocks an account after repeated failures", () => {
    const userId = "rate-limit-user";
    clearParticipantCodeFailures(userId);
    for (let index = 0; index < 5; index += 1) {
      recordParticipantCodeFailure(userId, 1_000 + index);
    }
    expect(canAttemptParticipantCode(userId, 2_000)).toBe(false);
    expect(canAttemptParticipantCode(userId, 70_000)).toBe(true);
  });

  it("can clear failures after a valid access", () => {
    const userId = "rate-limit-clear-user";
    for (let index = 0; index < 5; index += 1) recordParticipantCodeFailure(userId, index);
    clearParticipantCodeFailures(userId);
    expect(canAttemptParticipantCode(userId, 10)).toBe(true);
  });
});
