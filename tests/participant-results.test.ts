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
        ...[
          { option_id: "option-0", option_value: 0, option_text: "Gens / No ho faig" },
          { option_id: "option-1", option_value: 1, option_text: "Una mica / Ocasionalment" },
          { option_id: "option-2", option_value: 2, option_text: "Bastant / Habitualment" },
          { option_id: "option-3", option_value: 3, option_text: "Molt / Soc un referent" },
        ].map((option) => ({
          block_position: 1,
          block_title: "Bloc",
          question_position: 1,
          question_block_position: 1,
          question_text: "Pregunta",
          randomize_options: 0,
          value: 2,
          selected_option_id: "option-2",
          ...option,
        })),
      ]]);

    const result = await getParticipantResult({
      participantUserId: "opaque-user-1",
      publicCode: "C-ABCD-EFGH",
    });

    expect(result?.globalScore).toBe(50);
    expect(result?.blocks[0].score).toBe(66.67);
    expect(result?.blocks[0].questions[0].label).toContain("Bastant");
    expect(result?.blocks[0].questions[0].randomizeOptions).toBe(false);
    expect(result?.blocks[0].questions[0].options).toEqual([
      { value: 0, label: "Gens / No ho faig" },
      { value: 1, label: "Una mica / Ocasionalment" },
      { value: 2, label: "Bastant / Habitualment" },
      { value: 3, label: "Molt / Soc un referent" },
    ]);
    expect(execute.mock.calls[0][1]).toEqual(["opaque-user-1", "C-ABCD-EFGH"]);
    expect(execute.mock.calls[1][1]).toEqual(["opaque-user-1", "C-ABCD-EFGH"]);
    for (const [query] of execute.mock.calls) {
      expect(query).toContain("participant_submissions.participant_user_id = ?");
      expect(query).toContain("diagnostic_spaces.public_code = ?");
    }
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
    expect(execute.mock.calls[0][1]).toEqual(["opaque-user-2", "C-ABCD-EFGH"]);
  });

  it("lists all and only the current account's participations", async () => {
    execute.mockResolvedValueOnce([[summary]]);
    const results = await listParticipantResults("opaque-user-1");
    expect(results).toHaveLength(1);
    expect(execute.mock.calls[0][1]).toEqual(["opaque-user-1"]);
    expect(execute.mock.calls[0][0]).toContain("participant_submissions.participant_user_id = ?");
  });
});
