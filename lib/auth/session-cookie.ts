import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AppAuthenticatedUser } from "@/lib/auth/local";
import {
  PARTICIPANT_SESSION_COOKIE_NAME,
  RESPONSIBLE_SESSION_COOKIE_NAME,
} from "@/lib/auth/cookie-names";

export {
  LEGACY_SESSION_COOKIE_NAME,
  PARTICIPANT_SESSION_COOKIE_NAME,
  RESPONSIBLE_SESSION_COOKIE_NAME,
} from "@/lib/auth/cookie-names";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type ResponsibleSessionCookiePayload = AppAuthenticatedUser & {
  role: "responsible";
  expiresAt: number;
};

type ParticipantSessionCookiePayload = {
  role: "participant";
  participantUserId: string;
  email: string;
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
    return Math.min(configuredValue, DEFAULT_SESSION_MAX_AGE_SECONDS);
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

export function createResponsibleSessionCookieValue(
  user: AppAuthenticatedUser,
): string {
  return createSignedCookieValue({
    role: "responsible",
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    expiresAt: Date.now() + getSessionMaxAgeSeconds() * 1000,
  } satisfies ResponsibleSessionCookiePayload);
}

export function createParticipantSessionCookieValue(
  user: Pick<AppAuthenticatedUser, "id" | "email">,
): string {
  return createSignedCookieValue({
    role: "participant",
    participantUserId: user.id,
    email: user.email,
    expiresAt: Date.now() + getSessionMaxAgeSeconds() * 1000,
  } satisfies ParticipantSessionCookiePayload);
}

export function parseResponsibleSessionCookieValue(
  value: string | undefined,
): AppAuthenticatedUser | null {
  const payload = parseSignedCookieValue<ResponsibleSessionCookiePayload>(value);

  if (
    !payload ||
    payload.role !== "responsible" ||
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
    displayName:
      typeof payload.displayName === "string" && payload.displayName.trim()
        ? payload.displayName.trim()
        : null,
  };
}

export function parseParticipantSessionCookieValue(
  value: string | undefined,
): AppAuthenticatedUser | null {
  const payload = parseSignedCookieValue<ParticipantSessionCookiePayload>(value);

  if (
    !payload ||
    payload.role !== "participant" ||
    typeof payload.participantUserId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    id: payload.participantUserId,
    email: payload.email.toLowerCase(),
    displayName: null,
  };
}

export async function getResponsibleSessionCookieUser(): Promise<AppAuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    return parseResponsibleSessionCookieValue(
      cookieStore.get(RESPONSIBLE_SESSION_COOKIE_NAME)?.value,
    );
  } catch {
    return null;
  }
}

export async function getParticipantSessionCookieUser(): Promise<AppAuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    return parseParticipantSessionCookieValue(
      cookieStore.get(PARTICIPANT_SESSION_COOKIE_NAME)?.value,
    );
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
