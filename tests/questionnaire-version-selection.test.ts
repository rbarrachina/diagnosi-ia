import { readFileSync } from "node:fs";
import { join } from "node:path";

const createSpaceService = readFileSync(
  join(process.cwd(), "lib/spaces/create-space.ts"),
  "utf8",
);

const submissionVersionMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611193000_allow_submissions_for_space_questionnaire_version.sql",
  ),
  "utf8",
);
const expandedLimitsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611220000_expand_questionnaire_admin_limits.sql",
  ),
  "utf8",
);

describe("questionnaire version selection", () => {
  it("creates new spaces from the currently active questionnaire", () => {
    expect(createSpaceService).toContain('.from("questionnaires")');
    expect(createSpaceService).toContain('.eq("is_active", true)');
    expect(createSpaceService).not.toContain("QUESTIONNAIRE_VERSION");
    expect(createSpaceService).not.toContain('.eq("version"');
  });

  it("allows submissions for the version assigned to the space even if inactive later", () => {
    expect(submissionVersionMigration).toContain(
      "and questionnaires.version = p_questionnaire_version",
    );
    expect(submissionVersionMigration).not.toContain(
      "and questionnaires.is_active = true",
    );
    expect(submissionVersionMigration).toContain("for update of diagnostic_spaces");
    expect(expandedLimitsMigration).toContain(
      "matched_question_count <> target_question_count",
    );
  });

  it("keeps the submission RPC server-only", () => {
    expect(submissionVersionMigration).toContain(
      "revoke all on function public.create_submission_with_answers(text, text, jsonb) from anon;",
    );
    expect(submissionVersionMigration).toContain(
      "revoke all on function public.create_submission_with_answers(text, text, jsonb) from authenticated;",
    );
    expect(submissionVersionMigration).toContain(
      "grant execute on function public.create_submission_with_answers(text, text, jsonb) to service_role;",
    );
  });
});
