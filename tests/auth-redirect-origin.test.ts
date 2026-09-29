import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/responsible-access", () => ({
  getResponsiblePortalStatus: vi.fn(async () => "open"),
  getResponsibleAccessDecision: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@/lib/centres/centre-profiles", () => ({
  registerResponsibleCentreAccount: vi.fn(),
}));
vi.mock("@/lib/centres/email-policy", () => ({
  getCentreEmailPolicyForPublicCode: vi.fn(),
  isGoogleAccountAllowedByCentrePolicy: vi.fn(),
}));
vi.mock("@/lib/repositories/submissions", () => ({
  hasAccountSubmittedToPublicQuestionnaire: vi.fn(),
}));
vi.mock("@/lib/auth/google", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth/google")>();
  return {
    ...original,
    exchangeGoogleAuthorizationCode: vi.fn(async () => "test-id-token"),
    verifyGoogleIdToken: vi.fn(async () => ({
      iss: "https://accounts.google.com",
      sub: "test-subject",
      email: "test@xtec.cat",
      email_verified: true,
      aud: "test-client-id",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })),
  };
});

import { GET as login } from "@/app/auth/login/route";
import { GET as callback } from "@/app/auth/callback/route";
import { POST as logout } from "@/app/auth/logout/route";
import { exchangeGoogleAuthorizationCode } from "@/lib/auth/google";
import { OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/oauth-state";
import { createSignedCookieValue, parseSignedCookieValue } from "@/lib/auth/session-cookie";
import type { OAuthStateCookiePayload } from "@/lib/auth/oauth-state";

const originalEnv = { ...process.env };

describe("auth redirects", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_MODE: "local",
      LOCAL_AUTH_EMAIL: "usuari.prova@xtec.cat",
      LOCAL_AUTH_USER_ID: "00000000-0000-4000-8000-000000000001",
      NEXT_PUBLIC_APP_URL: "https://example.trycloudflare.com",
      AUTH_SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses the public app URL for local login redirects when configured", async () => {
    const response = await login(
      new Request("http://localhost:3000/auth/login?next=/crear") as NextRequest,
    );

    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/crear",
    );
    expect(response.status).toBe(307);
  });

  it("uses the public app URL for local logout redirects when configured", async () => {
    const response = await logout(
      new Request("http://localhost:3000/auth/logout?next=/crear", {
        method: "POST",
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/crear",
    );
    expect(response.status).toBe(303);
  });

  it("uses the public app URL for public tunnel logout redirects", async () => {
    const response = await logout(
      new Request("https://example.trycloudflare.com/auth/logout?next=/crear", {
        method: "POST",
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/crear",
    );
  });

  it.each([
    "/\\example.invalid",
    "/\n/example.invalid",
    "//example.invalid",
    "/nested/..//example.invalid",
  ])(
    "blocks %j in login and logout request parameters",
    async (next) => {
      const query = new URLSearchParams({ next });
      const loginResponse = await login(
        new NextRequest(`https://app.example/auth/login?${query}`),
      );
      const logoutResponse = await logout(
        new Request(`https://app.example/auth/logout?${query}`, { method: "POST" }),
      );
      expect(loginResponse.headers.get("location")).toBe(
        "https://example.trycloudflare.com/crear",
      );
      expect(logoutResponse.headers.get("location")).toBe(
        "https://example.trycloudflare.com/",
      );
      expect(logoutResponse.status).toBe(303);
    },
  );

  function enableGoogleAuth() {
    process.env.AUTH_MODE = "google";
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  }

  function callbackRequest(next: string) {
    const state: OAuthStateCookiePayload = {
      next,
      state: "test-oauth-state",
      nonce: "test-nonce",
      expiresAt: Date.now() + 600_000,
      purpose: "responsible",
      publicCode: null,
    };
    return new NextRequest(
      "https://app.example/auth/callback?state=test-oauth-state&code=test-code",
      { headers: { Cookie: `${OAUTH_STATE_COOKIE_NAME}=${createSignedCookieValue(state)}` } },
    );
  }

  it("stores a safe destination in Google OAuth state", async () => {
    enableGoogleAuth();
    const response = await login(
      new NextRequest("https://app.example/auth/login?next=%2F%5Cexample.invalid"),
    );
    const state = parseSignedCookieValue<OAuthStateCookiePayload>(
      response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value,
    );
    expect(state?.next).toBe("/crear");
  });

  it("rejects an unsafe destination in signed state from before the fix", async () => {
    enableGoogleAuth();
    const response = await callback(callbackRequest("/\\example.invalid"));
    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/auth/error",
    );
    expect(exchangeGoogleAuthorizationCode).not.toHaveBeenCalled();
    expect(response.cookies.get("diagnosi_ia_responsible_auth")).toBeUndefined();
  });

  it("completes the mocked Google callback for a valid internal destination", async () => {
    enableGoogleAuth();
    const response = await callback(callbackRequest("/crear"));
    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/crear",
    );
    expect(exchangeGoogleAuthorizationCode).toHaveBeenCalledOnce();
    expect(response.cookies.get("diagnosi_ia_responsible_auth")?.value).toBeTruthy();
  });

  it("uses GET after logout in Google mode and expires both session cookies", async () => {
    enableGoogleAuth();
    const response = await logout(
      new Request("https://app.example/auth/logout?next=%2F%5Cexample.invalid", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.trycloudflare.com/");
    for (const name of ["diagnosi_ia_responsible_auth", "diagnosi_ia_participant_auth"]) {
      expect(response.cookies.get(name)?.value).toBe("");
      expect(response.cookies.get(name)?.expires).toEqual(new Date(0));
    }
  });
});
