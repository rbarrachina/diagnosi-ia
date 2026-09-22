import "server-only";

import { getLocalAuthUser, type AppAuthenticatedUser } from "@/lib/auth/local";
import { getSessionCookieUser } from "@/lib/auth/session-cookie";
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
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  return isXtecEmail(user.email)
    ? { status: "authenticated", user }
    : { status: "forbidden", email: user.email };
}

export async function getResponsibleSessionState(): Promise<ResponsibleSessionState> {
  const user = await getCurrentAuthenticatedUser();

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

export async function getCurrentAuthenticatedUser(): Promise<AppAuthenticatedUser | null> {
  return getLocalAuthUser() ?? (await getSessionCookieUser());
}
