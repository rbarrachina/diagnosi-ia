import "server-only";

import { cookies } from "next/headers";
import { getLocalAuthUser, LOCAL_SIGNED_OUT_COOKIE_NAME, type AppAuthenticatedUser } from "@/lib/auth/local";
import {
  getParticipantSessionCookieUser,
  getResponsibleSessionCookieUser,
} from "@/lib/auth/session-cookie";
import { isXtecEmail } from "@/lib/auth/xtec";
import type { ResponsibleAccessReason } from "@/lib/auth/responsible-access";

export type XtecSessionState =
  | { status: "authenticated"; user: AppAuthenticatedUser }
  | { status: "forbidden"; email: string | null }
  | { status: "unauthenticated" };

export type ResponsibleSessionState =
  | { status: "authenticated"; user: AppAuthenticatedUser }
  | {
      status: "forbidden";
      email: string | null;
      reason: ResponsibleAccessReason;
    }
  | { status: "unauthenticated" };

export async function getXtecSessionState(): Promise<XtecSessionState> {
  const user = await getCurrentResponsibleUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  return isXtecEmail(user.email)
    ? { status: "authenticated", user }
    : { status: "forbidden", email: user.email };
}

export async function getResponsibleSessionState(): Promise<ResponsibleSessionState> {
  const user = await getCurrentResponsibleUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (!isXtecEmail(user.email)) {
    return { status: "forbidden", email: user.email, reason: "not_xtec" };
  }

  const { getResponsibleAccessDecision } = await import(
    "@/lib/auth/responsible-access"
  );
  const decision = await getResponsibleAccessDecision(user);

  if (decision.allowed) {
    return { status: "authenticated", user };
  }

  return { status: "forbidden", email: user.email, reason: decision.reason };
}

export async function getRequiredXtecUser(): Promise<AppAuthenticatedUser> {
  const session = await getXtecSessionState();

  if (session.status !== "authenticated") {
    throw new Error("Authenticated XTEC user is required");
  }

  return session.user;
}

export async function getCurrentResponsibleUser(): Promise<AppAuthenticatedUser | null> {
  const localUser = getLocalAuthUser();
  if (localUser) {
    return (await cookies()).get(LOCAL_SIGNED_OUT_COOKIE_NAME) ? null : localUser;
  }
  return getResponsibleSessionCookieUser();
}

export async function getCurrentParticipantUser(): Promise<AppAuthenticatedUser | null> {
  const localUser = getLocalAuthUser();
  if (localUser) {
    return (await cookies()).get(LOCAL_SIGNED_OUT_COOKIE_NAME) ? null : localUser;
  }
  return getParticipantSessionCookieUser();
}
