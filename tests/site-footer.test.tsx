import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/home/site-footer";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";

describe("third-party licenses in the shared footer", () => {
  it.each([
    ["CA", "Llicències de tercers"],
    ["ES", "Licencias de terceros"],
    ["EU", "Hirugarrenen lizentziak"],
    ["GL", "Licenzas de terceiros"],
    ["OC", "Licéncies de tercèrs"],
  ] as const)("links to the public notice file in %s", (language, label) => {
    render(
      <LanguageSettingsProvider language={language} settings={{ selectorVisible: true, visibleLanguageCodes: [language] }}>
        <SiteFooter />
      </LanguageSettingsProvider>,
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/THIRD_PARTY_NOTICES.txt");
    expect(screen.getByRole("link", { name: /Apache 2.0/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/rbarrachina/diagnosi-ia");
  });
});
