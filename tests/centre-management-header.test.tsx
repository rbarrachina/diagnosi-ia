import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CentreManagementHeader } from "@/components/create-space/centre-management-header";
import type { CentreProfile } from "@/lib/centres/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/auth/auth-actions", () => ({
  IconLogoutButton: () => (
    <button aria-label="Surt" type="button" />
  ),
}));

const centre: CentreProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "a8075669@xtec.cat",
  accountDisplayName: "Centre de prova",
  officialCode: "08075669",
  officialName: "Institut Escola El Til·ler",
  municipality: "Barcelona",
  territorialArea: "Consorci d'Educació de Barcelona",
  educationalService: "SE Sant Andreu",
  sourceStatus: "ok",
  lastAttemptAt: "2026-07-17T13:23:00.000Z",
  lastSuccessAt: "2026-07-17T13:23:00.000Z",
  profileConfirmedAt: "2026-07-17T13:24:00.000Z",
  allowXtec: true,
  customDomain: null,
  emailPolicyConfiguredAt: "2026-07-17T13:25:00.000Z",
  displayName: "Institut Escola El Til·ler",
};

describe("centre management header", () => {
  it("shows the signed-in name as plain text before the icon controls", () => {
    render(
      <CentreManagementHeader accountName="Centre de prova" />,
    );
    const name = screen.getByText("Centre de prova");
    const language = screen.getByRole("button", { name: "Idioma: Català" });
    expect(name.tagName).toBe("SPAN");
    expect(name.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Menú del compte/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Surt" })).toBeVisible();
    expect(screen.queryByText("Accés XTEC")).not.toBeInTheDocument();
  });

  it("keeps one visible logout action without an account menu", () => {
    render(
      <CentreManagementHeader accountName="Centre de prova" />,
    );
    expect(screen.getAllByRole("button", { name: "Surt" })).toHaveLength(1);
    expect(screen.queryByText(centre.email)).not.toBeInTheDocument();
  });
});
