import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminResultsFilters } from "@/components/admin/admin-results-filters";

const centres = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Institut de Prova",
    officialCode: "08000001",
    municipality: "Barcelona",
    questionnaireIds: ["002"],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Institut Segon",
    officialCode: "08000002",
    municipality: "Girona",
    questionnaireIds: ["003"],
  },
];

const versions = [
  {
    id: "002",
    title: "Diagnosi IA",
    version: "2026.2",
  },
  {
    id: "003",
    title: "Diagnosi nova",
    version: "2027.1",
  },
];

describe("admin result filters", () => {
  it("uses all centres as the default scope", () => {
    render(
      <AdminResultsFilters
        centres={centres}
        selectedCentreId={null}
        selectedQuestionnaireId="002"
        selectedScope="all"
        versions={versions}
      />,
    );

    expect(screen.getByLabelText("Centre")).toHaveValue("all");
    expect(screen.getByLabelText("Qüestionari")).toHaveValue("002");
    expect(screen.queryByRole("option", { name: /Institut Segon/ })).not.toBeInTheDocument();
  });

  it("limits questionnaires to those completed by the selected centre", () => {
    render(
      <AdminResultsFilters
        centres={centres}
        selectedCentreId="22222222-2222-4222-8222-222222222222"
        selectedQuestionnaireId={null}
        selectedScope="centre"
        versions={versions}
      />,
    );

    expect(screen.getByLabelText("Centre")).toHaveValue(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(
      screen.getByRole("option", { name: "2027.1 · Diagnosi nova" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "2026.2 · Diagnosi IA" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Centre"), { target: { value: "all" } });
    expect(
      screen.getByRole("option", { name: "2026.2 · Diagnosi IA" }),
    ).toBeInTheDocument();
  });
});
