import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

type SourceFile = {
  path: string;
  source: string;
};

function readSourceFiles(paths: string[]): SourceFile[] {
  const files: SourceFile[] = [];

  for (const path of paths) {
    const absolutePath = join(process.cwd(), path);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const entries = readdirSync(absolutePath, { recursive: true, withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
        continue;
      }

      const filePath = join(entry.parentPath, entry.name);
      files.push({
        path: relative(process.cwd(), filePath),
        source: readFileSync(filePath, "utf8"),
      });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

const adminSourceFiles = readSourceFiles(["app/admin", "app/api/admin", "lib/admin"]);
const adminSource = adminSourceFiles
  .map((file) => `// ${file.path}\n${file.source}`)
  .join("\n");

describe("admin privacy review", () => {
  it("has admin source files under review", () => {
    expect(adminSourceFiles.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "app/admin/actions.ts",
        "app/admin/page.tsx",
        "lib/admin/questionnaires.ts",
      ]),
    );
  });

  it("does not add admin API endpoints that expose individual response tables", () => {
    const adminApiFiles = adminSourceFiles.filter((file) =>
      file.path.startsWith("app/api/admin/"),
    );

    for (const file of adminApiFiles) {
      expect(file.source).not.toMatch(/\bsubmissions\b/);
      expect(file.source).not.toMatch(/\banswers\b/);
      expect(file.source).not.toMatch(/select\s*\(\s*["'`]\*/);
    }
  });

  it("does not read answers or select submission rows from the admin surface", () => {
    expect(adminSource).not.toMatch(/\.from\s*\(\s*["'`]answers["'`]\s*\)/);
    expect(adminSource).not.toMatch(/\.from\s*\(\s*["'`]submissions["'`]\s*\)/);
    expect(adminSource).not.toMatch(/select\s*\(\s*["'`]\*/);

    const questionnaireService = adminSourceFiles.find(
      (file) => file.path === "lib/admin/questionnaires.ts",
    );

    expect(questionnaireService?.source).toContain(
      "countRows(\"diagnostic_spaces\", row.id)",
    );
    expect(questionnaireService?.source).toContain(
      "countRows(\"submissions\", row.id)",
    );
    expect(questionnaireService?.source).toContain(
      ".select(\"id\", { count: \"exact\", head: true })",
    );
  });

  it("does not introduce centre, person or participant identifiers in admin forms", () => {
    const forbiddenParticipantFields = [
      "centre",
      "center",
      "school",
      "teacher",
      "participant",
      "persona",
      "personName",
      "firstName",
      "lastName",
      "teacherName",
      "participantEmail",
      "ipAddress",
      "userAgent",
      "device",
    ];

    for (const forbiddenField of forbiddenParticipantFields) {
      expect(adminSource).not.toMatch(
        new RegExp(`\\b(?:name|id|htmlFor)=["'\`][^"'\`]*${forbiddenField}`, "i"),
      );
    }
  });

  it("does not log admin payloads, tokens or errors", () => {
    expect(adminSource).not.toMatch(/\bconsole\.(log|debug|info|warn|error)\s*\(/);
    expect(adminSource).not.toMatch(/\b(privateToken|resultsToken|tokenHash)\b/i);
    expect(adminSource).not.toMatch(
      /\b(SUPABASE_SERVICE_ROLE_KEY|PRIVATE_TOKEN_HMAC_SECRET|RESULTS_TOKEN_ENCRYPTION_KEY)\b/,
    );
  });

  it("keeps admin error messages generic", () => {
    const userFacingErrorMessages = [
      ...adminSource.matchAll(/errorMessages[\s\S]*?};/g),
      ...adminSource.matchAll(/new\s+\w*Error\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g),
    ]
      .map((match) => match[0])
      .join("\n");

    expect(userFacingErrorMessages).not.toMatch(/\bsubmissions\.[a-z_]+\b/i);
    expect(userFacingErrorMessages).not.toMatch(/\banswers\.[a-z_]+\b/i);
    expect(userFacingErrorMessages).not.toMatch(/\b(publicCode|privateToken|token)\s*[:=]/i);
    expect(userFacingErrorMessages).not.toMatch(/\b(email|ip|userAgent|device)\s*[:=]/i);
  });
});
