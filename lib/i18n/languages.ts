export const AVAILABLE_LANGUAGES = [
  { code: "CA", label: "Català" },
  { code: "ES", label: "Castellano" },
  { code: "EU", label: "Euskara" },
  { code: "GL", label: "Galego" },
  { code: "OC", label: "Aranés" },
] as const;

export type LanguageCode = (typeof AVAILABLE_LANGUAGES)[number]["code"];

export const DEFAULT_VISIBLE_LANGUAGE_CODES = AVAILABLE_LANGUAGES.map(
  ({ code }) => code,
);

export type LanguageSettings = {
  selectorVisible: boolean;
  visibleLanguageCodes: LanguageCode[];
};

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  selectorVisible: true,
  visibleLanguageCodes: [...DEFAULT_VISIBLE_LANGUAGE_CODES],
};

export function isLanguageCode(value: string): value is LanguageCode {
  return AVAILABLE_LANGUAGES.some(({ code }) => code === value);
}
