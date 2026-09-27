import { interfaceCa } from "@/lib/i18n/locales/interface-ca";
import { interfaceEs } from "@/lib/i18n/locales/interface-es";
import { interfaceEu } from "@/lib/i18n/locales/interface-eu";
import { interfaceGl } from "@/lib/i18n/locales/interface-gl";
import { interfaceOc } from "@/lib/i18n/locales/interface-oc";
import type { LanguageCode } from "@/lib/i18n/languages";
import { resolveCatalogue } from "@/lib/i18n/resolve-catalogue";

export type InterfaceMessageKey = keyof typeof interfaceCa;
export type InterfaceCatalogue = Record<InterfaceMessageKey, string>;
export type InterfaceTranslations = Partial<InterfaceCatalogue>;
export type InterfaceValues = Record<string, string | number>;
export type InterfaceTranslator = (id: InterfaceMessageKey, values?: InterfaceValues) => string;

const translations: Record<LanguageCode, InterfaceTranslations> = {
  CA: interfaceCa, ES: interfaceEs, EU: interfaceEu, GL: interfaceGl, OC: interfaceOc,
};

export function getInterfaceMessages(language: LanguageCode): InterfaceCatalogue {
  return resolveCatalogue<InterfaceCatalogue>(interfaceCa, translations[language]);
}

export function createInterfaceTranslator(language: LanguageCode): InterfaceTranslator {
  const catalogue = getInterfaceMessages(language);
  return (id, values) => catalogue[id].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    values && Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  );
}
