"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE_SETTINGS,
  type LanguageSettings,
} from "@/lib/i18n/languages";

const LanguageSettingsContext = createContext<LanguageSettings>(
  DEFAULT_LANGUAGE_SETTINGS,
);

export function LanguageSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: LanguageSettings;
}) {
  return (
    <LanguageSettingsContext.Provider value={settings}>
      {children}
    </LanguageSettingsContext.Provider>
  );
}

export function useLanguageSettings() {
  return useContext(LanguageSettingsContext);
}
