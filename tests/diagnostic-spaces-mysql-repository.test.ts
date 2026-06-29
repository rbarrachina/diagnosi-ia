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
};

type PoolState = {
  calls: ExecuteCall[];
  insertedSpaces: unknown[][];
  updatedTokens: unknown[][];
  resetUpdates: unknown[][];
  connections: ConnectionMock[];
  existingOwnerSpace: boolean;
  insertPublicCodeCollisions: number;
};

let state: PoolState;
let publicCodes: string[];
let tokenIndex: number;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/crypto/public-code", () => ({
  generatePublicCode: vi.fn(() => publicCodes.shift() ?? "C-CCCC-CCCC"),
}));

vi.mock("@/lib/results/results-token", () => ({
  buildOwnerResultsUrl: (appUrl: string, publicCode: string) =>
    `${appUrl}/espais/${publicCode}/resultats`,
  buildSharedResultsUrl: (appUrl: string, publicCode: string, token: string) =>
    `${appUrl}/resultats/compartit/${publicCode}#token=${token}`,
  decryptStoredResultsToken: (encrypted: string | null) =>
    encrypted ? encrypted.replace("encrypted-", "token-") : null,
  generateResultsToken: vi.fn(() => {
    tokenIndex += 1;
    return {
      token: `clear-token-${tokenIndex}`,
      hash: `hash-token-${tokenIndex}`,
      encrypted: `encrypted-token-${tokenIndex}`,
    };
  }),
}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      executePoolQuery(query, values),
    ),
    getConnection: vi.fn(async () => {
      const connection = createConnectionMock();
      state.connections.push(connection);
      return connection;
    }),
  },
}));

const {
  createDiagnosticSpace,
  listOwnerSpaces,
  regenerateOwnerResultsToken,
  resetOwnerDiagnosticSpace,
  OwnerSpaceAlreadyExistsError,
} = await import("@/lib/repositories/diagnostic-spaces");

const repositorySource = readFileSync(
  join(process.cwd(), "lib/repositories/diagnostic-spaces.ts"),
  "utf8",
);
const createSpaceFacadeSource = readFileSync(
  join(process.cwd(), "lib/spaces/create-space.ts"),
  "utf8",
);
const manageSpacesFacadeSource = readFileSync(
  join(process.cwd(), "lib/spaces/manage-spaces.ts"),
  "utf8",
);

describe("MySQL diagnostic spaces repository", () => {
  beforeEach(() => {
    state = {
      calls: [],
      insertedSpaces: [],
      updatedTokens: [],
      resetUpdates: [],
      connections: [],
      existingOwnerSpace: false,
      insertPublicCodeCollisions: 0,
    };
    publicCodes = ["C-AAAA-AAAA", "C-BBBB-BBBB", "C-CCCC-CCCC"];
    tokenIndex = 0;
  });

  it("creates a diagnostic space from the active questionnaire and retries public code collisions", async () => {
    state.insertPublicCodeCollisions = 1;

    const result = await createDiagnosticSpace("http://localhost:3000", "owner-1");

    expect(result.publicCode).toBe("C-BBBB-BBBB");
    expect(result.sharedResultsUrl).toContain("#token=clear-token-1");
    expect(state.insertedSpaces).toHaveLength(1);
    expect(state.insertedSpaces[0]).toContain("hash-token-1");
    expect(state.insertedSpaces[0]).toContain("encrypted-token-1");
    expect(state.insertedSpaces[0]).not.toContain("clear-token-1");
  });

  it("enforces one diagnostic space per owner", async () => {
    state.existingOwnerSpace = true;

    await expect(
      createDiagnosticSpace("http://localhost:3000", "owner-1"),
    ).rejects.toBeInstanceOf(OwnerSpaceAlreadyExistsError);
    expect(state.insertedSpaces).toHaveLength(0);
  });

  it("lists owner spaces without exposing stored token hashes", async () => {
    const spaces = await listOwnerSpaces("owner-1", "http://localhost:3000");

    expect(spaces).toEqual([
      expect.objectContaining({
        publicCode: "C-AAAA-AAAA",
        questionnaireVersion: "2026.2",
        sharedResultsUrl:
          "http://localhost:3000/resultats/compartit/C-AAAA-AAAA#token=token-1",
        totalSubmissions: 3,
      }),
    ]);
    expect(JSON.stringify(spaces)).not.toContain("hash-token");
  });

  it("regenerates the private results link without storing the clear token", async () => {
    const result = await regenerateOwnerResultsToken({
      ownerUserId: "owner-1",
      publicCode: "C-AAAA-AAAA",
      appUrl: "http://localhost:3000",
    });

    expect(result.sharedResultsUrl).toContain("#token=clear-token-1");
    expect(state.updatedTokens).toHaveLength(1);
    expect(state.updatedTokens[0]).toContain("hash-token-1");
    expect(state.updatedTokens[0]).toContain("encrypted-token-1");
    expect(state.updatedTokens[0]).not.toContain("clear-token-1");
  });

  it("resets an owner space in a transaction and removes anonymous responses", async () => {
    const result = await resetOwnerDiagnosticSpace({
      ownerUserId: "owner-1",
      publicCode: "C-AAAA-AAAA",
      appUrl: "http://localhost:3000",
    });
    const [connection] = state.connections;

    expect(result.publicCode).toBe("C-AAAA-AAAA");
    expect(result.totalSubmissions).toBe(0);
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.calls.some((call) => call.query.includes("delete answers"))).toBe(
      true,
    );
    expect(connection.calls.some((call) => call.query.includes("delete from submissions"))).toBe(
      true,
    );
    expect(connection.calls.some((call) => call.query.includes("delete from submission_locks"))).toBe(
      true,
    );
    expect(state.resetUpdates[0]).toContain("hash-token-1");
    expect(state.resetUpdates[0]).toContain("encrypted-token-1");
    expect(state.resetUpdates[0]).not.toContain("clear-token-1");
  });

  it("keeps Supabase out of the migrated space services", () => {
    expect(repositorySource).toContain('import "server-only"');
    expect(repositorySource).not.toContain("createSupabaseAdminClient");
    expect(repositorySource).not.toContain("reset_owner_diagnostic_space");
    expect(repositorySource).not.toContain(".rpc(");
    expect(createSpaceFacadeSource).toContain("@/lib/repositories/diagnostic-spaces");
    expect(manageSpacesFacadeSource).toContain("@/lib/repositories/diagnostic-spaces");
  });
});

