import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { resolveAppUrl } from "@/lib/http/app-url";
import { getAuthUserIdSecret } from "@/lib/auth/session-cookie";
import type { AppAuthenticatedUser } from "@/lib/auth/local";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
const googleAuthClient = new OAuth2Client();

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleIdTokenClaims = {
  iss: string;
  sub: string;
  aud: string;
  email: string;
  email_verified: boolean;
  exp: number;
  nonce?: string;
  name?: string;
  hd?: string;
};

export function isGoogleAuthEnabled(): boolean {
  return process.env.AUTH_MODE === "google";
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

export function createOAuthRandomValue(): string {
  return randomBytes(32).toString("base64url");
}

export function getGoogleRedirectUri(requestUrl: string): string {
  return `${resolveAppUrl(requestUrl, process.env.NEXT_PUBLIC_APP_URL)}/auth/callback`;
}

export function buildGoogleAuthorizationUrl(params: {
  hostedDomain?: string | null;
  includeProfile: boolean;
  nonce: string;
  redirectUri: string;
  state: string;
}): URL {
  const config = requireGoogleOAuthConfig();
  const url = new URL(GOOGLE_AUTHORIZATION_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    params.includeProfile ? "openid email profile" : "openid email",
  );
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  if (params.hostedDomain) {
    url.searchParams.set("hd", params.hostedDomain);
  }

  return url;
}

export async function exchangeGoogleAuthorizationCode(params: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const config = requireGoogleOAuthConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: params.redirectUri,
    }),
    cache: "no-store",
  });

  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !tokenResponse.id_token) {
    throw new Error(
      tokenResponse.error_description ??
        tokenResponse.error ??
        "Google token exchange failed",
    );
  }

  return tokenResponse.id_token;
}

export async function verifyGoogleIdToken(params: {
  idToken: string;
  nonce: string;
}): Promise<GoogleIdTokenClaims> {
  const config = requireGoogleOAuthConfig();
  const ticket = await googleAuthClient.verifyIdToken({
    idToken: params.idToken,
    audience: config.clientId,
  });
  const payload = ticket.getPayload();

  if (
    !payload ||
    typeof payload.iss !== "string" ||
    !GOOGLE_ISSUERS.has(payload.iss) ||
    payload.aud !== config.clientId ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp * 1000 <= Date.now() ||
    payload.nonce !== params.nonce
  ) {
    throw new Error("Google id token claims are invalid");
  }

  return {
    iss: payload.iss,
    sub: payload.sub,
    aud: config.clientId,
    email: payload.email.toLowerCase(),
    email_verified: true,
    exp: payload.exp,
    nonce: payload.nonce,
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : undefined,
    hd: typeof payload.hd === "string" ? payload.hd : undefined,
  };
}

export function googleIdTokenToAppUser(
  tokenClaims: Pick<GoogleIdTokenClaims, "iss" | "sub" | "email" | "name" | "hd">,
): AppAuthenticatedUser {
  return {
    id: createOpaqueGoogleUserId(tokenClaims.iss, tokenClaims.sub),
    email: tokenClaims.email.toLowerCase(),
    displayName:
      typeof tokenClaims.name === "string" && tokenClaims.name.trim()
        ? tokenClaims.name.trim()
        : null,
    hostedDomain:
      typeof tokenClaims.hd === "string" && tokenClaims.hd.trim()
        ? tokenClaims.hd.trim().toLowerCase()
        : null,
  };
}

function requireGoogleOAuthConfig(): GoogleOAuthConfig {
  const config = getGoogleOAuthConfig();

  if (!config) {
    throw new Error("Google OAuth is not configured");
  }

  return config;
}

function createOpaqueGoogleUserId(issuer: string, subject: string): string {
  const secret = getAuthUserIdSecret();

  if (!secret) {
    throw new Error("AUTH_USER_ID_SECRET or AUTH_SESSION_SECRET is required");
  }

  const bytes = createHmac("sha256", secret)
    .update(`${issuer}:${subject}`)
    .digest()
    .subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
