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

  it("enforces the fixed questionnaire shape in the database", () => {
    expect(migration).toContain("answer_count <> 20");
    expect(migration).toContain("answer_key.key not in ('questionId', 'value')");
    expect(migration).toContain("(answer_item.answer ->> 'value') not in ('0', '1', '2')");
    expect(migration).toContain("duplicate_question_count <> 0");
    expect(migration).toContain("matched_question_count <> 20");
  });

  it("limits each diagnostic space to 300 submissions", () => {
    expect(submissionLimitMigration).toContain("current_submission_count >= 300");
    expect(submissionLimitMigration).toContain("for update of diagnostic_spaces");
  });
});
