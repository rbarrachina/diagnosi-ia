import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ExecuteCall = {
  query: string;
  values: unknown[];
};

type ConnectionMock = {
  beginTransaction: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
  rollback: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  calls: ExecuteCall[];
  insertedLocks: unknown[][];
  insertedSubmissions: unknown[][];
  insertedAnswers: unknown[][];
};

type ConnectionOptions = {
  questionIds?: string[];
  existingLockCount?: number;
  submissionCount?: number;
  spaceFound?: boolean;
  duplicateLock?: boolean;
  failOnAnswerInsert?: boolean;
};

let currentConnection: ConnectionMock;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) => {
      const execute = currentConnection.execute as unknown as (
        query: string,
        values?: unknown[],
      ) => Promise<unknown>;

      return execute(query, values);
    }),
    getConnection: vi.fn(async () => currentConnection),
  },
}));

const {
  createSubmissionWithAnswers,
  DuplicateSubmissionRepositoryError,
  hasAccountSubmittedToPublicQuestionnaire,
  InvalidSubmissionRepositoryError,
  SubmissionLimitReachedRepositoryError,
} = await import("@/lib/repositories/submissions");

const questionIds = Array.from(
  { length: 20 },
  (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);

const validPayload = {
  publicCode: "C-ABCD-EFGH",
  questionnaireVersion: "2026.2",
  answers: questionIds.map((questionId) => ({
    questionId,
    value: 1 as const,
  })),
};

const serviceSource = readFileSync(
  join(process.cwd(), "lib/submissions/create-submission.ts"),
  "utf8",
);
const repositorySource = readFileSync(
  join(process.cwd(), "lib/repositories/submissions.ts"),
  "utf8",
);

describe("MySQL submission repository", () => {
  beforeEach(() => {
    process.env.SUBMISSION_LOCK_HMAC_SECRET = "submission-lock-secret-with-at-least-32-chars";
    currentConnection = createConnectionMock();
  });

  it("creates a valid submission and all answers in one transaction", async () => {
    await createSubmissionWithAnswers(validPayload, "account-1");

    expect(currentConnection.beginTransaction).toHaveBeenCalledOnce();
    expect(currentConnection.commit).toHaveBeenCalledOnce();
    expect(currentConnection.rollback).not.toHaveBeenCalled();
    expect(currentConnection.release).toHaveBeenCalledOnce();
    expect(currentConnection.insertedLocks).toHaveLength(1);
    expect(currentConnection.insertedSubmissions).toHaveLength(1);
    expect(currentConnection.insertedAnswers).toHaveLength(20);
    expect(currentConnection.insertedLocks[0]).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "C-ABCD-EFGH",
      expect.any(String),
    ]);
    expect(currentConnection.insertedSubmissions[0]).not.toContain("account-1");
    expect(currentConnection.insertedAnswers.flat()).not.toContain("account-1");
  });

  it("checks whether the current account already has a submission lock", async () => {
    currentConnection = createConnectionMock({ existingLockCount: 1 });

    await expect(
      hasAccountSubmittedToPublicQuestionnaire({
        accountId: "account-1",
        publicCode: "C-ABCD-EFGH",
      }),
    ).resolves.toBe(true);

    const [call] = currentConnection.calls;
    expect(call.query).toContain("from submission_locks");
    expect(call.query).toContain("inner join diagnostic_spaces");
    expect(call.query).not.toContain("from submissions");
    expect(call.query).not.toContain("from answers");
    expect(call.values).toEqual(["C-ABCD-EFGH", expect.any(String)]);
    expect(call.values).not.toContain("account-1");
  });

  it("locks the diagnostic space row before writing the one-response lock", async () => {
    await createSubmissionWithAnswers(validPayload, "account-1");

    const spaceLockIndex = currentConnection.calls.findIndex((call) =>
      call.query.includes("for update"),
    );
    const responseLockIndex = currentConnection.calls.findIndex((call) =>
      call.query.includes("insert into submission_locks"),
    );
    const countIndex = currentConnection.calls.findIndex((call) =>
      call.query.includes("from submissions"),
    );

    expect(spaceLockIndex).toBeGreaterThanOrEqual(0);
    expect(responseLockIndex).toBeGreaterThan(spaceLockIndex);
    expect(countIndex).toBeGreaterThan(responseLockIndex);
  });

  it("rejects a second response from the same account before creating a submission", async () => {
    currentConnection = createConnectionMock({ duplicateLock: true });

    await expect(createSubmissionWithAnswers(validPayload, "account-1")).rejects.toBeInstanceOf(
      DuplicateSubmissionRepositoryError,
    );
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.commit).not.toHaveBeenCalled();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
    expect(currentConnection.insertedAnswers).toHaveLength(0);
  });

  it("rejects duplicate answers and rolls back", async () => {
    const duplicatePayload = {
      ...validPayload,
      answers: [
        ...validPayload.answers.slice(0, 19),
        { questionId: validPayload.answers[0].questionId, value: 2 as const },
      ],
    };

    await expect(createSubmissionWithAnswers(duplicatePayload, "account-1")).rejects.toBeInstanceOf(
      InvalidSubmissionRepositoryError,
    );
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.commit).not.toHaveBeenCalled();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
    expect(currentConnection.insertedAnswers).toHaveLength(0);
  });

  it("rejects values outside the valid scale and rolls back", async () => {
    const invalidValuePayload = {
      ...validPayload,
      answers: [
        { questionId: validPayload.answers[0].questionId, value: 4 },
        ...validPayload.answers.slice(1),
      ],
    };

    await expect(
      createSubmissionWithAnswers(invalidValuePayload as typeof validPayload, "account-1"),
    ).rejects.toBeInstanceOf(InvalidSubmissionRepositoryError);
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
  });

  it("rejects questions that do not belong to the assigned questionnaire", async () => {
    const alienQuestionPayload = {
      ...validPayload,
      answers: [
        { questionId: "99999999-9999-4999-8999-999999999999", value: 1 as const },
        ...validPayload.answers.slice(1),
      ],
    };

    await expect(createSubmissionWithAnswers(alienQuestionPayload, "account-1")).rejects.toBeInstanceOf(
      InvalidSubmissionRepositoryError,
    );
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
  });

  it("rejects non-strict answer payloads", async () => {
    const extraFieldPayload = {
      ...validPayload,
      answers: [
        { ...validPayload.answers[0], text: "not allowed" },
        ...validPayload.answers.slice(1),
      ],
    };

    await expect(
      createSubmissionWithAnswers(extraFieldPayload as typeof validPayload, "account-1"),
    ).rejects.toBeInstanceOf(InvalidSubmissionRepositoryError);
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
  });

  it("rolls back when an answer insert fails", async () => {
    currentConnection = createConnectionMock({ failOnAnswerInsert: true });

    await expect(createSubmissionWithAnswers(validPayload, "account-1")).rejects.toThrow(
      "answer insert failed",
    );
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.commit).not.toHaveBeenCalled();
    expect(currentConnection.insertedSubmissions).toHaveLength(1);
  });

  it("rejects submissions when the diagnostic space has reached 300 responses", async () => {
    currentConnection = createConnectionMock({ submissionCount: 300 });

    await expect(createSubmissionWithAnswers(validPayload, "account-1")).rejects.toBeInstanceOf(
      SubmissionLimitReachedRepositoryError,
    );
    expect(currentConnection.rollback).toHaveBeenCalledOnce();
    expect(currentConnection.commit).not.toHaveBeenCalled();
    expect(currentConnection.insertedSubmissions).toHaveLength(0);
  });

  it("removes the Supabase RPC dependency from the public submission service", () => {
    expect(serviceSource).toContain("@/lib/repositories/submissions");
    expect(serviceSource).not.toContain("createSupabaseAdminClient");
    expect(serviceSource).not.toContain("create_submission_with_answers");
    expect(serviceSource).not.toContain(".rpc(");
  });

  it("keeps MySQL submission writes server-side and private", () => {
    expect(repositorySource).toContain('import "server-only"');
    expect(repositorySource).toContain("insert into submission_locks");
    expect(repositorySource).toContain("insert into submissions");
    expect(repositorySource).toContain("insert into answers");
    expect(repositorySource).not.toContain("export type");
  });
});

