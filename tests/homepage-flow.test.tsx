import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
      screen.getByText(/Les respostes són anònimes/),
    ).toBeInTheDocument();
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
});
