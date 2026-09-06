import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const schema = readFileSync(join(process.cwd(), "lib/db/schema.ts"), "utf8");
const mysqlSeed = readFileSync(join(process.cwd(), "scripts/db/seed.mjs"), "utf8");
const mysqlScaleMigration = readFileSync(
  join(process.cwd(), "drizzle/0001_short_onslaught.sql"),
  "utf8",
);

describe("MySQL schema privacy constraints", () => {
  it("keeps centre identity separate from participant identity fields", () => {
    expect(schema).toContain('"centres"');
    expect(schema).toContain('"centre_accounts"');
    expect(schema).toContain("^[^@[:space:]]+@xtec");
    expect(schema).not.toMatch(/teacher|participant|ip_address|user_agent|device/i);
    expect(schema).not.toMatch(/submission.*email|answer.*email/i);
  });

  it("defines admin users with explicit administrator identity fields", () => {
    expect(schema).toContain('"admin_users"');
    expect(schema).toContain("userId");
    expect(schema).toContain("email: varchar(\"email\"");
    expect(schema).toContain("displayName: varchar(\"display_name\"");
    expect(schema).toContain("lastLoginAt: datetime(\"last_login_at\"");
    const adminUsersDefinition = schema.slice(
      schema.indexOf("export const adminUsers"),
      schema.indexOf("export const adminEmailInvitations"),
    );

    expect(adminUsersDefinition).not.toMatch(/first_name|last_name|participant/i);
  });

  it("keeps administrator email invitations separate from admin user ids", () => {
    expect(schema).toContain('"admin_email_invitations"');
    expect(schema).toContain("email: varchar(\"email\"");
    expect(schema).toContain("admin_email_invitations_email_format_check");
  });

  it("keeps centre administration audit metadata free of participant fields", () => {
    const auditDefinition = schema.slice(
      schema.indexOf("export const adminCentreActions"),
      schema.indexOf("export const appSettings"),
    );

    expect(auditDefinition).toContain('"admin_centre_actions"');
    expect(auditDefinition).toContain("affectedSubmissions");
    expect(auditDefinition).not.toMatch(
      /submissionId|answerId|email|participant|ip_address|user_agent|device/i,
    );
  });

  it("stores global app settings without participant or centre identifiers", () => {
    const appSettingsDefinition = schema.slice(schema.indexOf("export const appSettings"));

    expect(schema).toContain('"app_settings"');
    expect(schema).toContain("settingValue: text(\"setting_value\").notNull()");
    expect(appSettingsDefinition).not.toMatch(
      /email|participant|ip_address|user_agent|device/i,
    );
  });

  it("keeps answers keyed by anonymous submission and question", () => {
    expect(schema).toContain('"answers"');
    expect(schema).toContain("columns: [table.submissionId, table.questionId]");
    expect(schema).toContain("answers_value_check");
  });

  it("keeps current and future MySQL questionnaire questions on the 0..3 scale", () => {
    expect(schema).toContain("scaleMax: tinyint(\"scale_max\").notNull().default(3)");
    expect(schema).toContain("questions_scale_max_check");
    expect(schema).toContain("scaleMax} = 3");
    expect(schema).toContain("answers_value_check");
    expect(schema).toContain("value} in (0, 1, 2, 3)");
    expect(mysqlSeed).toContain("values (?, ?, ?, ?, ?, ?, 0, 3)");
    expect(mysqlSeed).not.toContain("values (?, ?, ?, ?, ?, ?, 0, 2)");
    expect(mysqlScaleMigration).toContain("UPDATE `questions` SET `scale_min` = 0, `scale_max` = 3");
    expect(mysqlScaleMigration).toContain("CHECK (`scale_max` = 3)");
    expect(mysqlScaleMigration).toContain("ALTER TABLE `answers` DROP CHECK `answers_value_check`");
    expect(mysqlScaleMigration).toContain(
      "ALTER TABLE `answers` ADD CONSTRAINT `answers_value_check` CHECK (`value` in (0, 1, 2, 3))",
    );
  });
});
