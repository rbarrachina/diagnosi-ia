import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611190000_add_admin_service_rpcs.sql",
  ),
  "utf8",
);
const privateSchemaGrantMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611203000_grant_private_schema_usage_to_service_role.sql",
  ),
  "utf8",
);
const partialDraftMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611213000_allow_partial_questionnaire_drafts.sql",
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
const lockAfterSpaceMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260611223000_lock_questionnaire_after_space_assignment.sql",
  ),
  "utf8",
);
const confirmedEditsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612082000_allow_confirmed_questionnaire_edits.sql",
  ),
  "utf8",
);
const activeStructureLockMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612090000_lock_active_questionnaire_structure.sql",
  ),
  "utf8",
);
const uniqueTitlesMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612091000_enforce_unique_questionnaire_titles.sql",
  ),
  "utf8",
);
const deleteQuestionnaireMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612093000_prevent_active_questionnaire_deletion.sql",
  ),
  "utf8",
);
const expandedScaleMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260616121000_expand_answer_scale_to_four_options.sql",
  ),
  "utf8",
);

describe("admin service RPC migration", () => {
  it("bootstraps the first admin atomically and server-side only", () => {
    expect(migration).toContain("create or replace function public.bootstrap_first_admin");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("if exists (select 1 from public.admin_users)");
    expect(migration).toContain("insert into public.admin_users");
    expect(migration).toContain(
      "grant execute on function public.bootstrap_first_admin(uuid) to service_role;",
    );
    expect(migration).toContain(
      "revoke all on function public.bootstrap_first_admin(uuid) from authenticated;",
    );
  });

  it("creates and copies questionnaire versions with generated three-digit ids", () => {
    expect(migration).toContain("private.next_questionnaire_id()");
    expect(migration).toContain("lpad((coalesce(max(id::integer), 0) + 1)::text, 3, '0')");
    expect(migration).toContain("create_questionnaire_draft");
    expect(migration).toContain("copy_questionnaire_version");
    expect(migration).toContain("insert into public.question_blocks");
    expect(migration).toContain("insert into public.questions");
  });

  it("replaces questionnaire content only before submissions exist", () => {
    expect(migration).toContain("replace_questionnaire_content");
    expect(migration).toContain("private.questionnaire_submission_count(p_questionnaire_id) <> 0");
    expect(migration).toContain("Questionnaire content cannot be changed after submissions exist");
    expect(migration).toContain("delete from public.questions");
    expect(migration).toContain("delete from public.question_blocks");
    expect(migration).toContain("jsonb_array_length(p_blocks) > 5");
  });

  it("adds an incremental migration for partial questionnaire drafts", () => {
    expect(partialDraftMigration).toContain(
      "create or replace function public.replace_questionnaire_content",
    );
    expect(partialDraftMigration).toContain("jsonb_array_length(p_blocks) > 5");
    expect(partialDraftMigration).toContain("jsonb_array_length(parsed_blocks.questions) > 4");
    expect(partialDraftMigration).toContain("Activation still requires exactly 5 blocks");
    expect(partialDraftMigration).not.toContain("jsonb_array_length(p_blocks) <> 5");
  });

  it("adds an incremental migration for 10 by 10 questionnaire drafts", () => {
    expect(expandedLimitsMigration).toContain("check (position between 1 and 10)");
    expect(expandedLimitsMigration).toContain("check (position between 1 and 100)");
    expect(expandedLimitsMigration).toContain("check (block_position between 1 and 10)");
    expect(expandedLimitsMigration).toContain("jsonb_array_length(p_blocks) > 10");
    expect(expandedLimitsMigration).toContain("jsonb_array_length(parsed_blocks.questions) > 10");
    expect(expandedLimitsMigration).toContain(
      "((parsed_questions.block_position - 1) * 10) + parsed_questions.question_block_position",
    );
  });

  it("locks questionnaire edits after the version is assigned to a diagnostic space", () => {
    expect(lockAfterSpaceMigration).toContain("private.questionnaire_space_count");
    expect(lockAfterSpaceMigration).toContain("from public.diagnostic_spaces");
    expect(lockAfterSpaceMigration).toContain("diagnostic_spaces.questionnaire_id = p_questionnaire_id");
    expect(lockAfterSpaceMigration).toContain(
      "Questionnaire content cannot be changed after diagnostic spaces exist",
    );
    expect(lockAfterSpaceMigration).not.toContain(
      "private.questionnaire_submission_count(p_questionnaire_id) <> 0",
    );
  });

  it("allows assigned questionnaire edits only after explicit confirmation", () => {
    expect(confirmedEditsMigration).toContain("p_confirm_assigned_edit boolean");
    expect(confirmedEditsMigration).toContain(
      "Confirmed edit is required for questionnaires assigned to spaces",
    );
    expect(confirmedEditsMigration).toContain(
      "Questionnaire structure cannot be changed after responses exist",
    );
    expect(confirmedEditsMigration).toContain(
      "grant execute on function public.replace_questionnaire_content(text, text, jsonb, boolean) to service_role;",
    );
    expect(confirmedEditsMigration).toContain(
      "from public.replace_questionnaire_content(",
    );
  });

  it("keeps active questionnaire edits limited to text and title corrections", () => {
    expect(activeStructureLockMigration).toContain("is_active_questionnaire");
    expect(activeStructureLockMigration).toContain(
      "not is_active_questionnaire and existing_response_count = 0",
    );
    expect(activeStructureLockMigration).toContain(
      "Questionnaire structure cannot be changed after responses or activation",
    );
    expect(activeStructureLockMigration).toContain(
      "replace_questionnaire_content_without_active_text_lock",
    );
    expect(activeStructureLockMigration).toContain("update public.questionnaires");
    expect(activeStructureLockMigration).toContain("update public.question_blocks");
    expect(activeStructureLockMigration).toContain("update public.questions");
  });

  it("enforces unique questionnaire titles for admin creation", () => {
    expect(uniqueTitlesMigration).toContain(
      "create unique index if not exists questionnaires_title_unique_idx",
    );
    expect(uniqueTitlesMigration).toContain("lower(btrim(title))");
  });

  it("deletes a questionnaire version and dependent anonymous data server-side only", () => {
    expect(deleteQuestionnaireMigration).toContain(
      "create or replace function public.delete_questionnaire_version",
    );
    expect(deleteQuestionnaireMigration).toContain(
      "Active questionnaire versions cannot be deleted",
    );
    expect(deleteQuestionnaireMigration).toContain("delete from public.answers");
    expect(deleteQuestionnaireMigration).toContain("delete from public.submissions");
    expect(deleteQuestionnaireMigration).toContain("delete from public.diagnostic_spaces");
    expect(deleteQuestionnaireMigration).toContain("delete from public.questions");
    expect(deleteQuestionnaireMigration).toContain("delete from public.question_blocks");
    expect(deleteQuestionnaireMigration).toContain("delete from public.questionnaires");
    expect(deleteQuestionnaireMigration).toContain(
      "revoke all on function public.delete_questionnaire_version(text) from anon;",
    );
    expect(deleteQuestionnaireMigration).toContain(
      "revoke all on function public.delete_questionnaire_version(text) from authenticated;",
    );
    expect(deleteQuestionnaireMigration).toContain(
      "grant execute on function public.delete_questionnaire_version(text) to service_role;",
    );
  });

  it("activates only non-empty versions and does not touch diagnostic spaces", () => {
    expect(expandedScaleMigration).toContain("activate_questionnaire_version");
    expect(expandedScaleMigration).toContain("block_count < 1");
    expect(expandedScaleMigration).toContain("block_count > 10");
    expect(expandedScaleMigration).toContain("question_count > 100");
    expect(expandedScaleMigration).toContain("questions.scale_max = 3");
    expect(expandedScaleMigration).toContain("set is_active = false");
    expect(expandedScaleMigration).toContain("set is_active = true");
    expect(expandedScaleMigration).not.toContain("update public.diagnostic_spaces");
  });

  it("keeps all admin mutation RPCs away from browser roles", () => {
    const rpcNames = [
      "create_questionnaire_draft(text, text)",
      "copy_questionnaire_version(text, text, text)",
      "replace_questionnaire_content(text, text, jsonb)",
      "replace_questionnaire_content(text, text, jsonb, boolean)",
      "activate_questionnaire_version(text)",
      "delete_questionnaire_version(text)",
    ];

    for (const rpcName of rpcNames) {
      const source =
        rpcName === "replace_questionnaire_content(text, text, jsonb, boolean)"
          ? activeStructureLockMigration
          : rpcName === "delete_questionnaire_version(text)"
            ? deleteQuestionnaireMigration
          : migration;

      expect(source).toContain(`revoke all on function public.${rpcName} from anon;`);
      expect(source).toContain(
        `revoke all on function public.${rpcName} from authenticated;`,
      );
      expect(source).toContain(
        `grant execute on function public.${rpcName} to service_role;`,
      );
    }
  });

  it("allows server-side admin RPCs to call private helper functions", () => {
    expect(privateSchemaGrantMigration).toContain(
      "grant usage on schema private to service_role;",
    );
    expect(privateSchemaGrantMigration).toContain(
      "grant execute on all functions in schema private to service_role;",
    );
    expect(privateSchemaGrantMigration).not.toMatch(/grant .* on schema private to anon/i);
    expect(privateSchemaGrantMigration).not.toMatch(
      /grant .* on schema private to authenticated/i,
    );
  });
});
