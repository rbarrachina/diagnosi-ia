import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "@/package.json";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/responsible-access", () => ({
  getResponsibleAccessMode: vi.fn(async () => "centre_xtec"),
}));

const { default: Home } = await import("@/app/page");

beforeEach(() => {
  const values = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  delete document.documentElement.dataset.theme;
});

describe("initial page", () => {
  it("combines the product and role information", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Diagnosi de la competència digital docent en IA",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "[OIA-12] Fer una diagnosi de quina és la competència digital docent en IA del claustre",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Informació sobre privacitat" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Informació de versió i projecte" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activa el tema fosc" }),
    ).toBeInTheDocument();
    const xtecHeaderButton = screen.getByRole("button", { name: "Accés XTEC" });
    expect(xtecHeaderButton).toHaveClass("h-10", "w-10", "rounded-full", "bg-action");
    expect(xtecHeaderButton).not.toHaveTextContent("Accés XTEC");
    expect(
      screen.getByRole("heading", { level: 3, name: "Una diagnosi amb criteri" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "El centre gestiona" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "El docent respon" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/documentació de competència digital docent/)).toBeVisible();
    expect(
      screen.getByText("orientacions per a l’ús de la IA als centres educatius"),
    ).toBeVisible();
    expect(screen.getByText("Un únic espai de diagnosi per centre")).toBeVisible();
    expect(
      screen.getByText("Participació anònima i resultats de conjunt"),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Crea o gestiona l’espai de diagnosi" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No pot crear cap compte a l’aplicació/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ves a la mostra del qüestionari" }),
    ).toHaveAttribute("href", "#mostra-questionari");
    expect(
      screen.getByRole("link", {
        name: "Accessibilitat: WCAG 2.2, s’obre en una pestanya nova",
      }),
    ).toHaveAttribute("href", "https://www.w3.org/TR/WCAG22/");
  });

  it("explains centre access before starting the existing Google login", async () => {
    render(await Home());

    const accessButton = screen.getByRole("button", {
      name: "Accedeix amb el compte de centre",
    });
    fireEvent.click(accessButton);

    const dialog = screen.getByRole("dialog", {
      name: "Espai del centre",
    });

    expect(within(dialog).getByText(/@xtec.cat/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Heu d’accedir amb el compte institucional/),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        /La identificació del centre es manté separada/,
      ),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Accedeix amb XTEC" }),
    ).toHaveAttribute("href", "/auth/login?next=%2Fcrear");

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.click(accessButton);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Tanca l’accés del centre" }),
    );
    expect(dialog).not.toHaveAttribute("open");
  });

  it("allows switching the visual theme", async () => {
    render(await Home());

    const themeButton = screen.getByRole("button", {
      name: "Activa el tema fosc",
    });
    fireEvent.click(themeButton);

    expect(themeButton).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("diagnosi-theme")).toBe("dark");
  });

  it("shows an informational homepage language list", async () => {
    render(await Home());

    const languageButton = screen.getByRole("button", {
      name: "Idioma actual: català",
    });
    fireEvent.click(languageButton);

    expect(languageButton).toHaveAttribute("aria-expanded", "true");
    const languageRegion = screen.getByRole("region", {
      name: "Idiomes previstos",
    });
    expect(within(languageRegion).getByText("Català")).toBeInTheDocument();
    expect(within(languageRegion).getByText("Castellano")).toBeInTheDocument();
    expect(within(languageRegion).getByText("Euskara")).toBeInTheDocument();
    expect(within(languageRegion).getByText("Galego")).toBeInTheDocument();
    expect(within(languageRegion).getByText("Aranés")).toBeInTheDocument();
    expect(languageButton).toHaveTextContent("CA");
  });

  it("shows a static example of the first active questionnaire item", async () => {
    render(await Home());

    const example = screen.getByRole("group", {
      name: "Exemple de la primera pregunta del qüestionari",
    });

    expect(
      within(example).getByText(
        /Identifico oportunitats i limitacions de la IA en contextos educatius/,
      ),
    ).toBeInTheDocument();
    expect(within(example).getByText("Gens / No ho faig")).toBeInTheDocument();
    expect(
      within(example).getByText("Una mica / Ocasionalment"),
    ).toBeInTheDocument();
    expect(
      within(example).getByText("Bastant / Habitualment"),
    ).toBeInTheDocument();
    expect(
      within(example).getByText("Molt / Soc un referent al centre"),
    ).toBeInTheDocument();
    expect(within(example).queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows the compact project information in the footer", async () => {
    render(await Home());

    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Autor: Rafa Barrachina",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Llicència Apache 2.0" })).toHaveAttribute(
      "href",
      "https://www.apache.org/licenses/LICENSE-2.0",
    );
    expect(
      screen.getByRole("link", { name: "Codi font a GitHub" }),
    ).toHaveAttribute("href", "https://github.com/rbarrachina/diagnosi-ia");
    expect(
      screen.getByRole("navigation", { name: "Informació del projecte" }),
    ).toBeInTheDocument();
  });
});
