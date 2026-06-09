import type { User } from "@supabase/supabase-js";

export const XTEC_EMAIL_DOMAIN = "@xtec.cat";

export function isXtecEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && email.toLowerCase().endsWith(XTEC_EMAIL_DOMAIN);
}

export function isXtecUser(user: User | null): user is User & { email: string } {
  return Boolean(user && isXtecEmail(user.email));
}