async function executePoolQuery(query: string, values: unknown[] = []) {
  const normalizedQuery = query.toLowerCase();
  state.calls.push({ query: normalizedQuery, values });

  if (
    normalizedQuery.includes("from diagnostic_spaces") &&
    normalizedQuery.includes("where owner_user_id = ?") &&
    !normalizedQuery.includes("inner join questionnaires")
  ) {
    return [
      state.existingOwnerSpace
        ? [{ id: "space-1", public_code: "C-AAAA-AAAA" }]
        : [],
    ];
  }

  if (normalizedQuery.includes("from questionnaires")) {
    return [[activeQuestionnaire()]];
  }

  if (normalizedQuery.includes("insert into diagnostic_spaces")) {
    if (state.insertPublicCodeCollisions > 0) {
      state.insertPublicCodeCollisions -= 1;
      throw duplicateError("diagnostic_spaces_public_code_key");
    }

    state.insertedSpaces.push(values);
    return [{ affectedRows: 1 }];
  }

  if (
    normalizedQuery.includes("from diagnostic_spaces") &&
    normalizedQuery.includes("inner join questionnaires")
  ) {
    return [[ownerSpaceRow()]];
  }

  if (normalizedQuery.includes("update diagnostic_spaces")) {
    state.updatedTokens.push(values);
    return [{ affectedRows: 1 }];
  }

  throw new Error(`Unexpected pool query: ${query}`);
}

function createConnectionMock(): ConnectionMock {
  const calls: ExecuteCall[] = [];

  const connection: ConnectionMock = {
    calls,
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(() => undefined),
    execute: vi.fn(async (query: string, values: unknown[] = []) => {
      const normalizedQuery = query.toLowerCase();
      calls.push({ query: normalizedQuery, values });

      if (
        normalizedQuery.includes("from diagnostic_spaces") &&
        normalizedQuery.includes("for update")
      ) {
        return [[{ id: "space-1", public_code: "C-AAAA-AAAA" }]];
      }

      if (normalizedQuery.includes("from questionnaires")) {
        return [[activeQuestionnaire()]];
      }

      if (normalizedQuery.includes("delete answers")) {
        return [{ affectedRows: 20 }];
      }

      if (normalizedQuery.includes("delete from submissions")) {
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("delete from submission_locks")) {
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("update diagnostic_spaces")) {
        state.resetUpdates.push(values);
        return [{ affectedRows: 1 }];
      }

      throw new Error(`Unexpected connection query: ${query}`);
    }),
  };

  return connection;
}

function activeQuestionnaire() {
  return {
    id: "002",
    title: "Diagnosi IA 2026.2",
    version: "2026.2",
  };
}

function ownerSpaceRow() {
  return {
    id: "space-1",
    public_code: "C-AAAA-AAAA",
    is_active: 1,
    created_at: "2026-06-15 10:00:00.000",
    results_token_enabled: 1,
    results_token_encrypted: "encrypted-1",
    questionnaire_title: "Diagnosi IA 2026.2",
    questionnaire_version: "2026.2",
    total_submissions: 3,
  };
}

function duplicateError(indexName: string): Error & {
  code: string;
  errno: number;
  sqlMessage: string;
} {
  return Object.assign(new Error(`Duplicate entry for key '${indexName}'`), {
    code: "ER_DUP_ENTRY",
    errno: 1062,
    sqlMessage: `Duplicate entry for key '${indexName}'`,
  });
}
