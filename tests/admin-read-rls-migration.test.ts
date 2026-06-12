import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611184500_add_admin_read_rls_policies.sql",
  ),
  "utf8",
);

describe("admin read RLS migration", () => {
  it("adds a security definer helper for active administrators", () => {
    expect(migration).toContain("create or replace function public.current_user_is_admin()");
    expect(migration).toContain("security definer");
    expect(migration).toContain("where admin_users.user_id = auth.uid()");
    expect(migration).toContain("and admin_users.role = 'admin'");
    expect(migration).toContain("and admin_users.is_active = true");
    expect(migration).toContain(
      "grant execute on function public.current_user_is_admin() to authenticated;",
    );
  });

  it("allows authenticated admins to read only questionnaire admin metadata", () => {
    expect(migration).toContain("grant select on public.questionnaires to authenticated;");
    expect(migration).toContain("grant select on public.question_blocks to authenticated;");
    expect(migration).toContain("grant select on public.questions to authenticated;");
    expect(migration).toContain("grant select on public.admin_users to authenticated;");
    expect(migration).toContain("Administrators can read questionnaires");
    expect(migration).toContain("Administrators can read question blocks");
    expect(migration).toContain("Administrators can read questions");
    expect(migration).toContain("Administrators can read admin users");
    expect(migration).toContain("using (public.current_user_is_admin())");
  });

  it("keeps response and space tables server-only", () => {
    expect(migration).toContain(
      "revoke all on public.diagnostic_spaces from anon, authenticated;",
    );
    expect(migration).toContain(
      "revoke all on public.submissions from anon, authenticated;",
    );
    expect(migration).toContain(
      "revoke all on public.answers from anon, authenticated;",
    );
    expect(migration).not.toContain("grant select on public.diagnostic_spaces");
    expect(migration).not.toContain("grant select on public.submissions");
    expect(migration).not.toContain("grant select on public.answers");
  });

  it("does not grant direct questionnaire writes to browser roles", () => {
    expect(migration).not.toMatch(/grant\s+insert/i);
    expect(migration).not.toMatch(/grant\s+update/i);
    expect(migration).not.toMatch(/grant\s+delete/i);
  });
});
