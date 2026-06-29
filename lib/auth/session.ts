import "server-only";

import { getLocalAuthUser, type AppAuthenticatedUser } from "@/lib/auth/local";
import { getSessionCookieUser } from "@/lib/auth/session-cookie";
import { isXtecEmail } from "@/lib/auth/xtec";

export type XtecSessionState =
  | { status: "authenticated"; user: AppAuthenticatedUser }
  | { status: "forbidden"; email: string | null }
  | { status: "unauthenticated" };

export type ResponsibleSessionState =
  | { status: "authenticated"; user: AppAuthenticatedUser }
  | {
      status: "forbidden";
      email: string | null;
      reason: "not_xtec" | "not_centre_xtec";
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

  const { canUseResponsibleAccess } = await import("@/lib/auth/responsible-access");

  return (await canUseResponsibleAccess(user))
    ? { status: "authenticated", user }
    : { status: "forbidden", email: user.email, reason: "not_centre_xtec" };
}

export async function getRequiredXtecUser(): Promise<AppAuthenticatedUser> {
  const session = await getXtecSessionState();

  if (session.status !== "authenticated") {
    throw new Error("Authenticated XTEC user is required");
  }

  return session.user;
}

async function getCurrentAuthenticatedUser(): Promise<AppAuthenticatedUser | null> {
  return getLocalAuthUser() ?? (await getSessionCookieUser());
}
