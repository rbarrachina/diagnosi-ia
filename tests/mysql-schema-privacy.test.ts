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
  it("does not define centres or participant identity fields", () => {
    expect(schema).not.toMatch(/\bcentres?\b/i);
    expect(schema).not.toMatch(/teacher|participant|email|ip_address|user_agent|device/i);
  });

  it("defines admin users without copied personal fields", () => {
    expect(schema).toContain('"admin_users"');
    expect(schema).toContain("userId");
    expect(schema).not.toMatch(/first_name|last_name|full_name|email/i);
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
