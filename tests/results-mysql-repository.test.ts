import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPrivateToken } from "@/lib/crypto/private-token";

type ExecuteCall = {
  query: string;
  values: unknown[];
};

type PoolMock = {
  execute: (query: string, values?: unknown[]) => Promise<unknown[]>;
  calls: ExecuteCall[];
};

let currentPool: PoolMock;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      currentPool.execute(query, values),
    ),
  },
}));

const {
  getAggregatedResults,
  getAggregatedResultsForOwner,
  getAggregatedResultsForQuestionnaireVersion,
  ResultsAccessError,
} = await import("@/lib/repositories/results");

const tokenSecret = "test-results-token-secret";
const validToken = "a".repeat(43);
const validTokenHash = hashPrivateToken(validToken, tokenSecret);
let adminMinimumSubmissions: number;

const repositorySource = readFileSync(
  join(process.cwd(), "lib/repositories/results.ts"),
  "utf8",
);
const resultsRouteSource = readFileSync(
  join(process.cwd(), "app/api/results/route.ts"),
  "utf8",
);
const pdfRouteSource = readFileSync(
  join(process.cwd(), "app/api/reports/pdf/route.ts"),
  "utf8",
);
const adminPdfRouteSource = readFileSync(
  join(process.cwd(), "app/api/admin/results/pdf/route.ts"),
  "utf8",
);

describe("MySQL aggregated results repository", () => {
  beforeEach(() => {
    process.env.PRIVATE_TOKEN_HMAC_SECRET = tokenSecret;
    adminMinimumSubmissions = 3;
    currentPool = createPoolMock();
  });

  it("validates a shared token and returns aggregated results from counts", async () => {
    const results = await getAggregatedResults({
      publicCode: "C-ABCD-EFGH",
      privateToken: validToken,
    });

    expect(results.publicCode).toBe("C-ABCD-EFGH");
    expect(results.questionnaireVersion).toBe("2026.2");
    expect(results.totalSubmissions).toBe(2);
    expect(results.globalAverage).toBe(50);
    expect(results.blocks[0].questions[0].distribution).toEqual([
      { value: 0, label: "Gens / No ho faig", count: 0, percentage: 0 },
      { value: 1, label: "Una mica / Ocasionalment", count: 1, percentage: 50 },
      { value: 2, label: "Bastant / Habitualment", count: 0, percentage: 0 },
      { value: 3, label: "Molt / Soc un referent al centre", count: 1, percentage: 50 },
    ]);

    const serialized = JSON.stringify(results);
    expect(serialized).not.toContain("submission-");
    expect(serialized).not.toContain("diagnostic_space_id");
    expect(serialized).not.toContain(validToken);
    expect(serialized).not.toContain(validTokenHash);
  });

  it("rejects an invalid shared token before loading result aggregates", async () => {
    await expect(
      getAggregatedResults({
        publicCode: "C-ABCD-EFGH",
        privateToken: `${validToken}x`,
      }),
    ).rejects.toBeInstanceOf(ResultsAccessError);

    expect(currentPool.calls.some((call) => call.query.includes("from answers"))).toBe(
      false,
    );
  });

  it("allows owner results when the owner id matches the diagnostic space", async () => {
    const results = await getAggregatedResultsForOwner({
      publicCode: "C-ABCD-EFGH",
      ownerUserId: "owner-user-id",
    });

    expect(results.publicCode).toBe("C-ABCD-EFGH");
    expect(results.totalSubmissions).toBe(2);
  });

  it("returns global admin aggregates for a questionnaire version without space rows", async () => {
    const results = await getAggregatedResultsForQuestionnaireVersion("002");

    expect(results.publicCode).toBe("GLOBAL");
    expect(results.scopeLabel).toBe("Enquestes amb més de 3 respostes");
    expect(results.questionnaireVersion).toBe("2026.2");
    expect(results.diagnosticSpaceCount).toBe(4);
    expect(results.totalSubmissions).toBe(2);

    const answerCountCall = currentPool.calls.find((call) =>
      call.query.includes("from answers"),
    );

    expect(answerCountCall?.query).toContain("group by answers.question_id");
    expect(answerCountCall?.query).not.toContain("answers.submission_id,");
    expect(answerCountCall?.query).not.toContain("submissions.id,");
    expect(answerCountCall?.query).toContain("eligible_spaces");
    expect(answerCountCall?.query).toContain("having count(space_submissions.id) > ?");
    expect(answerCountCall?.values).toEqual(["002", 3, "002"]);
  });

  it("counts only diagnostic spaces above the configured admin threshold", async () => {
    adminMinimumSubmissions = 5;

    await getAggregatedResultsForQuestionnaireVersion("002");

    const spaceCountCall = currentPool.calls.find((call) =>
      call.query.includes("count(*) as diagnostic_space_count"),
    );
    const submissionCountCall = currentPool.calls.find((call) =>
      call.query.includes("count(*) as submission_count") &&
      call.query.includes("eligible_spaces"),
    );

    expect(spaceCountCall?.query).toContain("having count(submissions.id) > ?");
    expect(spaceCountCall?.values).toEqual(["002", 5]);
    expect(submissionCountCall?.values).toEqual(["002", 5, "002"]);
  });

  it("uses only aggregated answer counts from MySQL", () => {
    const answerCountQuery = repositorySource.slice(
      repositorySource.indexOf("select\n          answers.question_id"),
      repositorySource.indexOf("group by answers.question_id"),
    );

    expect(answerCountQuery).toContain("answers.question_id");
    expect(answerCountQuery).toContain("answers.value");
    expect(answerCountQuery).toContain("count(*) as answer_count");
    expect(answerCountQuery).not.toContain("submissions.id,");
    expect(answerCountQuery).not.toContain("answers.submission_id,");
    expect(answerCountQuery).not.toContain("created_at");
  });

  it("keeps result and PDF endpoints on POST body tokens, not query params", () => {
    expect(resultsRouteSource).toContain("privateResultsRequestSchema.parse");
    expect(resultsRouteSource).toContain("readJsonRequestBody");
    expect(resultsRouteSource).not.toMatch(/searchParams|nextUrl|request\.url/);

    expect(pdfRouteSource).toContain("privateResultsRequestSchema.parse");
    expect(pdfRouteSource).toContain("readJsonRequestBody");
    expect(pdfRouteSource).not.toMatch(/searchParams|nextUrl|request\.url/);

    expect(adminPdfRouteSource).toContain("adminResultsRequestSchema.parse");
    expect(adminPdfRouteSource).toContain("readJsonRequestBody");
    expect(adminPdfRouteSource).not.toMatch(/searchParams|nextUrl|request\.url/);
  });

  it("removes the Supabase results RPC dependency", () => {
    expect(repositorySource).not.toContain("createSupabaseAdminClient");
    expect(repositorySource).not.toContain("get_diagnostic_answer_counts");
    expect(repositorySource).not.toContain(".rpc(");
  });
});

