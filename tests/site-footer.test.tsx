import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/home/site-footer";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";

describe("third-party licenses in the shared footer", () => {
  it.each([
    ["CA", "Llicències"],
    ["ES", "Licencias"],
    ["EU", "Lizentziak"],
    ["GL", "Licenzas"],
    ["OC", "Licéncies"],
  ] as const)("links to the grouped licenses page in %s", (language, label) => {
    render(
      <LanguageSettingsProvider language={language} settings={{ selectorVisible: true, visibleLanguageCodes: [language] }}>
        <SiteFooter />
      </LanguageSettingsProvider>,
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/llicencies");
    expect(screen.queryByRole("link", { name: /Apache 2.0/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/rbarrachina/diagnosi-ia");
  });
});
