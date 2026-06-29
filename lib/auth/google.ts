import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { resolveAppUrl } from "@/lib/http/app-url";
import { getAuthUserIdSecret } from "@/lib/auth/session-cookie";
import type { AppAuthenticatedUser } from "@/lib/auth/local";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
const XTEC_HOSTED_DOMAIN = "xtec.cat";

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleIdTokenInfo = {
  iss: string;
  sub: string;
  aud: string;
  email: string;
  email_verified: string | boolean;
  exp: string | number;
  nonce?: string;
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
  nonce: string;
  redirectUri: string;
  state: string;
}): URL {
  const config = requireGoogleOAuthConfig();
  const url = new URL(GOOGLE_AUTHORIZATION_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("hd", XTEC_HOSTED_DOMAIN);

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
}): Promise<GoogleIdTokenInfo> {
  const config = requireGoogleOAuthConfig();
  const response = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(params.idToken)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Google id token verification failed");
  }

  const tokenInfo = (await response.json()) as GoogleIdTokenInfo;
  const expiresAt = Number(tokenInfo.exp) * 1000;

  if (
    !GOOGLE_ISSUERS.has(tokenInfo.iss) ||
    tokenInfo.aud !== config.clientId ||
    !tokenInfo.sub ||
    typeof tokenInfo.email !== "string" ||
    (tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true") ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    tokenInfo.nonce !== params.nonce
  ) {
    throw new Error("Google id token claims are invalid");
  }

  return {
    ...tokenInfo,
    email: tokenInfo.email.toLowerCase(),
  };
}

export function googleTokenInfoToAppUser(
  tokenInfo: Pick<GoogleIdTokenInfo, "iss" | "sub" | "email">,
): AppAuthenticatedUser {
  return {
    id: createOpaqueGoogleUserId(tokenInfo.iss, tokenInfo.sub),
    email: tokenInfo.email.toLowerCase(),
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
