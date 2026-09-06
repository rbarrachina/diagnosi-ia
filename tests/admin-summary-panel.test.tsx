import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { AdminSummaryPanel } from "@/components/admin/admin-summary-panel";

it("links indicators and actionable alerts to the corresponding admin views", () => {
  render(
    <AdminSummaryPanel
      minimumResponseCount={3}
      summary={{
        activeCentres: 8,
        suspendedCentres: 2,
        pendingCentres: 3,
        centresWithoutQuestionnaire: 4,
        centresWithoutResponses: 5,
        computableResponses: 47,
        activeCentresWithoutQuestionnaire: 2,
        centresWithQuestionnaireWithoutResponses: 1,
        activeQuestionnaire: {
          id: "questionnaire-2026-2",
          title: "Diagnosi IA",
          version: "2026.2",
          createdAt: "2026-09-01T09:00:00.000Z",
          centreCount: 6,
          computableResponses: 38,
        },
      }}
    />,
  );

  expect(screen.getByRole("link", { name: /Centres suspesos 2/ })).toHaveAttribute(
    "href",
    "/admin?section=centres&filter=suspended",
  );
  expect(screen.getByRole("link", { name: /Respostes computables 47/ })).toHaveAttribute(
    "href",
    "/admin?section=results&scope=all&questionnaireId=questionnaire-2026-2",
  );
  expect(screen.getByText("Requereixen atenció")).toBeVisible();
  expect(
    screen.getByRole("link", { name: /2 centres actius sense qüestionari/ }),
  ).toHaveAttribute(
    "href",
    "/admin?section=centres&filter=active_without_questionnaire",
  );
});

it("hides the attention block when no action is needed", () => {
  render(
    <AdminSummaryPanel
      minimumResponseCount={3}
      summary={{
        activeCentres: 1,
        suspendedCentres: 0,
        pendingCentres: 0,
        centresWithoutQuestionnaire: 0,
        centresWithoutResponses: 0,
        computableResponses: 4,
        activeCentresWithoutQuestionnaire: 0,
        centresWithQuestionnaireWithoutResponses: 0,
        activeQuestionnaire: {
          id: "questionnaire-2026-2",
          title: "Diagnosi IA",
          version: "2026.2",
          createdAt: "2026-09-01T09:00:00.000Z",
          centreCount: 1,
          computableResponses: 4,
        },
      }}
    />,
  );

  expect(screen.queryByText("Requereixen atenció")).not.toBeInTheDocument();
});
