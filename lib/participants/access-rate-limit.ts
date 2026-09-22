import "server-only";

type AttemptState = { failures: number[]; blockedUntil: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map<string, AttemptState>();

export function canAttemptParticipantCode(userId: string, now = Date.now()): boolean {
  const state = attempts.get(userId);
  if (!state) return true;
  prune(state, now);
  return state.blockedUntil <= now;
}

export function recordParticipantCodeFailure(userId: string, now = Date.now()): void {
  const state = attempts.get(userId) ?? { failures: [], blockedUntil: 0 };
  prune(state, now);
  state.failures.push(now);
  if (state.failures.length >= MAX_FAILURES) {
    const exponent = Math.min(state.failures.length - MAX_FAILURES, 5);
    state.blockedUntil = now + 60_000 * 2 ** exponent;
  }
  attempts.set(userId, state);
}

export function clearParticipantCodeFailures(userId: string): void {
  attempts.delete(userId);
}

function prune(state: AttemptState, now: number): void {
  state.failures = state.failures.filter((attempt) => attempt > now - WINDOW_MS);
  if (state.failures.length === 0 && state.blockedUntil <= now) state.blockedUntil = 0;
}

export const participantRateLimitConfig = {
  maxFailures: MAX_FAILURES,
  windowMs: WINDOW_MS,
};
