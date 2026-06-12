import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260609162000_add_single_owner_space_reset_rpc.sql",
  ),
  "utf8",
);
const activeQuestionnaireResetMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612102000_reset_space_to_active_questionnaire.sql",
  ),
  "utf8",
);

describe("owner diagnostic space reset migration", () => {
  it("enforces one authenticated diagnostic space per owner", () => {
    expect(migration).toContain("ranked_owner_spaces");
    expect(migration).toContain("owner_user_id = null");
    expect(migration).toContain("results_token_enabled = false");
    expect(migration).toContain(
      "create unique index diagnostic_spaces_owner_user_id_unique_idx",
    );
    expect(migration).toContain("where owner_user_id is not null");
  });

  it("resets only anonymous responses and rotates links", () => {
    expect(migration).toContain("delete from public.answers");
    expect(migration).toContain("delete from public.submissions");
    expect(migration).toContain("set public_code = p_new_public_code");
    expect(migration).toContain("results_token_hash = p_results_token_hash");
    expect(migration).not.toContain("delete from public.questions");
    expect(migration).not.toContain("delete from public.questionnaires");
  });

  it("assigns the active questionnaire version when resetting an owner space", () => {
    expect(activeQuestionnaireResetMigration).toContain("where questionnaires.is_active = true");
    expect(activeQuestionnaireResetMigration).toContain(
      "questionnaire_id = active_questionnaire_id",
    );
    expect(activeQuestionnaireResetMigration).toContain("delete from public.answers");
    expect(activeQuestionnaireResetMigration).toContain("delete from public.submissions");
    expect(activeQuestionnaireResetMigration).not.toContain("delete from public.questions");
    expect(activeQuestionnaireResetMigration).not.toContain("delete from public.questionnaires");
  });

  it("keeps the reset RPC server-only", () => {
    expect(activeQuestionnaireResetMigration).toContain(
      "revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from anon;",
    );
    expect(activeQuestionnaireResetMigration).toContain(
      "revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from authenticated;",
    );
    expect(activeQuestionnaireResetMigration).toContain(
      "grant execute on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) to service_role;",
    );
  });
});
