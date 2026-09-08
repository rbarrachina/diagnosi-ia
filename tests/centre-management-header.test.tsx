import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CentreManagementHeader } from "@/components/create-space/centre-management-header";
import type { CentreProfile } from "@/lib/centres/types";

vi.mock("@/components/auth/auth-actions", () => ({
  LogoutButton: ({ label = "Tanca sessió" }: { label?: string }) => (
    <button type="button">{label}</button>
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
  it("shows the signed-in account where the access button was", () => {
    render(
      <CentreManagementHeader accountName="Centre de prova" email={centre.email} />,
    );
    expect(screen.getByRole("button", { name: "Menú del compte de Centre de prova" })).toBeInTheDocument();
    expect(screen.queryByText("Accés XTEC")).not.toBeInTheDocument();
  });

  it("opens the account menu and keeps the logout action", () => {
    render(
      <CentreManagementHeader accountName="Centre de prova" email={centre.email} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Menú del compte de Centre de prova" }));
    expect(screen.getByRole("region", { name: "Opcions del compte" })).toBeInTheDocument();
    expect(screen.getByText(centre.email)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Surt" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Fitxa" })).not.toBeInTheDocument();
  });
});
