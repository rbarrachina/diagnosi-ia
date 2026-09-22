import { ca } from "@/lib/i18n/locales/ca";
import { es } from "@/lib/i18n/locales/es";
import { eu } from "@/lib/i18n/locales/eu";
import { gl } from "@/lib/i18n/locales/gl";
import { oc } from "@/lib/i18n/locales/oc";
import type { Messages } from "@/lib/i18n/locales/types";
import type { LanguageCode } from "@/lib/i18n/languages";

export const messages: Record<LanguageCode, Messages> = { CA: ca, ES: es, EU: eu, GL: gl, OC: oc };

export function getMessages(language: LanguageCode): Messages {
  return messages[language] ?? ca;
}
