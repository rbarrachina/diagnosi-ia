import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  googleTokenInfoToAppUser,
  verifyGoogleIdToken,
} from "@/lib/auth/google";
import {
  createSessionCookieValue,
  createSignedCookieValue,
  parseSessionCookieValue,
  parseSignedCookieValue,
} from "@/lib/auth/session-cookie";

const originalEnv = { ...process.env };

describe("Google OAuth without Supabase", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_MODE: "google",
      AUTH_SESSION_SECRET: "test-session-secret-with-more-than-32-chars",
      AUTH_USER_ID_SECRET: "test-user-id-secret-with-more-than-32-chars",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
    };
    vi.restoreAllMocks();
  });

  it("builds a Google authorization URL for XTEC accounts", () => {
    const url = buildGoogleAuthorizationUrl({
      nonce: "nonce-value",
      redirectUri: "http://localhost:3000/auth/callback",
      state: "state-value",
    });

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email");
    expect(url.searchParams.get("hd")).toBe("xtec.cat");
    expect(url.searchParams.get("nonce")).toBe("nonce-value");
  });

  it("exchanges an authorization code without Supabase", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(init?.method).toBe("POST");
      return Response.json({ id_token: "google-id-token" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeGoogleAuthorizationCode({
        code: "oauth-code",
        redirectUri: "http://localhost:3000/auth/callback",
      }),
    ).resolves.toBe("google-id-token");

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(String(requestInit?.body)).toContain("code=oauth-code");
  });

  it("verifies Google id token claims and derives an opaque UUID user id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          iss: "https://accounts.google.com",
          sub: "google-subject",
          aud: "google-client-id",
          email: "Persona.Prova@xtec.cat",
          email_verified: "true",
          exp: Math.floor(Date.now() / 1000) + 300,
          nonce: "nonce-value",
        }),
      ),
    );

    const tokenInfo = await verifyGoogleIdToken({
      idToken: "google-id-token",
      nonce: "nonce-value",
    });
    const user = googleTokenInfoToAppUser(tokenInfo);

    expect(tokenInfo.email).toBe("persona.prova@xtec.cat");
    expect(user.email).toBe("persona.prova@xtec.cat");
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(user.id).not.toContain("google-subject");
    expect(user.id).not.toContain("persona.prova");
  });

  it("rejects invalid Google token claims", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          iss: "https://accounts.google.com",
          sub: "google-subject",
          aud: "another-client-id",
          email: "persona.prova@xtec.cat",
          email_verified: "true",
          exp: Math.floor(Date.now() / 1000) + 300,
          nonce: "nonce-value",
        }),
      ),
    );

    await expect(
      verifyGoogleIdToken({
        idToken: "google-id-token",
        nonce: "nonce-value",
      }),
    ).rejects.toThrow("Google id token claims are invalid");
  });

  it("signs auth cookies and rejects tampering", () => {
    const signedValue = createSignedCookieValue({ state: "abc" });

    expect(parseSignedCookieValue<{ state: string }>(signedValue)).toEqual({
      state: "abc",
    });
    expect(parseSignedCookieValue(`${signedValue}tampered`)).toBeNull();

    const sessionCookie = createSessionCookieValue({
      id: "00000000-0000-4000-8000-000000000001",
      email: "usuari.prova@xtec.cat",
    });

    expect(parseSessionCookieValue(sessionCookie)).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      email: "usuari.prova@xtec.cat",
    });
  });
});