function createConnectionMock(options: ConnectionOptions = {}): ConnectionMock {
  const calls: ExecuteCall[] = [];
  const insertedLocks: unknown[][] = [];
  const insertedSubmissions: unknown[][] = [];
  const insertedAnswers: unknown[][] = [];
  const activeQuestionIds = options.questionIds ?? questionIds;

  const connection: ConnectionMock = {
    calls,
    insertedLocks,
    insertedSubmissions,
    insertedAnswers,
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(() => undefined),
    execute: vi.fn(async (query: string, values: unknown[] = []) => {
      const normalizedQuery = query.toLowerCase();
      calls.push({ query: normalizedQuery, values });

      if (normalizedQuery.includes("from submission_locks")) {
        return [[{ lock_count: options.existingLockCount ?? 0 }]];
      }

      if (normalizedQuery.includes("from diagnostic_spaces")) {
        if (options.spaceFound === false) {
          return [[]];
        }

        return [
          [
            {
              diagnostic_space_id: "11111111-1111-4111-8111-111111111111",
              questionnaire_id: "002",
            },
          ],
        ];
      }

      if (normalizedQuery.includes("count(*) as submission_count")) {
        return [[{ submission_count: options.submissionCount ?? 0 }]];
      }

      if (normalizedQuery.includes("insert into submission_locks")) {
        if (options.duplicateLock) {
          throw Object.assign(new Error("Duplicate entry for key 'submission_locks_pkey'"), {
            code: "ER_DUP_ENTRY",
            errno: 1062,
            sqlMessage: "Duplicate entry for key 'submission_locks_pkey'",
          });
        }

        insertedLocks.push(values);
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("from questions")) {
        return [
          activeQuestionIds.map((id) => ({
            id,
            scale_min: 0,
            scale_max: 3,
          })),
        ];
      }

      if (normalizedQuery.includes("insert into submissions")) {
        insertedSubmissions.push(values);
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("insert into answers")) {
        if (options.failOnAnswerInsert) {
          throw new Error("answer insert failed");
        }

        const answerRowSize = 4;
        for (let index = 0; index < values.length; index += answerRowSize) {
          insertedAnswers.push(values.slice(index, index + answerRowSize));
        }

        return [{ affectedRows: insertedAnswers.length }];
      }

      throw new Error(`Unexpected query: ${query}`);
    }),
  };

  return connection;
}
