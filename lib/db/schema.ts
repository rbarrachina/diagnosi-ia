import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  datetime,
  foreignKey,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const uuid = (name: string) => char(name, { length: 36 });
const questionnaireId = (name: string) => char(name, { length: 3 });
const blockId = (name: string) => char(name, { length: 2 });
const createdAt = (name = "created_at") =>
  datetime(name, { mode: "string", fsp: 3 }).notNull().default(sql`(CURRENT_TIMESTAMP(3))`);

export const questionnaires = mysqlTable(
  "questionnaires",
  {
    id: questionnaireId("id").notNull().primaryKey(),
    version: varchar("version", { length: 20 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    estimatedMinutes: int("estimated_minutes").notNull().default(10),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("questionnaires_version_key").on(table.version),
    uniqueIndex("questionnaires_title_unique_idx").on(sql`(lower(trim(${table.title})))`),
    check("questionnaires_id_format_check", sql`${table.id} regexp '^[0-9]{3}$'`),
    check(
      "questionnaires_version_format_check",
      sql`${table.version} regexp '^[0-9]{4}[[:alnum:] ._-]*$'`,
    ),
    check("questionnaires_title_not_blank_check", sql`trim(${table.title}) <> ''`),
    check(
      "questionnaires_estimated_minutes_check",
      sql`${table.estimatedMinutes} between 1 and 120`,
    ),
  ],
);

export const questionBlocks = mysqlTable(
  "question_blocks",
  {
    id: blockId("id").notNull(),
    questionnaireId: questionnaireId("questionnaire_id").notNull(),
    position: int("position").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "question_blocks_pkey",
      columns: [table.id, table.questionnaireId],
    }),
    uniqueIndex("question_blocks_questionnaire_position_key").on(
      table.questionnaireId,
      table.position,
    ),
    index("question_blocks_questionnaire_id_idx").on(table.questionnaireId),
    foreignKey({
      name: "question_blocks_questionnaire_id_fkey",
      columns: [table.questionnaireId],
      foreignColumns: [questionnaires.id],
    }).onDelete("restrict"),
    check("question_blocks_id_format_check", sql`${table.id} regexp '^[0-9]{2}$'`),
    check("question_blocks_position_check", sql`${table.position} between 1 and 10`),
    check("question_blocks_title_not_blank_check", sql`trim(${table.title}) <> ''`),
  ],
);

