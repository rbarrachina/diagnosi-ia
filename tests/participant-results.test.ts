import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ mysqlPool: { execute } }));

const { getParticipantResult, listParticipantResults } = await import(
  "@/lib/repositories/participant-results"
);

const summary = {
  centre_name: "Institut de Prova",
  public_code: "C-ABCD-EFGH",
  questionnaire_title: "Diagnosi IA",
  questionnaire_version: "2026.2",
  language_code: "ca",
  completed_at: "2026-09-16T10:00:00.000Z",
  global_score: "50.00",
};

describe("participant results repository", () => {
  beforeEach(() => execute.mockReset());

  it("loads only the participation selected by the session pseudonym", async () => {
    execute
      .mockResolvedValueOnce([[summary]])
      .mockResolvedValueOnce([[
        {
          block_position: 1,
          block_title: "Bloc",
          question_position: 1,
          question_block_position: 1,
          question_text: "Pregunta",
          value: 2,
          option_text: "Bastant / Habitualment",
        },
      ]]);

    const result = await getParticipantResult({
      participantUserId: "opaque-user-1",
      publicCode: "C-ABCD-EFGH",
    });

    expect(result?.globalScore).toBe(50);
    expect(result?.blocks[0].score).toBe(66.67);
    expect(result?.blocks[0].questions[0].label).toContain("Bastant");
    expect(execute.mock.calls[0][1]).toEqual(["opaque-user-1", "C-ABCD-EFGH"]);
    expect(execute.mock.calls[1][1]).toEqual(["opaque-user-1", "C-ABCD-EFGH"]);
    expect(JSON.stringify(result)).not.toContain("opaque-user-1");
    expect(JSON.stringify(result)).not.toContain("submission_id");
  });

  it("does not return another account's participation", async () => {
    execute.mockResolvedValueOnce([[]]);
    await expect(
      getParticipantResult({
        participantUserId: "opaque-user-2",
        publicCode: "C-ABCD-EFGH",
      }),
    ).resolves.toBeNull();
    expect(execute).toHaveBeenCalledOnce();
  });

  it("lists all and only the current account's participations", async () => {
    execute.mockResolvedValueOnce([[summary]]);
    const results = await listParticipantResults("opaque-user-1");
    expect(results).toHaveLength(1);
    expect(execute.mock.calls[0][1]).toEqual(["opaque-user-1"]);
  });
});
