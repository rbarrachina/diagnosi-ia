import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "@/package.json";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/i18n/locale", () => ({ getCurrentLanguage: vi.fn(async () => "CA") }));

let responsiblePortalStatus: "closed" | "open" = "open";

vi.mock("@/lib/auth/responsible-access", () => ({
  getResponsibleAccessMode: vi.fn(async () => "centre_xtec"),
  getResponsiblePortalStatus: vi.fn(async () => responsiblePortalStatus),
}));

const { default: Home } = await import("@/app/page");

beforeEach(() => {
  responsiblePortalStatus = "open";
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
    for (const sectionId of [
      "inici",
      "com-funciona",
      "mostra-questionari",
    ]) {
      expect(document.getElementById(sectionId)).toHaveClass("min-h-[100svh]");
    }
    expect(document.getElementById("acces-docent")?.parentElement).toHaveClass(
      "min-h-[100svh]",
    );
    expect(
      document.getElementById("mostra-questionari")!.compareDocumentPosition(
        document.getElementById("acces-docent")!,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
    for (const title of [
      "Una diagnosi compartida per avançar amb criteri",
      "Preguntes clares per obtenir una visió compartida",
      "Entra amb el codi del qüestionari",
      "Ja hi has participat?",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toHaveClass(
        "text-3xl",
        "sm:text-4xl",
      );
    }
    expect(screen.getByText(/documentació de competència digital docent/)).toBeVisible();
    expect(screen.getByText(/orientacions per a l’ús de la IA/)).toBeVisible();
    expect(
      screen.getByText(
        "Una base pedagògica comuna, un espai gestionat pel centre i una participació docent pseudonimitzada.",
      ),
    ).toHaveClass("lg:whitespace-nowrap");
    expect(screen.getByText("Un únic espai de diagnosi per centre")).toBeVisible();
    expect(
      screen.getByText("El centre només veu resultats de conjunt"),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Crea o gestiona l’espai de diagnosi" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/identificador pseudònim permet recuperar/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ves a la mostra del qüestionari" }),
    ).toHaveAttribute("href", "#mostra-questionari");
    expect(
      screen.getAllByRole("link", { name: "Accés docent" }).some(
        (link) => link.getAttribute("href") === "#acces-docent",
      ),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "Consulta les meves participacions" }),
    ).toHaveClass("border-action", "rounded-2xl");
    expect(
      screen.getByRole("heading", { level: 2, name: "Ja hi has participat?" }),
    ).toBeVisible();
    expect(
      screen.getByText(/consulta exclusivament les teves respostes i resultats/),
    ).toBeVisible();
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

  it("shows prelaunch mode without exposing a centre login link", async () => {
    responsiblePortalStatus = "closed";
    render(await Home());

    const accessButtons = screen.getAllByRole("button", {
      name: "Accés de centres properament",
    });

    expect(accessButtons).toHaveLength(2);
    expect(accessButtons.every((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(screen.queryByRole("link", { name: "Accedeix amb XTEC" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Codi del qüestionari")).toBeDisabled();
    expect(screen.getByText("Accés docent properament")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Consulta les meves participacions" }),
    ).not.toBeInTheDocument();
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
      name: "Idioma: Català",
    });
    fireEvent.click(languageButton);

    expect(languageButton).toHaveAttribute("aria-expanded", "true");
    const languageRegion = screen.getByRole("region", {
      name: "Idiomes",
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
