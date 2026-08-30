import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CentreWorkspace } from "@/components/create-space/centre-workspace";
import type { CreatedSpaceResponse } from "@/components/create-space/create-space-form";
import { CentreRouteFrame } from "@/components/create-space/centre-route-frame";
import type { CentreProfile } from "@/lib/centres/types";

vi.mock("@/components/create-space/create-space-form", () => ({
  CreateSpaceForm: () => <div>Contingut del qüestionari</div>,
}));
vi.mock("@/components/create-space/centre-email-policy-form", () => ({
  CentreEmailPolicyForm: () => <div>Configuració dels correus</div>,
}));
vi.mock("@/components/create-space/centre-card", () => ({
  CentreCard: () => <div>Contingut de la fitxa</div>,
}));

const centre: CentreProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "a8075669@xtec.cat",
  accountDisplayName: "Centre de prova",
  officialCode: "08075669",
  officialName: "Institut Escola El Til·ler",
  municipality: "Barcelona",
  territorialArea: "Barcelona",
  educationalService: "SE Sant Andreu",
  sourceStatus: "ok",
  lastAttemptAt: null,
  lastSuccessAt: null,
  profileConfirmedAt: "2026-07-17T13:24:00.000Z",
  allowXtec: true,
  customDomain: null,
  emailPolicyConfiguredAt: "2026-07-17T13:25:00.000Z",
  displayName: "Institut Escola El Til·ler",
};

const space: CreatedSpaceResponse = {
  publicCode: "C-TEST-1234",
  questionnaireTitle: "Diagnosi IA",
  questionnaireVersion: "2026.2",
  publicUrl: "http://localhost:3000/q/C-TEST-1234",
  sharedResultsUrl: "http://localhost:3000/resultats/compartit/C-TEST-1234#token=test",
  ownerResultsUrl: "/espais/C-TEST-1234/resultats",
  questionnairePreviewUrl: "/espais/C-TEST-1234/questionari",
  totalSubmissions: 4,
};

describe("centre workspace", () => {
  it("keeps the workspace navigation and footer on dedicated access routes", () => {
    render(
      <CentreRouteFrame
        activeAccess="results"
        centreName={centre.displayName}
        footer={<div>Peu de Diagnosi IA</div>}
        questionnairePreviewUrl={space.questionnairePreviewUrl}
        resultsUrl={space.ownerResultsUrl}
      >
        <div>Resultats integrats</div>
      </CentreRouteFrame>,
    );

    expect(screen.getByText("Resultats integrats")).toBeVisible();
    expect(screen.getByText("Peu de Diagnosi IA")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Ves als resultats" })[0],
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("link", { name: "Qüestionari" })[0],
    ).toHaveAttribute("href", "/crear");
    expect(screen.getAllByRole("link", { name: "Fitxa" })[0]).toHaveAttribute(
      "href",
      "/crear?view=profile",
    );
    expect(
      screen.getAllByRole("link", { name: "Configuració" })[0],
    ).toHaveAttribute("href", "/crear?view=settings");
  });

  it("navigates between questionnaire, profile and settings without unmounting their state", () => {
    render(
      <CentreWorkspace
        centre={centre}
        centreName={centre.displayName}
        communicationTemplate={{ subject: "Assumpte", body: "Cos" }}
        existingSpace={space}
        footer={<div>Peu de pàgina</div>}
        responsibleEmail={centre.email}
      />,
    );
    expect(screen.getByText("Contingut del qüestionari")).toBeVisible();
    expect(screen.getByText("Peu de pàgina")).toBeInTheDocument();
    expect(screen.getByText("Configuració dels correus")).not.toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Fitxa" })[0]);
    expect(screen.getByText("Contingut de la fitxa")).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Configuració" })[0]);
    expect(screen.getByText("Contingut del qüestionari")).not.toBeVisible();
    expect(screen.getByText("Configuració dels correus")).toBeVisible();
  });

  it("moves questionnaire preview and results access into the responsive navigation", () => {
    render(
      <CentreWorkspace
        centre={centre}
        centreName={centre.displayName}
        communicationTemplate={{ subject: "Assumpte", body: "Cos" }}
        existingSpace={space}
        footer={<div>Peu de pàgina</div>}
        responsibleEmail={centre.email}
      />,
    );

    const questionnaireLinks = screen.getAllByRole("link", {
      name: "Veure qüestionari",
    });
    const resultsLinks = screen.getAllByRole("link", {
      name: "Ves als resultats",
    });

    expect(questionnaireLinks).toHaveLength(2);
    expect(resultsLinks).toHaveLength(2);
    expect(questionnaireLinks[0]).toHaveAttribute(
      "href",
      "/espais/C-TEST-1234/questionari",
    );
    expect(resultsLinks[0]).toHaveAttribute(
      "href",
      "/espais/C-TEST-1234/resultats",
    );
  });

  it("keeps a visible icon rail when the desktop sidebar is collapsed", () => {
    render(
      <CentreWorkspace
        centre={centre}
        centreName={centre.displayName}
        communicationTemplate={{ subject: "Assumpte", body: "Cos" }}
        existingSpace={space}
        footer={<div>Peu de pàgina</div>}
        responsibleEmail={centre.email}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Plega la barra lateral" }));

    expect(
      screen.getByRole("button", { name: "Expandeix la barra lateral" }),
    ).toBeInTheDocument();
    expect(document.documentElement.dataset.centreSidebar).toBe("collapsed");
    expect(screen.getAllByRole("button", { name: "Qüestionari" })[0]).toBeInTheDocument();
  });
});
