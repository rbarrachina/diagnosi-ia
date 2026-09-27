import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ policy: vi.fn(), questionnaire: vi.fn(), canAttempt: vi.fn(), failure: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ mysqlPool: {} }));
vi.mock("@/lib/centres/email-policy", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/centres/email-policy")>(),
  getCentreEmailPolicyForPublicCode: mocks.policy,
}));
vi.mock("@/lib/questionnaire/load-public-questionnaire", () => ({ loadPublicQuestionnaire: mocks.questionnaire }));
vi.mock("@/lib/participants/access-rate-limit", () => ({
  canAttemptParticipantCode: mocks.canAttempt,
  recordParticipantCodeFailure: mocks.failure,
}));

const { getParticipantAccessErrorDomain } = await import("@/lib/participants/access-error-domain");
const user = { id: "participant", email: "test@gmail.com", hostedDomain: null };
const code = "C-7KX9-M2Q8";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canAttempt.mockReturnValue(true);
  mocks.questionnaire.mockResolvedValue({});
  mocks.policy.mockResolvedValue({ configured: true, allowXtec: true, customDomain: null });
});

describe("authenticated access error domain", () => {
  it("shows only the required XTEC domain and counts the failed attempt", async () => {
    expect(await getParticipantAccessErrorDomain(user, code)).toBe("@xtec.cat");
    expect(mocks.failure).toHaveBeenCalledExactlyOnceWith(user.id);
  });
  it("shows the exact Workspace domain", async () => {
    mocks.policy.mockResolvedValue({ configured: true, allowXtec: false, customDomain: "centre.cat" });
    expect(await getParticipantAccessErrorDomain(user, code)).toBe("@centre.cat");
  });
  it.each([undefined, "invalid"])("does not query a missing or malformed code (%s)", async (value) => {
    expect(await getParticipantAccessErrorDomain(user, value)).toBeNull();
    expect(mocks.policy).not.toHaveBeenCalled();
  });
  it("does not disclose or query a domain when attempts are blocked", async () => {
    mocks.canAttempt.mockReturnValue(false);
    expect(await getParticipantAccessErrorDomain(user, code)).toBeNull();
    expect(mocks.policy).not.toHaveBeenCalled();
  });
  it("keeps missing or inactive questionnaires generic", async () => {
    mocks.questionnaire.mockResolvedValue(null);
    expect(await getParticipantAccessErrorDomain(user, code)).toBeNull();
  });
  it("keeps unavailable policies generic", async () => {
    mocks.policy.mockResolvedValue(null);
    expect(await getParticipantAccessErrorDomain(user, code)).toBeNull();
    mocks.policy.mockResolvedValue({ configured: false, allowXtec: true, customDomain: null });
    expect(await getParticipantAccessErrorDomain(user, code)).toBeNull();
  });
  it("does not show a domain error for an authorized account", async () => {
    expect(await getParticipantAccessErrorDomain({ ...user, email: "test@xtec.cat", hostedDomain: "xtec.cat" }, code)).toBeNull();
  });
});
