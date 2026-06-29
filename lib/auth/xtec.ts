import type { AppAuthenticatedUser } from "@/lib/auth/local";

export const XTEC_EMAIL_DOMAIN = "@xtec.cat";
const XTEC_CENTRE_EMAIL_PATTERN = /^[abcde][0-9]{7}@xtec\.cat$/i;

export function isXtecEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && email.toLowerCase().endsWith(XTEC_EMAIL_DOMAIN);
}

export function isXtecCentreEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && XTEC_CENTRE_EMAIL_PATTERN.test(email);
}

export function isXtecAppUser(
  user: AppAuthenticatedUser | null,
): user is AppAuthenticatedUser {
  return Boolean(user && isXtecEmail(user.email));
}
