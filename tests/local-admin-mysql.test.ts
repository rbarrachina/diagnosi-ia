import { beforeEach, describe, expect, it, vi } from "vitest";

type Session =
  | {
      status: "authenticated";
      user: {
        id: string;
        email: string;
      };
    }
  | { status: "forbidden"; email: string | null }
  | { status: "unauthenticated" };

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

let currentSession: Session;
let adminRows: Array<{
  user_id: string;
  role: "admin";
  is_active: number;
  created_at: string;
  created_by: string | null;
}>;
let connection: ConnectionMock;
let poolCalls: ExecuteCall[];

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  getXtecSessionState: vi.fn(async () => currentSession),
}));

vi.mock("@/lib/auth/local", () => ({
  getLocalAuthUserSearchProfile: vi.fn(() => ({
    userId: "00000000-0000-4000-8000-000000000001",
    displayName: "Usuari local XTEC",
    email: "usuari.prova@xtec.cat",
  })),
  isLocalAuthEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      executePoolQuery(query, values),
    ),
    getConnection: vi.fn(async () => {
      connection = createConnectionMock();
      return connection;
    }),
  },
}));

const { getAdminSessionState } = await import("@/lib/admin/auth");
const {
  addOrReactivateAdminUser,
  listAdminUsers,
  searchAuthUsersForAdmin,
} = await import("@/lib/admin/admin-users");

describe("local admin auth with MySQL admin_users", () => {
  beforeEach(() => {
    currentSession = {
      status: "authenticated",
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        email: "usuari.prova@xtec.cat",
      },
    };
    adminRows = [];
    poolCalls = [];
    connection = createConnectionMock();
  });

  it("bootstraps the first local administrator atomically", async () => {
    const session = await getAdminSessionState({ allowBootstrap: true });

    expect(session).toEqual({
      status: "authenticated",
      user: currentSession.status === "authenticated" ? currentSession.user : null,
      bootstrapped: true,
    });
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.calls.some((call) => call.query.includes("get_lock"))).toBe(true);
    expect(adminRows).toEqual([
      expect.objectContaining({
        user_id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
        is_active: 1,
        created_by: null,
      }),
    ]);
    expect(JSON.stringify(adminRows)).not.toContain("usuari.prova@xtec.cat");
  });

  it("uses MySQL admin_users for admin listing and local search profiles", async () => {
    adminRows = [
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
        is_active: 1,
        created_at: "2026-06-15 10:00:00.000",
        created_by: null,
      },
    ];

    await expect(listAdminUsers()).resolves.toEqual([
      expect.objectContaining({
        userId: "00000000-0000-4000-8000-000000000001",
        email: "usuari.prova@xtec.cat",
      }),
    ]);
    await expect(searchAuthUsersForAdmin("prova")).resolves.toHaveLength(1);
  });

  it("adds admin users without copying personal fields into admin_users", async () => {
    await addOrReactivateAdminUser(
      { userId: "00000000-0000-4000-8000-000000000002" },
      "00000000-0000-4000-8000-000000000001",
    );

    expect(adminRows).toEqual([
      expect.objectContaining({
        user_id: "00000000-0000-4000-8000-000000000002",
        created_by: "00000000-0000-4000-8000-000000000001",
      }),
    ]);
    expect(JSON.stringify(adminRows)).not.toMatch(/email|nom|cognom|usuari\.prova/);
  });

  it("rejects non-XTEC sessions before admin checks", async () => {
    currentSession = { status: "forbidden", email: "persona@example.test" };

    await expect(getAdminSessionState({ allowBootstrap: true })).resolves.toEqual({
      status: "forbidden",
      reason: "not_xtec",
      email: "persona@example.test",
    });
    expect(poolCalls).toHaveLength(0);
  });
});

async function executePoolQuery(query: string, values: unknown[] = []) {
  const normalizedQuery = query.toLowerCase();
  poolCalls.push({ query: normalizedQuery, values });

  if (normalizedQuery.includes("from admin_users") && normalizedQuery.includes("limit 1")) {
    return [
      adminRows.filter(
        (row) =>
          row.user_id === values[0] &&
          (!normalizedQuery.includes("is_active = true") || row.is_active === 1),
      ),
    ];
  }

  if (normalizedQuery.includes("from admin_users")) {
    return [adminRows];
  }

  if (normalizedQuery.includes("insert into admin_users")) {
    const userId = String(values[0]);
    const createdBy = values[1] === undefined ? null : String(values[1]);
    const existing = adminRows.find((row) => row.user_id === userId);

    if (existing) {
      existing.is_active = 1;
      existing.created_by = createdBy;
    } else {
      adminRows.push({
        user_id: userId,
        role: "admin",
        is_active: 1,
        created_at: "2026-06-15 10:00:00.000",
        created_by: createdBy,
      });
    }

    return [{ affectedRows: 1 }];
  }

  throw new Error(`Unexpected pool query: ${query}`);
}

function createConnectionMock(): ConnectionMock {
  const calls: ExecuteCall[] = [];

  return {
    calls,
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(() => undefined),
    execute: vi.fn(async (query: string, values: unknown[] = []) => {
      const normalizedQuery = query.toLowerCase();
      calls.push({ query: normalizedQuery, values });

      if (normalizedQuery.includes("get_lock")) {
        return [[{ lock_result: 1 }]];
      }

      if (normalizedQuery.includes("count(*) as admin_count")) {
        return [[{ admin_count: adminRows.length }]];
      }

      if (normalizedQuery.includes("insert into admin_users")) {
        adminRows.push({
          user_id: String(values[0]),
          role: "admin",
          is_active: 1,
          created_at: "2026-06-15 10:00:00.000",
          created_by: null,
        });
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("release_lock")) {
        return [[{ released: 1 }]];
      }

      throw new Error(`Unexpected connection query: ${query}`);
    }),
  };
}
