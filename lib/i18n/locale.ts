import "server-only";

import { cookies } from "next/headers";
import { isLanguageCode, type LanguageCode } from "@/lib/i18n/languages";

export const LANGUAGE_COOKIE_NAME = "diagnosi-language";

export async function getCurrentLanguage(): Promise<LanguageCode> {
  const value = (await cookies()).get(LANGUAGE_COOKIE_NAME)?.value;
  return value && isLanguageCode(value) ? value : "CA";
}
