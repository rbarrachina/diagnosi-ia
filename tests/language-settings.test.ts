import { beforeEach, describe, expect, it, vi } from "vitest";

let settings: Map<string, string>;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      executeQuery(query, values),
    ),
  },
}));

const {
  LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY,
  VISIBLE_LANGUAGES_SETTING_KEY,
  getLanguageSettings,
  setLanguageSettings,
} = await import("@/lib/admin/language-settings");

describe("language settings", () => {
  beforeEach(() => {
    settings = new Map();
  });

  it("uses the current visible selector and all languages by default", async () => {
    await expect(getLanguageSettings()).resolves.toEqual({
      selectorVisible: true,
      visibleLanguageCodes: ["CA", "ES", "EU", "GL", "OC"],
    });
  });

  it("persists visibility and the configured language list", async () => {
    await setLanguageSettings({
      selectorVisible: false,
      visibleLanguageCodes: ["CA", "ES"],
    });

    await expect(getLanguageSettings()).resolves.toEqual({
      selectorVisible: false,
      visibleLanguageCodes: ["CA", "ES"],
    });
  });

  it("rejects configurations that remove the active Catalan language", async () => {
    await expect(
      setLanguageSettings({
        selectorVisible: true,
        visibleLanguageCodes: ["ES"],
      }),
    ).rejects.toThrow();
  });
});

async function executeQuery(query: string, values: unknown[] = []) {
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes("from app_settings")) {
    return [
      [...settings.entries()]
        .filter(([key]) => values.includes(key))
        .map(([setting_key, setting_value]) => ({
          setting_key,
          setting_value,
        })),
    ];
  }

  if (normalizedQuery.includes("insert into app_settings")) {
    settings.set(LANGUAGE_SELECTOR_VISIBLE_SETTING_KEY, String(values[1]));
    settings.set(VISIBLE_LANGUAGES_SETTING_KEY, String(values[3]));
    return [{ affectedRows: 2 }];
  }

  throw new Error(`Unexpected query: ${query}`);
}
