import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260604143000_create_submission_rpc.sql"),
  "utf8",
);

const submissionLimitMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260610140500_limit_submissions_per_space.sql",
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

describe("submission RPC migration", () => {
  it("keeps direct browser roles from executing the insertion RPC", () => {
    expect(migration).toContain(
      "revoke all on function public.create_submission_with_answers(text, text, jsonb) from anon;",
    );
    expect(migration).toContain(
      "revoke all on function public.create_submission_with_answers(text, text, jsonb) from authenticated;",
    );
    expect(migration).toContain(
      "grant execute on function public.create_submission_with_answers(text, text, jsonb) to service_role;",
    );
  });

  it("enforces complete answers for the assigned questionnaire shape in the database", () => {
    expect(expandedLimitsMigration).toContain("target_question_count integer");
    expect(expandedLimitsMigration).toContain("answer_count <> target_question_count");
    expect(expandedLimitsMigration).toContain("answer_key.key not in ('questionId', 'value')");
    expect(expandedLimitsMigration).toContain(
      "(answer_item.answer ->> 'value') not in ('0', '1', '2')",
    );
    expect(expandedLimitsMigration).toContain("duplicate_question_count <> 0");
    expect(expandedLimitsMigration).toContain("matched_question_count <> target_question_count");
  });

  it("limits each diagnostic space to 300 submissions", () => {
    expect(submissionLimitMigration).toContain("current_submission_count >= 300");
    expect(submissionLimitMigration).toContain("for update of diagnostic_spaces");
  });
});
