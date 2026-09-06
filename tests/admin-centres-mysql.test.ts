import { expect, it, vi } from "vitest";

const execute = vi.fn(async (query: string, values: unknown[]) => {
  if (!query || !Array.isArray(values)) {
    throw new Error("Expected a centre query");
  }

  return [
    [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Institut de Prova",
        official_code: "08000001",
        municipality: "Barcelona",
        questionnaire_id: "002",
      },
    ],
  ];
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({
  mysqlPool: { execute },
}));

const { listAdminCentresWithResults } = await import("@/lib/admin/centres");

it("lists only institutional centre fields for admin result selection", async () => {
  await expect(listAdminCentresWithResults(3)).resolves.toEqual([
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Institut de Prova",
      officialCode: "08000001",
      municipality: "Barcelona",
      questionnaireIds: ["002"],
    },
  ]);

  const [query] = execute.mock.calls[0] ?? [];
  expect(query).toContain("inner join diagnostic_spaces");
  expect(query).not.toContain("centre_accounts");
  expect(query).toContain("inner join submissions");
  expect(query).toContain("having count(submissions.id) > ?");
  expect(query).not.toContain("answers");
  expect(execute.mock.calls[0]?.[1]).toEqual([3]);
});
