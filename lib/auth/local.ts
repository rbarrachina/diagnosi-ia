import "server-only";

import { isXtecEmail } from "@/lib/auth/xtec";

export type AppAuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
  /** Verified Google Workspace domain, transiently carried in the signed session. */
  hostedDomain?: string | null;
};

export function isLocalAuthEnabled(): boolean {
  return (
    process.env.AUTH_MODE === "local" &&
    (process.env.NODE_ENV !== "production" ||
      process.env.LOCAL_AUTH_ALLOW_PRODUCTION === "true")
  );
}

export function getLocalAuthUser(): AppAuthenticatedUser | null {
  if (!isLocalAuthEnabled()) {
    return null;
  }

  const id = process.env.LOCAL_AUTH_USER_ID?.trim();
  const email = process.env.LOCAL_AUTH_EMAIL?.trim().toLowerCase();
  const displayName = process.env.LOCAL_AUTH_DISPLAY_NAME?.trim() || "Usuari local XTEC";

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    displayName,
    // Local auth is an explicitly enabled development-only shortcut; model
    // the configured email domain so local questionnaire flows remain usable.
    hostedDomain: email.slice(email.lastIndexOf("@") + 1),
  };
}

export function getLocalAuthUserSearchProfile() {
  const user = getLocalAuthUser();

  if (!user || !isXtecEmail(user.email)) {
    return null;
  }

  return {
    userId: user.id,
    displayName: "Usuari local XTEC",
    email: user.email,
  };
}
