"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE_SETTINGS,
  type LanguageSettings,
  type LanguageCode,
} from "@/lib/i18n/languages";
import { getMessages } from "@/lib/i18n/messages";
import type { Messages } from "@/lib/i18n/locales/types";

type LanguageContextValue = LanguageSettings & {
  language: LanguageCode;
  messages: Messages;
};

const LanguageSettingsContext = createContext<LanguageContextValue>({
  ...DEFAULT_LANGUAGE_SETTINGS,
  language: "CA",
  messages: getMessages("CA"),
});

export function LanguageSettingsProvider({
  children,
  language = "CA",
  settings,
}: {
  children: ReactNode;
  language?: LanguageCode;
  settings: LanguageSettings;
}) {
  return (
    <LanguageSettingsContext.Provider
      value={{ ...settings, language, messages: getMessages(language) }}
    >
      {children}
    </LanguageSettingsContext.Provider>
  );
}

export function useLanguageSettings() {
  return useContext(LanguageSettingsContext);
}

export function useTranslations() {
  return useContext(LanguageSettingsContext).messages;
}
