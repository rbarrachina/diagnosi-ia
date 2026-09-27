import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { AdminSidebar } from "@/components/admin/admin-navigation";
import { getInterfaceMessages } from "@/lib/i18n/interface-messages";
import { AVAILABLE_LANGUAGES } from "@/lib/i18n/languages";
import { resolveCatalogue } from "@/lib/i18n/resolve-catalogue";
import type { PublicQuestionnaire } from "@/lib/questionnaire/types";
import type { ReactNode } from "react";

function Spanish({ children }: { children: ReactNode }) {
  return <LanguageSettingsProvider language="ES" settings={{ selectorVisible: true, visibleLanguageCodes: ["CA", "ES"] }}>{children}</LanguageSettingsProvider>;
}

const questionnaire: PublicQuestionnaire = {
  centreName: "Centre de prova", publicCode: "C-ABCD-EFGH", languageCode: "ca",
  questionnaireVersion: "2026.2", estimatedMinutes: 10,
  blocks: [{ id: "01", position: 1, title: "Bloc redactat pel centre", questions: [{
    id: "q1", position: 1, blockPosition: 1, text: "Pregunta original en català",
    randomizeOptions: false,
    options: [0, 1, 2, 3].map((score) => ({ id: `option${score}`, score: score as 0 | 1 | 2 | 3, text: `Resposta original ${score}` })),
  }] }],
};

afterEach(() => vi.unstubAllGlobals());

describe("interface language", () => {
  it("falls back per missing, blank or invalid entry, including nested arrays", () => {
    expect(resolveCatalogue({ menu: { label: "Desa", error: "Error" }, options: ["Sí", "No"] }, {
      menu: { label: "Guardar", error: " " }, options: ["Sí"],
    })).toEqual({ menu: { label: "Guardar", error: "Error" }, options: ["Sí", "No"] });
    expect(resolveCatalogue({ label: "Desa" }, { label: null })).toEqual({ label: "Desa" });
  });

  it("preserves every interpolation parameter in each selectable language", () => {
    const base = getInterfaceMessages("CA");
    const placeholders = (value: string) => [...value.matchAll(/\{\w+\}/g)].map(([match]) => match).sort();
    for (const { code } of AVAILABLE_LANGUAGES) {
      const translated = getInterfaceMessages(code);
      for (const key of Object.keys(base) as Array<keyof typeof base>) {
        expect(translated[key], `${code}:${key}`).not.toHaveLength(0);
        expect(placeholders(translated[key]), `${code}:${key}`).toEqual(placeholders(base[key]));
      }
    }
  });

  it("translates navigation and its accessible labels", () => {
    render(<Spanish><AdminSidebar activeSection="settings" expanded onToggle={() => {}} selectedQuestionnaireId={null} /></Spanish>);
    expect(screen.getByRole("complementary", { name: "Navegación de administración" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Cuestionarios" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pliega la barra lateral" })).toBeVisible();
  });

  it("translates validation and expired-session recovery while preserving authored questions", async () => {
    window.scrollTo = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Cal iniciar sessió." }) }));
    const { container } = render(<Spanish><QuestionnaireForm questionnaire={questionnaire} /></Spanish>);
    fireEvent.click(screen.getByRole("button", { name: "Comienza el cuestionario" }));
    expect(screen.getByText("Bloc redactat pel centre")).toBeVisible();
    expect(screen.getByText("Pregunta original en català")).toBeVisible();
    expect(container.querySelector("[lang]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Envía las respuestas" }));
    expect(screen.getByText("Debes responder esta pregunta.")).toBeVisible();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Resposta original 0" })).toHaveFocus());
    fireEvent.click(screen.getByRole("radio", { name: "Resposta original 0" }));
    fireEvent.click(screen.getByRole("button", { name: "Envía las respuestas" }));
    expect(await screen.findByRole("link", { name: "Vuelve a autenticarte" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("alert")).toHaveTextContent("La sesión ha caducado.");
  });
});
