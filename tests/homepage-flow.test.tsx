import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import packageJson from "@/package.json";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/responsible-access", () => ({
  getResponsibleAccessMode: vi.fn(async () => "centre_xtec"),
}));

const { default: Home } = await import("@/app/page");

describe("initial page", () => {
  it("combines the product, privacy and role information", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { level: 1, name: "Diagnosi IA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Indicador OIA-12")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Informació de privacitat" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Informació de versió i projecte" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Informació de privacitat",
      "Informació de versió i projecte",
    ]);
    expect(
      screen.getByRole("heading", { level: 2, name: "Soc responsable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Soc docent" }),
    ).toBeInTheDocument();
  });

  it("starts responsible access and returns to the management page", async () => {
    render(await Home());

    expect(
      screen.getByRole("link", { name: "Accedeix amb el compte XTEC" }),
    ).toHaveAttribute("href", "/auth/login?next=%2Fcrear");
  });

  it("explains the privacy guarantees from the privacy control", async () => {
    render(await Home());

    const privacyButton = screen.getByRole("button", {
      name: "Informació de privacitat",
    });
    fireEvent.click(privacyButton);

    expect(privacyButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { level: 2, name: "Privacitat i anonimat" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Les respostes són anònimes/)).toBeInTheDocument();
    expect(
      screen.getByText("No es desa ni es mostra el nom del centre."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tanca la informació de privacitat",
      }),
    );
    expect(privacyButton).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the beta version, license and repository without overlapping panels", async () => {
    render(await Home());

    const projectButton = screen.getByRole("button", {
      name: "Informació de versió i projecte",
    });
    const privacyButton = screen.getByRole("button", {
      name: "Informació de privacitat",
    });

    fireEvent.click(projectButton);

    expect(projectButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(`Versió ${packageJson.version}`),
    ).toBeInTheDocument();
    expect(screen.getByText(/versió beta i pot contenir errors/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apache-2.0" })).toHaveAttribute(
      "href",
      "https://www.apache.org/licenses/LICENSE-2.0",
    );
    expect(
      screen.getByRole("link", { name: "repositori a GitHub" }),
    ).toHaveAttribute("href", "https://github.com/rbarrachina/diagnosi-ia");

    fireEvent.click(privacyButton);

    expect(projectButton).toHaveAttribute("aria-expanded", "false");
    expect(privacyButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.queryByRole("heading", { level: 2, name: "Versió i projecte" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Privacitat i anonimat" }),
    ).toBeInTheDocument();
  });
});
