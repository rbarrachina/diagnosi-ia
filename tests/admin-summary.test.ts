import { beforeEach, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({
  mysqlPool: { execute },
}));

const { getAdminSummary } = await import("@/lib/admin/summary");

beforeEach(() => {
  execute.mockReset();
});

it("returns only aggregate administration indicators with the privacy threshold", async () => {
  execute
    .mockResolvedValueOnce([
      [
        {
          active_centres: "8",
          suspended_centres: "2",
          pending_centres: "3",
          centres_without_questionnaire: "4",
          centres_without_responses: "5",
          computable_responses: "47",
          active_centres_without_questionnaire: "2",
          centres_with_questionnaire_without_responses: "1",
        },
      ],
    ])
    .mockResolvedValueOnce([
      [
        {
          id: "questionnaire-2026-2",
          title: "Diagnosi IA",
          version: "2026.2",
          created_at: "2026-09-01T09:00:00.000Z",
          centre_count: "6",
          computable_responses: "38",
        },
      ],
    ]);

  await expect(getAdminSummary(3)).resolves.toEqual({
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
  });

  expect(execute).toHaveBeenCalledTimes(2);
  for (const [query, values] of execute.mock.calls) {
    expect(query).toContain("count(submissions.id)");
    expect(query).not.toContain("answers");
    expect(query).not.toMatch(/select\s+submissions\./i);
    expect(values).toEqual([3]);
  }
});

it("handles an empty administration database", async () => {
  execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

  await expect(getAdminSummary(0)).resolves.toEqual({
    activeCentres: 0,
    suspendedCentres: 0,
    pendingCentres: 0,
    centresWithoutQuestionnaire: 0,
    centresWithoutResponses: 0,
    computableResponses: 0,
    activeCentresWithoutQuestionnaire: 0,
    centresWithQuestionnaireWithoutResponses: 0,
    activeQuestionnaire: null,
  });
});
