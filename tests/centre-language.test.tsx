import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";
import { CentreMobileNavigation } from "@/components/create-space/centre-workspace-navigation";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";

function Spanish({ children }: { children: ReactNode }) {
  return (
    <LanguageSettingsProvider
      language="ES"
      settings={{ selectorVisible: true, visibleLanguageCodes: ["CA", "ES"] }}
    >
      {children}
    </LanguageSettingsProvider>
  );
}

describe("centre workspace language", () => {
  it("reuses the Spanish centre catalogue in settings and navigation", () => {
    render(
      <Spanish>
        <CentreEmailPolicyForm
          initialPolicy={{ allowXtec: true, configured: true, customDomain: null }}
        />
        <CentreMobileNavigation
          hasCentre
          questionnairePreviewUrl="/vista"
          resultsUrl="/resultados"
          view="settings"
        />
      </Spanish>,
    );

    expect(screen.getByRole("heading", { name: "Correos admitidos" })).toBeVisible();
    expect(screen.getByText(/No se guarda su correo/)).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Secciones del centro" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Configuración" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Previsualización" })).toBeVisible();
  });
});
