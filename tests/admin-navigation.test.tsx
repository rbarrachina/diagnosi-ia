import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AdminRouteFrame } from "@/components/admin/admin-route-frame";

describe("admin navigation", () => {
  beforeEach(() => {
    document.documentElement.dataset.adminSidebar = "expanded";
  });

  it("keeps every administration section in the shared route frame", () => {
    render(
      <AdminRouteFrame
        activeSection="questionnaires"
        footer={<div>Peu de Diagnosi IA</div>}
        selectedQuestionnaireId="questionnaire-2026-2"
      >
        <div>Contingut administratiu</div>
      </AdminRouteFrame>,
    );

    expect(screen.getByText("Administració")).toBeInTheDocument();
    expect(screen.getByText("Contingut administratiu")).toBeVisible();
    expect(screen.getByText("Peu de Diagnosi IA")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Qüestionaris" })[0]).toHaveAttribute(
      "href",
      "/admin?section=questionnaires&questionnaireId=questionnaire-2026-2",
    );
    expect(screen.getAllByRole("link", { name: "Resultats" })[0]).toHaveAttribute(
      "href",
      "/admin?section=results",
    );
    expect(screen.getAllByRole("link", { name: "Usuaris" })[0]).toHaveAttribute(
      "href",
      "/admin?section=admins",
    );
    expect(screen.getAllByRole("link", { name: "Configuració" })[0]).toHaveAttribute(
      "href",
      "/admin?section=settings",
    );
  });

  it("persists the collapsed administration sidebar without hiding navigation", () => {
    render(
      <AdminRouteFrame
        activeSection="admins"
        footer={<div>Peu</div>}
        selectedQuestionnaireId={null}
      >
        <div>Usuaris</div>
      </AdminRouteFrame>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Plega la barra lateral" }));

    expect(
      screen.getByRole("button", { name: "Expandeix la barra lateral" }),
    ).toBeInTheDocument();
    expect(document.documentElement.dataset.adminSidebar).toBe("collapsed");
    expect(screen.getAllByRole("link", { name: "Usuaris" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
