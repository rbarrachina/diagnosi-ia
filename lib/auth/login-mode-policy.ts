import type { CentreEmailPolicy } from "@/lib/centres/types";

export type LoginMode = "internal" | "external";

export function effectiveCentreEmailPolicy<T extends CentreEmailPolicy>(policy: T, mode: LoginMode): T {
  return mode === "internal" ? { ...policy, allowXtec: true, customDomain: null } : policy;
}

export function isParticipantAllowedByLoginMode(
  user: { email: string; hostedDomain?: string | null },
  mode: LoginMode,
): boolean {
  return mode === "external" || (
    user.email.toLowerCase().endsWith("@xtec.cat") &&
    user.hostedDomain?.toLowerCase() === "xtec.cat"
  );
}