function createPoolMock(): PoolMock {
  const calls: ExecuteCall[] = [];

  const pool: PoolMock = {
    calls,
    execute: vi.fn(async (query: string, values: unknown[] = []) => {
      const normalizedQuery = query.toLowerCase();
      calls.push({ query: normalizedQuery, values });

      if (normalizedQuery.includes("from app_settings")) {
        return [[{ setting_value: String(adminMinimumSubmissions) }]];
      }

      if (normalizedQuery.includes("count(*) as diagnostic_space_count")) {
        return [[{ diagnostic_space_count: 4 }]];
      }

      if (normalizedQuery.includes("from answers")) {
        return [
          [
            { question_id: "question-1", value: 1, answer_count: 1 },
            { question_id: "question-1", value: 3, answer_count: 1 },
            { question_id: "question-2", value: 0, answer_count: 1 },
            { question_id: "question-2", value: 2, answer_count: 1 },
          ],
        ];
      }

      if (normalizedQuery.includes("count(*) as submission_count")) {
        return [[{ submission_count: 2 }]];
      }

      if (normalizedQuery.includes("from diagnostic_spaces")) {
        return [
          [
            {
              id: "11111111-1111-4111-8111-111111111111",
              public_code: "C-ABCD-EFGH",
              results_token_hash: validTokenHash,
              results_token_enabled: 1,
              results_token_expires_at: null,
              is_active: 1,
              questionnaire_id: "002",
              questionnaire_version: "2026.2",
            },
          ],
        ];
      }

      if (normalizedQuery.includes("from questionnaires")) {
        return [
          [
            {
              id: "002",
              version: "2026.2",
            },
          ],
        ];
      }

      if (normalizedQuery.includes("from question_blocks")) {
        return [
          [
            { id: "01", position: 1, title: "Bloc 1" },
            { id: "02", position: 2, title: "Bloc 2" },
          ],
        ];
      }

      if (normalizedQuery.includes("from questions")) {
        return [
          [
            {
              id: "question-1",
              block_id: "01",
              position: 1,
              block_position: 1,
              text: "Pregunta 1",
            },
            {
              id: "question-2",
              block_id: "02",
              position: 2,
              block_position: 1,
              text: "Pregunta 2",
            },
          ],
        ];
      }

      throw new Error(`Unexpected query: ${query}`);
    }),
  };

  return pool;
}
