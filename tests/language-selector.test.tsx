import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageSelector } from "@/components/home/language-selector";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";

describe("language selector", () => {
  it("does not render when it is globally hidden", () => {
    render(
      <LanguageSettingsProvider
        settings={{ selectorVisible: false, visibleLanguageCodes: ["CA"] }}
      >
        <LanguageSelector />
      </LanguageSettingsProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Idioma actual: català" }),
    ).not.toBeInTheDocument();
  });

  it("only lists the globally selected languages", () => {
    render(
      <LanguageSettingsProvider
        settings={{
          selectorVisible: true,
          visibleLanguageCodes: ["CA", "ES"],
        }}
      >
        <LanguageSelector />
      </LanguageSettingsProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Idioma actual: català" }),
    );

    expect(screen.getByRole("menuitem", { name: /CA Català/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /ES Castellano/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /EU Euskara/ })).not.toBeInTheDocument();
  });
});
