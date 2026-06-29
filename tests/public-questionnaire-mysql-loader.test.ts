import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(
  join(process.cwd(), "lib/questionnaire/load-public-questionnaire.ts"),
  "utf8",
);

const repositorySource = readFileSync(
  join(process.cwd(), "lib/repositories/questionnaires.ts"),
  "utf8",
);

describe("public questionnaire MySQL loader", () => {
  it("loads the public questionnaire through the MySQL repository", () => {
    expect(loaderSource).toContain("@/lib/repositories/questionnaires");
    expect(loaderSource).toContain("getDiagnosticSpaceByPublicCode");
    expect(loaderSource).toContain("getQuestionnaireById");
    expect(loaderSource).not.toContain("createSupabaseAdminClient");
    expect(loaderSource).not.toContain(".from(");
    expect(loaderSource).not.toContain(".rpc(");
  });

  it("keeps public diagnostic space reads free of sensitive fields", () => {
    const publicSpaceFunction = repositorySource.slice(
      repositorySource.indexOf("export async function getDiagnosticSpaceByPublicCode"),
    );

    expect(publicSpaceFunction).toContain("diagnosticSpaces.publicCode");
    expect(publicSpaceFunction).toContain("diagnosticSpaces.isActive");
    expect(publicSpaceFunction).toContain("diagnosticSpaces.questionnaireId");
    expect(publicSpaceFunction).toContain("questionnaires.version");
    expect(publicSpaceFunction).not.toMatch(
      /privateTokenHmac|resultsTokenHash|resultsTokenEncrypted|ownerUserId/,
    );
  });

  it("does not make client components import the MySQL client directly", () => {
    expect(repositorySource).toContain('import "server-only"');
    expect(loaderSource).toContain('import "server-only"');
  });
});
