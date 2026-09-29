// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  ownerResults: vi.fn(),
  participantResult: vi.fn(),
  ownerPdf: vi.fn(),
  participantPdf: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (name: string) => {
    const value = mocks.cookies.get(name);
    return value ? { value } : undefined;
  },
}) }));
vi.mock("@/lib/i18n/server-interface-messages", () => ({
  getServerInterfaceTranslator: async () => (key: string) => key,
}));
vi.mock("@/lib/auth/responsible-access", () => ({
  getResponsibleAccessDecision: async () => ({ allowed: true }),
  getResponsiblePortalStatus: async () => "open",
}));
vi.mock("@/lib/results/get-results", () => {
  class ResultsAccessError extends Error {}
  return { ResultsAccessError, getAggregatedResultsForOwner: mocks.ownerResults };
});
vi.mock("@/lib/repositories/participant-results", () => ({
  getParticipantResult: mocks.participantResult,
}));
vi.mock("@/lib/pdf/render-report", () => ({ renderDiagnosticReportPdf: mocks.ownerPdf }));
vi.mock("@/lib/pdf/render-participant-report", () => ({ renderParticipantReportPdf: mocks.participantPdf }));

import {
  createParticipantSessionCookieValue, createResponsibleSessionCookieValue,
  PARTICIPANT_SESSION_COOKIE_NAME, RESPONSIBLE_SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import { ResultsAccessError } from "@/lib/results/get-results";
import { POST as ownerPdf } from "@/app/api/reports/pdf/owner/route";
import { POST as participantPdf } from "@/app/api/docent/results/pdf/route";

const code = "C-7KX9-M2Q8";
const userA = { id: "test-account-a", email: "account-a@xtec.cat", displayName: "Compte fictici A" };
const userB = { id: "test-account-b", email: "account-b@xtec.cat", displayName: "Compte fictici B" };
function ownerRequest(extra = {}) {
  return new Request("https://test.invalid/api/reports/pdf/owner", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicCode: code, ...extra }),
  });
}
function participantRequest(extra: Record<string, string> = {}) {
  const body = new FormData();
  body.set("publicCode", code);
  for (const [key, value] of Object.entries(extra)) body.set(key, value);
  return new Request("https://test.invalid/api/docent/results/pdf", { method: "POST", body });
}

beforeEach(() => {
  vi.stubEnv("AUTH_MODE", "google");
  vi.stubEnv("AUTH_SESSION_SECRET", "isolated-test-secret-with-at-least-32-characters");
  mocks.cookies.clear();
  vi.resetAllMocks();
  mocks.ownerResults.mockImplementation(async ({ ownerUserId }) => {
    if (ownerUserId !== userA.id) throw new ResultsAccessError();
    return { publicCode: code };
  });
  mocks.participantResult.mockImplementation(async ({ participantUserId }) =>
    participantUserId === userA.id ? { publicCode: code, globalScore: 50 } : null);
  mocks.ownerPdf.mockResolvedValue(Buffer.from("test-only-owner-pdf"));
  mocks.participantPdf.mockResolvedValue(Buffer.from("test-only-participant-pdf"));
});
afterEach(() => vi.unstubAllEnvs());

describe("PDF authorization using real signed session cookies and fictitious accounts", () => {
  it("allows the owner PDF with account A's responsible session", async () => {
    mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userA));
    const response = await ownerPdf(ownerRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(mocks.ownerResults).toHaveBeenCalledWith({ publicCode: code, ownerUserId: userA.id });
    expect(mocks.ownerPdf).toHaveBeenCalledOnce();
  });

  it("denies account B the owner PDF for A's code", async () => {
    mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userB));
    const response = await ownerPdf(ownerRequest());
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(mocks.ownerResults).toHaveBeenCalledWith({ publicCode: code, ownerUserId: userB.id });
    expect(mocks.ownerPdf).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("test-only-owner-pdf");
  });

  it.each(["ownerUserId", "participantUserId", "submissionId"])(
    "rejects a client-supplied %s in an owner PDF request", async (key) => {
      mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userB));
      expect((await ownerPdf(ownerRequest({ [key]: userA.id }))).status).toBe(400);
      expect(mocks.ownerResults).not.toHaveBeenCalled();
      expect(mocks.ownerPdf).not.toHaveBeenCalled();
    },
  );

  it("allows A's individual PDF using only the participant session identity", async () => {
    mocks.cookies.set(PARTICIPANT_SESSION_COOKIE_NAME, createParticipantSessionCookieValue(userA));
    mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userB));
    const response = await participantPdf(participantRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(mocks.participantResult).toHaveBeenCalledWith({ publicCode: code, participantUserId: userA.id });
    expect(mocks.participantPdf).toHaveBeenCalledOnce();
  });

  it("does not substitute a responsible identity for the participant requesting a PDF", async () => {
    mocks.cookies.set(PARTICIPANT_SESSION_COOKIE_NAME, createParticipantSessionCookieValue(userB));
    mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userA));
    const response = await participantPdf(participantRequest());
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(mocks.participantResult).toHaveBeenCalledWith({ publicCode: code, participantUserId: userB.id });
    expect(mocks.participantPdf).not.toHaveBeenCalled();
  });

  it.each(["participantUserId", "submissionId", "ownerUserId"])(
    "rejects a client-supplied %s in an individual PDF request", async (key) => {
      mocks.cookies.set(PARTICIPANT_SESSION_COOKIE_NAME, createParticipantSessionCookieValue(userB));
      expect((await participantPdf(participantRequest({ [key]: userA.id }))).status).toBe(400);
      expect(mocks.participantResult).not.toHaveBeenCalled();
    },
  );

  it("denies unauthenticated PDF requests", async () => {
    expect((await ownerPdf(ownerRequest())).status).toBe(401);
    expect((await participantPdf(participantRequest())).status).toBe(401);
    expect(mocks.ownerResults).not.toHaveBeenCalled();
    expect(mocks.participantResult).not.toHaveBeenCalled();
  });

  it("denies valid signed cookies placed in the other role's cookie slot", async () => {
    mocks.cookies.set(PARTICIPANT_SESSION_COOKIE_NAME, createResponsibleSessionCookieValue(userA));
    mocks.cookies.set(RESPONSIBLE_SESSION_COOKIE_NAME, createParticipantSessionCookieValue(userA));
    expect((await ownerPdf(ownerRequest())).status).toBe(401);
    expect((await participantPdf(participantRequest())).status).toBe(401);
    expect(mocks.ownerResults).not.toHaveBeenCalled();
    expect(mocks.participantResult).not.toHaveBeenCalled();
  });

  it("rejects changing the identity while retaining the original signature", async () => {
    const cookie = createParticipantSessionCookieValue(userB);
    const [payload, signature] = cookie.split(".");
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    parsed.participantUserId = userA.id;
    const modified = Buffer.from(JSON.stringify(parsed)).toString("base64url");
    mocks.cookies.set(PARTICIPANT_SESSION_COOKIE_NAME, `${modified}.${signature}`);
    expect((await participantPdf(participantRequest())).status).toBe(401);
    expect(mocks.participantResult).not.toHaveBeenCalled();
  });
});
