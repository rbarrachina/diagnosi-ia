import { describe, expect, it } from "vitest";
import { AVAILABLE_LANGUAGES } from "@/lib/i18n/languages";
import { getMessages } from "@/lib/i18n/messages";

describe("translation catalogues", () => {
  it("provides a typed catalogue for every selectable language", () => {
    for (const { code } of AVAILABLE_LANGUAGES) {
      const catalogue = getMessages(code);
      expect(catalogue.common.language).not.toHaveLength(0);
      expect(catalogue.home.titleHighlight).not.toHaveLength(0);
      expect(catalogue.home.options).toHaveLength(4);
    }
  });

  it("uses Catalan as the base catalogue", () => {
    expect(getMessages("CA").common.language).toBe("Idioma");
    expect(getMessages("CA").home.teacherButton).toBe("Accés docent");
  });

  it("preserves interpolation placeholders in every language", () => {
    const base = flattenStrings(getMessages("CA"));
    for (const { code } of AVAILABLE_LANGUAGES) {
      const translated = flattenStrings(getMessages(code));
      for (const [path, value] of Object.entries(base)) {
        expect(extractPlaceholders(translated[path]), `${code}:${path}`).toEqual(
          extractPlaceholders(value),
        );
      }
    }
  });
});

function flattenStrings(value: unknown, path = "", output: Record<string, string> = {}) {
  if (typeof value === "string") output[path] = value;
  else if (Array.isArray(value)) value.forEach((item, index) => flattenStrings(item, `${path}.${index}`, output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => flattenStrings(item, path ? `${path}.${key}` : key, output));
  return output;
}

function extractPlaceholders(value: string | undefined) {
  return [...(value?.matchAll(/\{\w+\}/g) ?? [])].map(([placeholder]) => placeholder).sort();
}
