import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CentreManagementHeader } from "@/components/create-space/centre-management-header";
import type { CentreProfile } from "@/lib/centres/types";

vi.mock("@/components/auth/auth-actions", () => ({
  LogoutButton: () => <button type="button">Tanca sessió</button>,
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
  it("keeps the centre profile collapsed after a questionnaire exists", () => {
    render(
      <CentreManagementHeader
        centre={centre}
        collapseCentreProfile
        email={centre.email}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Fitxa" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("heading", { name: centre.displayName }),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { name: centre.displayName }),
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("can show the centre profile while onboarding is still in progress", () => {
    render(
      <CentreManagementHeader
        centre={centre}
        collapseCentreProfile={false}
        email={centre.email}
      />,
    );

    expect(
      screen.getByRole("heading", { name: centre.displayName }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fitxa" }),
    ).not.toBeInTheDocument();
  });

  it("keeps a disabled custom domain disabled after closing and reopening", async () => {
    const centreWithCustomDomain: CentreProfile = {
      ...centre,
      customDomain: "domini.cat",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          policy: {
            allowXtec: true,
            customDomain: null,
            configured: true,
          },
        }),
      ),
    );

    render(
      <CentreManagementHeader
        centre={centreWithCustomDomain}
        collapseCentreProfile
        email={centre.email}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Correu" }));
    const customDomain = screen.getByRole("checkbox", { name: /Domini propi/ });
    expect(customDomain).toBeChecked();

    fireEvent.click(customDomain);
    fireEvent.click(screen.getByRole("button", { name: "Desa i continua" }));
    await waitFor(() => {
      expect(screen.getByText("Configuració desada.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Correu" }));
    fireEvent.click(screen.getByRole("button", { name: "Correu" }));

    expect(
      screen.getByRole("checkbox", { name: /Domini propi/ }),
    ).not.toBeChecked();
  });
});
