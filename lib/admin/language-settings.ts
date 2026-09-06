import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";
import {
  DEFAULT_LANGUAGE_SETTINGS,
  type LanguageCode,
  type LanguageSettings,
  isLanguageCode,
} from "@/lib/i18n/languages";

export const LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY =
  "language_selector_visible";
export const VISIBLE_LANGUAGES_SETTING_KEY = "visible_languages";

type SettingRow = RowDataPacket & {
  setting_key: string;
  setting_value: string;
};

export class LanguageSettingsError extends Error {
  constructor(message = "Could not update language settings") {
    super(message);
    this.name = "LanguageSettingsError";
  }
}

export async function getLanguageSettings(): Promise<LanguageSettings> {
  try {
    const [rows] = await mysqlPool.execute<SettingRow[]>(
      `
        select setting_key, setting_value
        from app_settings
        where setting_key in (?, ?)
      `,
      [LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY, VISIBLE_LANGUAGES_SETTING_KEY],
    );
    const settings = new Map(
      rows.map((row) => [row.setting_key, row.setting_value]),
    );

    return {
      selectorVisible:
        parseVisibility(settings.get(LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY)) ??
        DEFAULT_LANGUAGE_SETTINGS.selectorVisible,
      visibleLanguageCodes: parseVisibleLanguages(
        settings.get(VISIBLE_LANGUAGES_SETTING_KEY),
      ),
    };
  } catch (error) {
    if (isMissingSettingsTableError(error)) {
      return DEFAULT_LANGUAGE_SETTINGS;
    }

    throw error;
  }
}

export async function setLanguageSettings(
  settings: LanguageSettings,
): Promise<LanguageSettings> {
  const visibleLanguageCodes = normalizeVisibleLanguages(
    settings.visibleLanguageCodes,
  );

  if (!visibleLanguageCodes.includes("CA")) {
    throw new LanguageSettingsError();
  }

  await mysqlPool.execute(
    `
      insert into app_settings (setting_key, setting_value)
      values (?, ?), (?, ?)
      on duplicate key update
        setting_value = values(setting_value),
        updated_at = current_timestamp(3)
    `,
    [
      LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY,
      settings.selectorVisible ? "true" : "false",
      VISIBLE_LANGUAGES_SETTING_KEY,
      visibleLanguageCodes.join(","),
    ],
  );

  return { selectorVisible: settings.selectorVisible, visibleLanguageCodes };
}

function parseVisibility(value: string | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseVisibleLanguages(value: string | undefined): LanguageCode[] {
  if (!value) {
    return [...DEFAULT_LANGUAGE_SETTINGS.visibleLanguageCodes];
  }

  const languages = normalizeVisibleLanguages(value.split(","));
  return languages.includes("CA")
    ? languages
    : [...DEFAULT_LANGUAGE_SETTINGS.visibleLanguageCodes];
}

function normalizeVisibleLanguages(values: readonly string[]): LanguageCode[] {
  return [...new Set(values.filter(isLanguageCode))];
}

function isMissingSettingsTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_NO_SUCH_TABLE"
  );
}
