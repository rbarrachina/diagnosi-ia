import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AppAuthenticatedUser } from "@/lib/auth/local";

export const SESSION_COOKIE_NAME = "diagnosi_ia_auth";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionCookiePayload = AppAuthenticatedUser & {
  expiresAt: number;
};

export function getAuthSessionSecret(): string | null {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

export function getAuthUserIdSecret(): string | null {
  return process.env.AUTH_USER_ID_SECRET?.trim() || getAuthSessionSecret();
}

export function getSessionMaxAgeSeconds(): number {
  const configuredValue = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS);

  if (Number.isInteger(configuredValue) && configuredValue >= 300) {
    return configuredValue;
  }

  return DEFAULT_SESSION_MAX_AGE_SECONDS;
}

export function shouldUseSecureCookies(requestUrl?: string): boolean {
  if (requestUrl?.startsWith("https://")) {
    return true;
  }

  return process.env.NODE_ENV === "production";
}

export function createSignedCookieValue(payload: unknown): string {
  const secret = getAuthSessionSecret();

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET must be at least 32 characters");
  }

  const serializedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(serializedPayload)
    .digest("base64url");

  return `${serializedPayload}.${signature}`;
}

export function parseSignedCookieValue<T>(value: string | undefined): T | null {
  const secret = getAuthSessionSecret();

  if (!secret || !value) {
    return null;
  }

  const [serializedPayload, signature] = value.split(".");

  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(serializedPayload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(serializedPayload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createSessionCookieValue(user: AppAuthenticatedUser): string {
  return createSignedCookieValue({
    id: user.id,
    email: user.email,
    expiresAt: Date.now() + getSessionMaxAgeSeconds() * 1000,
  } satisfies SessionCookiePayload);
}

export function parseSessionCookieValue(
  value: string | undefined,
): AppAuthenticatedUser | null {
  const payload = parseSignedCookieValue<SessionCookiePayload>(value);

  if (
    !payload ||
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    id: payload.id,
    email: payload.email.toLowerCase(),
  };
}

export async function getSessionCookieUser(): Promise<AppAuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    return parseSessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
