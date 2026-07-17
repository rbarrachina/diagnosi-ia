import { isXtecCentreEmail } from "@/lib/auth/xtec";

export function canHaveCentreProfile(
  email: string,
  allowNonCentre = false,
): boolean {
  return isXtecCentreEmail(email) || allowNonCentre;
}
