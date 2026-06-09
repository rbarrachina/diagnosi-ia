import { readFileSync } from "node:fs";
import { join } from "node:path";

const conversionMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260604154605_convert_questionnaire_ids_to_three_digit_codes.sql",
  ),
  "utf8",
);

const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8");

const blockIdMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260604155650_convert_block_ids_to_two_digit_codes.sql",
  ),
  "utf8",
);

const blockIdDefaultCleanupMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260609093301_drop_question_blocks_id_default.sql",
  ),
  "utf8",
);

const answersPrimaryKeyMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260609095253_use_composite_primary_key_for_answers.sql",
  ),
  "utf8",
);

const authOwnershipMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260609143524_add_auth_ownership_and_results_tokens.sql",
  ),
  "utf8",
);

const singleOwnerSpaceMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260609162000_add_single_owner_space_reset_rpc.sql",
  ),
  "utf8",
);

describe("questionnaire identifiers", () => {
  it("converts questionnaire ids and related foreign keys to three-digit text codes", () => {
    expect(conversionMigration).toContain("lpad(row_number()");
    expect(conversionMigration).toContain("add constraint questionnaires_id_format_check");
    expect(conversionMigration).toContain("id ~ '^[0-9]{3}$'");
    expect(conversionMigration).toContain("alter column questionnaire_id type text");
    expect(conversionMigration).toContain("target_questionnaire_id text");
  });

  it("seeds the active questionnaire as a three-digit code", () => {
    expect(seed).toContain("'002'");
    expect(seed).toContain("target_questionnaire_id text");
    expect(seed).not.toContain("11111111-1111-4111-8111-111111111111");
  });

  it("converts block ids and question block references to two-digit text codes", () => {
    expect(blockIdMigration).toContain("partition by questionnaire_id");
    expect(blockIdMigration).toContain("id ~ '^[0-9]{2}$'");
    expect(blockIdMigration).toContain("alter column block_id type text");
    expect(blockIdMigration).toContain("primary key (id, questionnaire_id)");
    expect(blockIdMigration).toContain("unique (questionnaire_id, block_id, block_position)");
    expect(seed).toContain("('01', 1, 'Alfabetització i ús crític de la IA')");
    expect(seed).not.toContain("22222222-2222-4222-8222-222222222201");
  });

  it("removes the obsolete UUID default from text block ids", () => {
    expect(blockIdDefaultCleanupMigration).toContain(
      "alter column id drop default",
    );
  });

  it("uses the natural submission/question key for answers", () => {
    expect(answersPrimaryKeyMigration).toContain(
      "add constraint answers_pkey primary key (submission_id, question_id)",
    );
    expect(answersPrimaryKeyMigration).toContain("drop column id");
  });

  it("adds authenticated ownership and recoverable encrypted result tokens", () => {
    expect(authOwnershipMigration).toContain("owner_user_id uuid references auth.users(id)");
    expect(authOwnershipMigration).toContain("results_token_hash text");
    expect(authOwnershipMigration).toContain("results_token_encrypted text");
    expect(authOwnershipMigration).toContain("results_token_enabled boolean");
    expect(authOwnershipMigration).toContain(
      "set results_token_hash = private_token_hmac",
    );
  });

  it("limits authenticated creators to one diagnostic space", () => {
    expect(singleOwnerSpaceMigration).toContain(
      "create unique index diagnostic_spaces_owner_user_id_unique_idx",
    );
    expect(singleOwnerSpaceMigration).toContain("where owner_user_id is not null");
  });
});
