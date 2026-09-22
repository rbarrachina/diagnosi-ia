import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("participant access privacy", () => {
  it("does not query code existence or centre policy before Google OAuth", () => {
    const source = readFileSync(join(process.cwd(), "app/auth/login/route.ts"), "utf8");
    expect(source).not.toContain("getCentreEmailPolicyForPublicCode");
    expect(source).not.toContain("loadPublicQuestionnaire");
    expect(source).toContain("OAuthStateCookiePayload");
  });

  it("uses a generic participant callback error", () => {
    const source = readFileSync(join(process.cwd(), "app/auth/callback/route.ts"), "utf8");
    expect(source).toContain("participant-access");
    expect(source).toContain("canAttemptParticipantCode");
  });

  it("blocks every participant surface while the service is closed", () => {
    const paths = [
      "app/auth/login/route.ts",
      "app/auth/callback/route.ts",
      "app/q/[publicCode]/page.tsx",
      "app/docent/page.tsx",
      "app/docent/resultats/[publicCode]/page.tsx",
      "app/api/submissions/route.ts",
      "app/api/docent/results/pdf/route.ts",
    ];

    for (const path of paths) {
      const source = readFileSync(join(process.cwd(), path), "utf8");
      expect(source, path).toContain("getResponsiblePortalStatus");
    }
  });

  it("redirects a returning participant and keeps closed results readable", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app/q/[publicCode]/page.tsx"),
      "utf8",
    );
    const repositorySource = readFileSync(
      join(process.cwd(), "lib/repositories/participant-results.ts"),
      "utf8",
    );
    expect(pageSource).toContain("redirect(`/docent/resultats/${publicCode}`)");
    expect(repositorySource).not.toContain("diagnostic_spaces.is_active");
  });

  it("requires session ownership for the individual PDF", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/docent/results/pdf/route.ts"),
      "utf8",
    );
    expect(source).toContain("getCurrentAuthenticatedUser");
    expect(source).toContain("participantUserId: user.id");
    expect(source).not.toMatch(/participantUserId\s*=\s*formData|submissionId\s*=\s*formData/);
    expect(source).toContain('"Cache-Control": "private, no-store, max-age=0"');
  });

  it("continues rejecting new submissions in inactive spaces", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/repositories/submissions.ts"),
      "utf8",
    );
    expect(source).toContain("diagnostic_spaces.is_active = true");
  });

  it("documents and performs the controlled test-data purge migration", () => {
    const migration = readFileSync(
      join(process.cwd(), "drizzle/0014_participant_results.sql"),
      "utf8",
    );
    expect(migration).toContain("START TRANSACTION");
    expect(migration).toContain("DELETE FROM `answers`");
    expect(migration).toContain("DELETE FROM `submissions`");
    expect(migration).toContain("DELETE FROM `submission_locks`");
    expect(migration).toContain("CREATE TABLE `participant_submissions`");
    expect(migration).not.toMatch(/delete from `?(centres|questionnaires|diagnostic_spaces|admin_users|app_settings)`?/i);
  });
});
