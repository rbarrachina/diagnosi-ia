"use client";

import { useMemo } from "react";
import { useLanguageSettings } from "@/components/i18n/language-settings-provider";
import {
  createInterfaceTranslator,
  type InterfaceMessageKey,
  type InterfaceValues,
} from "@/lib/i18n/interface-messages";

export function useInterfaceTranslator() {
  const { language } = useLanguageSettings();
  return useMemo(() => createInterfaceTranslator(language), [language]);
}

export function InterfaceText({ messageKey, values }: {
  messageKey: InterfaceMessageKey;
  values?: InterfaceValues;
}) {
  const t = useInterfaceTranslator();
  return t(messageKey, values);
}