export const questions = mysqlTable(
  "questions",
  {
    id: uuid("id").notNull().primaryKey(),
    questionnaireId: questionnaireId("questionnaire_id").notNull(),
    blockId: blockId("block_id").notNull(),
    position: int("position").notNull(),
    blockPosition: int("block_position").notNull(),
    text: text("text").notNull(),
    scaleMin: tinyint("scale_min").notNull().default(0),
    scaleMax: tinyint("scale_max").notNull().default(3),
  },
  (table) => [
    uniqueIndex("questions_id_questionnaire_unique").on(table.id, table.questionnaireId),
    uniqueIndex("questions_questionnaire_position_key").on(
      table.questionnaireId,
      table.position,
    ),
    uniqueIndex("questions_block_position_key").on(
      table.questionnaireId,
      table.blockId,
      table.blockPosition,
    ),
    index("questions_questionnaire_id_idx").on(table.questionnaireId),
    index("questions_block_id_idx").on(table.blockId),
    foreignKey({
      name: "questions_questionnaire_id_fkey",
      columns: [table.questionnaireId],
      foreignColumns: [questionnaires.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "questions_block_questionnaire_fk",
      columns: [table.blockId, table.questionnaireId],
      foreignColumns: [questionBlocks.id, questionBlocks.questionnaireId],
    }).onDelete("restrict"),
    check("questions_position_check", sql`${table.position} between 1 and 100`),
    check("questions_block_position_check", sql`${table.blockPosition} between 1 and 10`),
    check("questions_text_not_blank_check", sql`trim(${table.text}) <> ''`),
    check("questions_scale_min_check", sql`${table.scaleMin} = 0`),
    check("questions_scale_max_check", sql`${table.scaleMax} = 3`),
  ],
);

export const diagnosticSpaces = mysqlTable(
  "diagnostic_spaces",
  {
    id: uuid("id").notNull().primaryKey(),
    publicCode: varchar("public_code", { length: 20 }).notNull(),
    privateTokenHmac: varchar("private_token_hmac", { length: 128 }).notNull(),
    ownerUserId: varchar("owner_user_id", { length: 191 }),
    resultsTokenHash: varchar("results_token_hash", { length: 128 }).notNull(),
    resultsTokenEncrypted: text("results_token_encrypted"),
    resultsTokenEnabled: boolean("results_token_enabled").notNull().default(true),
    resultsTokenCreatedAt: createdAt("results_token_created_at"),
    resultsTokenExpiresAt: datetime("results_token_expires_at", {
      mode: "string",
      fsp: 3,
    }),
    questionnaireId: questionnaireId("questionnaire_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    closedAt: datetime("closed_at", { mode: "string", fsp: 3 }),
  },
  (table) => [
    uniqueIndex("diagnostic_spaces_public_code_key").on(table.publicCode),
    uniqueIndex("diagnostic_spaces_id_questionnaire_unique").on(table.id, table.questionnaireId),
    uniqueIndex("diagnostic_spaces_owner_user_id_unique_idx").on(table.ownerUserId),
    index("diagnostic_spaces_questionnaire_id_idx").on(table.questionnaireId),
    index("diagnostic_spaces_owner_public_code_idx").on(table.ownerUserId, table.publicCode),
    foreignKey({
      name: "diagnostic_spaces_questionnaire_id_fkey",
      columns: [table.questionnaireId],
      foreignColumns: [questionnaires.id],
    }).onDelete("restrict"),
    check(
      "diagnostic_spaces_public_code_format_check",
      sql`${table.publicCode} regexp '^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$'`,
    ),
    check(
      "diagnostic_spaces_private_token_hmac_length_check",
      sql`char_length(${table.privateTokenHmac}) >= 43`,
    ),
    check(
      "diagnostic_spaces_results_token_hash_length_check",
      sql`char_length(${table.resultsTokenHash}) >= 43`,
    ),
    check(
      "diagnostic_spaces_results_token_encrypted_not_blank_check",
      sql`${table.resultsTokenEncrypted} is null or trim(${table.resultsTokenEncrypted}) <> ''`,
    ),
    check(
      "diagnostic_spaces_results_token_expires_at_check",
      sql`${table.resultsTokenExpiresAt} is null or ${table.resultsTokenExpiresAt} >= ${table.resultsTokenCreatedAt}`,
    ),
    check(
      "diagnostic_spaces_closed_at_check",
      sql`${table.closedAt} is null or ${table.closedAt} >= ${table.createdAt}`,
    ),
  ],
);

export const submissions = mysqlTable(
  "submissions",
  {
    id: uuid("id").notNull().primaryKey(),
    diagnosticSpaceId: uuid("diagnostic_space_id").notNull(),
    questionnaireId: questionnaireId("questionnaire_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("submissions_id_questionnaire_unique").on(table.id, table.questionnaireId),
    index("submissions_diagnostic_space_id_idx").on(table.diagnosticSpaceId),
    index("submissions_questionnaire_id_idx").on(table.questionnaireId),
    foreignKey({
      name: "submissions_space_questionnaire_fk",
      columns: [table.diagnosticSpaceId, table.questionnaireId],
      foreignColumns: [diagnosticSpaces.id, diagnosticSpaces.questionnaireId],
    }).onDelete("restrict"),
  ],
);

export const submissionLocks = mysqlTable(
  "submission_locks",
  {
    diagnosticSpaceId: uuid("diagnostic_space_id").notNull(),
    publicCode: varchar("public_code", { length: 20 }).notNull(),
    lockHmac: varchar("lock_hmac", { length: 128 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({
      name: "submission_locks_pkey",
      columns: [table.diagnosticSpaceId, table.lockHmac],
    }),
    index("submission_locks_diagnostic_space_id_idx").on(table.diagnosticSpaceId),
    foreignKey({
      name: "submission_locks_diagnostic_space_id_fkey",
      columns: [table.diagnosticSpaceId],
      foreignColumns: [diagnosticSpaces.id],
    }).onDelete("cascade"),
    check(
      "submission_locks_public_code_format_check",
      sql`${table.publicCode} regexp '^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$'`,
    ),
    check(
      "submission_locks_lock_hmac_length_check",
      sql`char_length(${table.lockHmac}) >= 43`,
    ),
  ],
);

export const answers = mysqlTable(
  "answers",
  {
    submissionId: uuid("submission_id").notNull(),
    questionnaireId: questionnaireId("questionnaire_id").notNull(),
    questionId: uuid("question_id").notNull(),
    value: tinyint("value").notNull(),
  },
  (table) => [
    primaryKey({
      name: "answers_pkey",
      columns: [table.submissionId, table.questionId],
    }),
    index("answers_submission_id_idx").on(table.submissionId),
    index("answers_question_id_idx").on(table.questionId),
    index("answers_questionnaire_id_idx").on(table.questionnaireId),
    foreignKey({
      name: "answers_submission_questionnaire_fk",
      columns: [table.submissionId, table.questionnaireId],
      foreignColumns: [submissions.id, submissions.questionnaireId],
    }).onDelete("cascade"),
    foreignKey({
      name: "answers_question_questionnaire_fk",
      columns: [table.questionId, table.questionnaireId],
      foreignColumns: [questions.id, questions.questionnaireId],
    }).onDelete("restrict"),
    check("answers_value_check", sql`${table.value} in (0, 1, 2, 3)`),
  ],
);

export const adminUsers = mysqlTable(
  "admin_users",
  {
    userId: varchar("user_id", { length: 191 }).notNull().primaryKey(),
    role: varchar("role", { length: 20 }).notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    createdBy: varchar("created_by", { length: 191 }),
  },
  (table) => [
    index("admin_users_created_by_idx").on(table.createdBy),
    check("admin_users_role_check", sql`${table.role} in ('admin')`),
    check("admin_users_user_id_not_blank_check", sql`trim(${table.userId}) <> ''`),
    check(
      "admin_users_created_by_not_blank_check",
      sql`${table.createdBy} is null or trim(${table.createdBy}) <> ''`,
    ),
  ],
);

export const appSettings = mysqlTable(
  "app_settings",
  {
    settingKey: varchar("setting_key", { length: 64 }).notNull().primaryKey(),
    settingValue: varchar("setting_value", { length: 64 }).notNull(),
    updatedAt: createdAt("updated_at"),
  },
  (table) => [
    check("app_settings_setting_key_not_blank_check", sql`trim(${table.settingKey}) <> ''`),
    check("app_settings_setting_value_not_blank_check", sql`trim(${table.settingValue}) <> ''`),
    check(
      "app_settings_responsible_access_mode_check",
      sql`${table.settingKey} <> 'responsible_access_mode' or ${table.settingValue} in ('all_xtec', 'centre_xtec')`,
    ),
    check(
      "app_settings_admin_results_minimum_submissions_check",
      sql`${table.settingKey} <> 'admin_results_minimum_submissions' or (${table.settingValue} regexp '^[0-9]+$' and cast(${table.settingValue} as unsigned) between 0 and 10)`,
    ),
  ],
);
