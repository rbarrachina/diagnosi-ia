import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611183000_add_admin_users.sql",
  ),
  "utf8",
);
const migrationDdl = migration
  .replace(/^--.*$/gm, "")
  .replace(/comment on[\s\S]*?;/gi, "");

describe("admin users migration", () => {
  it("creates admin users with only auth ids and admin metadata", () => {
    expect(migration).toContain("create table public.admin_users");
    expect(migration).toContain(
      "user_id uuid primary key references auth.users(id) on delete cascade",
    );
    expect(migration).toContain("role text not null default 'admin'");
    expect(migration).toContain("is_active boolean not null default true");
    expect(migration).toContain("created_at timestamptz not null default now()");
    expect(migration).toContain(
      "created_by uuid references auth.users(id) on delete set null",
    );
    expect(migration).toContain(
      "constraint admin_users_role_check check (role in ('admin'))",
    );
  });

  it("keeps admin authorization server-managed", () => {
    expect(migration).toContain(
      "alter table public.admin_users enable row level security;",
    );
    expect(migration).toContain(
      "alter table public.admin_users force row level security;",
    );
    expect(migration).toContain(
      "revoke all on public.admin_users from anon, authenticated;",
    );
    expect(migration).toContain(
      "grant select, insert, update, delete on public.admin_users to service_role;",
    );
    expect(migration).toContain("No direct client access to admin users");
  });

  it("does not add identifying columns or participant data", () => {
    expect(migrationDdl).not.toMatch(/\bemail\b/);
    expect(migrationDdl).not.toMatch(/\bname\b/);
    expect(migrationDdl).not.toMatch(/\bcentre\b/);
    expect(migrationDdl).not.toMatch(/\bip\b/);
    expect(migrationDdl).not.toMatch(/\buser_agent\b/);
    expect(migrationDdl).not.toMatch(/\bdevice\b/);
  });
});
