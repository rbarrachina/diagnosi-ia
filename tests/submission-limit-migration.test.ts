import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260610140500_limit_submissions_per_space.sql",
  ),
  "utf8",
);

describe("submission limit migration", () => {
  it("caps each diagnostic space at 300 submissions", () => {
    expect(migration).toContain("current_submission_count >= 300");
    expect(migration).toContain("Diagnostic space submission limit reached");
    expect(migration).toContain("using errcode = '23514'");
  });

  it("locks the diagnostic space row before counting submissions", () => {
    expect(migration).toContain("for update of diagnostic_spaces");
    expect(migration).toContain("from public.submissions");
    expect(migration).toContain("where submissions.diagnostic_space_id = target_space_id");
  });

  it("keeps the submission RPC server-only", () => {
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
});
