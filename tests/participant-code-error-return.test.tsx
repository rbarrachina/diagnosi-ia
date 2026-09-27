import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  questionnaire: vi.fn(),
  allowed: vi.fn(),
  failure: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(path); },
  notFound: () => { throw new Error("not-found"); },
}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentParticipantUser: async () => ({ id: "participant", email: "test@xtec.cat", hostedDomain: "xtec.cat" }),
}));
vi.mock("@/lib/auth/responsible-access", () => ({ getResponsiblePortalStatus: async () => "open" }));
vi.mock("@/lib/repositories/participant-results", () => ({ getParticipantResult: async () => null }));
vi.mock("@/lib/questionnaire/load-public-questionnaire", () => ({ loadPublicQuestionnaire: mocks.questionnaire }));
vi.mock("@/lib/centres/email-policy", () => ({
  getCentreEmailPolicyForPublicCode: async () => ({ configured: true }),
  isGoogleAccountAllowedByCentrePolicy: mocks.allowed,
}));
vi.mock("@/lib/participants/access-rate-limit", () => ({
  canAttemptParticipantCode: () => true,
  clearParticipantCodeFailures: vi.fn(),
  recordParticipantCodeFailure: mocks.failure,
}));
vi.mock("@/components/questionnaire/questionnaire-form", () => ({ QuestionnaireForm: () => null }));

const { default: QuestionnairePage } = await import("@/app/q/[publicCode]/page");

describe("participant code errors", () => {
  it.each(["missing-code", "wrong-domain"])("returns %s to the authenticated teacher area", async (reason) => {
    mocks.questionnaire.mockResolvedValue(reason === "missing-code" ? null : {});
    mocks.allowed.mockReturnValue(false);
    mocks.failure.mockClear();
    await expect(QuestionnairePage({ params: Promise.resolve({ publicCode: "C-7KX9-M2Q8" }) }))
      .rejects.toThrow("/docent?error=participant-access");
    if (reason === "missing-code") expect(mocks.failure).toHaveBeenCalledWith("participant");
    else expect(mocks.failure).not.toHaveBeenCalled();
  });
});
