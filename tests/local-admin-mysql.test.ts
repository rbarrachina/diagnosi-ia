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
let invitationRows: Array<{
  email: string;
  is_active: number;
  created_at: string;
  invited_by: string;
  accepted_at: string | null;
  accepted_by: string | null;
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
  inviteAdminByEmail,
  listAdminEmailInvitations,
  listAdminUsers,
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
    invitationRows = [];
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
    expect(invitationRows).toEqual([
      expect.objectContaining({
        email: "usuari.prova@xtec.cat",
        is_active: 0,
        accepted_by: "00000000-0000-4000-8000-000000000001",
      }),
    ]);
    await expect(listAdminUsers()).resolves.toEqual([
      expect.objectContaining({
        userId: "00000000-0000-4000-8000-000000000001",
        email: "usuari.prova@xtec.cat",
      }),
    ]);
  });

  it("uses MySQL admin_users and accepted invitations for admin listing", async () => {
    adminRows = [
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
        is_active: 1,
        created_at: "2026-06-15 10:00:00.000",
        created_by: null,
      },
    ];
    invitationRows = [
      {
        email: "usuari.prova@xtec.cat",
        is_active: 0,
        created_at: "2026-06-15 09:00:00.000",
        invited_by: "00000000-0000-4000-8000-000000000000",
        accepted_at: "2026-06-15 10:00:00.000",
        accepted_by: "00000000-0000-4000-8000-000000000001",
      },
    ];

    await expect(listAdminUsers()).resolves.toEqual([
      expect.objectContaining({
        userId: "00000000-0000-4000-8000-000000000001",
        email: "usuari.prova@xtec.cat",
      }),
    ]);
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

  it("creates pending admin invitations by XTEC email", async () => {
    await inviteAdminByEmail(
      { email: "NOVA.ADMIN@xtec.cat" },
      "00000000-0000-4000-8000-000000000001",
    );

    expect(invitationRows).toEqual([
      expect.objectContaining({
        email: "nova.admin@xtec.cat",
        is_active: 1,
        invited_by: "00000000-0000-4000-8000-000000000001",
        accepted_at: null,
        accepted_by: null,
      }),
    ]);
    await expect(listAdminEmailInvitations()).resolves.toEqual([
      expect.objectContaining({
        email: "nova.admin@xtec.cat",
      }),
    ]);
  });

  it("accepts a pending email invitation when the invited user signs in", async () => {
    adminRows = [
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
        is_active: 1,
        created_at: "2026-06-15 10:00:00.000",
        created_by: null,
      },
    ];
    invitationRows = [
      {
        email: "nova.admin@xtec.cat",
        is_active: 1,
        created_at: "2026-06-15 10:00:00.000",
        invited_by: "00000000-0000-4000-8000-000000000001",
        accepted_at: null,
        accepted_by: null,
      },
    ];
    currentSession = {
      status: "authenticated",
      user: {
        id: "00000000-0000-4000-8000-000000000002",
        email: "nova.admin@xtec.cat",
      },
    };

    await expect(getAdminSessionState({ allowBootstrap: true })).resolves.toEqual({
      status: "authenticated",
      user: currentSession.status === "authenticated" ? currentSession.user : null,
      bootstrapped: false,
    });
    expect(adminRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "00000000-0000-4000-8000-000000000002",
          role: "admin",
          is_active: 1,
        }),
      ]),
    );
    expect(invitationRows[0]).toEqual(
      expect.objectContaining({
        is_active: 0,
        accepted_by: "00000000-0000-4000-8000-000000000002",
      }),
    );
    expect(JSON.stringify(adminRows)).not.toContain("nova.admin@xtec.cat");
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

  if (
    normalizedQuery.includes("from admin_email_invitations") &&
    normalizedQuery.includes("accepted_by is not null")
  ) {
    return [invitationRows.filter((row) => row.accepted_by !== null)];
  }

  if (
    normalizedQuery.includes("from admin_email_invitations") &&
    normalizedQuery.includes("accepted_at is null")
  ) {
    return [
      invitationRows.filter((row) => row.is_active === 1 && row.accepted_at === null),
    ];
  }

  if (
    normalizedQuery.includes("from admin_email_invitations") &&
    normalizedQuery.includes("where email =")
  ) {
    return [invitationRows.filter((row) => row.email === values[0])];
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

  if (normalizedQuery.includes("insert into admin_email_invitations")) {
    const email = String(values[0]);
    const invitedBy = String(values[1]);
    const acceptedBy = values[2] ? String(values[2]) : null;
    const existing = invitationRows.find((row) => row.email === email);

    if (existing) {
      existing.is_active = acceptedBy ? 0 : 1;
      existing.invited_by = invitedBy;
      existing.accepted_at = acceptedBy
        ? (existing.accepted_at ?? "2026-06-15 11:00:00.000")
        : null;
      existing.accepted_by = acceptedBy;
    } else {
      invitationRows.push({
        email,
        is_active: acceptedBy ? 0 : 1,
        created_at: "2026-06-15 10:00:00.000",
        invited_by: invitedBy,
        accepted_at: acceptedBy ? "2026-06-15 11:00:00.000" : null,
        accepted_by: acceptedBy,
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
        const userId = String(values[0]);
        const existing = adminRows.find((row) => row.user_id === userId);

        if (existing) {
          existing.is_active = 1;
        } else {
          adminRows.push({
            user_id: userId,
            role: "admin",
            is_active: 1,
            created_at: "2026-06-15 10:00:00.000",
            created_by: null,
          });
        }
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("insert into admin_email_invitations")) {
        const email = String(values[0]);
        const invitedBy = String(values[1]);
        const acceptedBy = values[2] ? String(values[2]) : null;
        const existing = invitationRows.find((row) => row.email === email);

        if (existing) {
          existing.is_active = acceptedBy ? 0 : 1;
          existing.invited_by = invitedBy;
          existing.accepted_at = acceptedBy
            ? (existing.accepted_at ?? "2026-06-15 11:00:00.000")
            : null;
          existing.accepted_by = acceptedBy;
        } else {
          invitationRows.push({
            email,
            is_active: acceptedBy ? 0 : 1,
            created_at: "2026-06-15 10:00:00.000",
            invited_by: invitedBy,
            accepted_at: acceptedBy ? "2026-06-15 11:00:00.000" : null,
            accepted_by: acceptedBy,
          });
        }

        return [{ affectedRows: 1 }];
      }

      if (
        normalizedQuery.includes("from admin_email_invitations") &&
        normalizedQuery.includes("for update")
      ) {
        return [
          invitationRows.filter(
            (row) =>
              row.email === values[0] &&
              row.is_active === 1 &&
              row.accepted_at === null,
          ),
        ];
      }

      if (normalizedQuery.includes("update admin_email_invitations")) {
        const userId = String(values[0]);
        const email = String(values[1]);
        const invitation = invitationRows.find((row) => row.email === email);

        if (invitation) {
          invitation.is_active = 0;
          invitation.accepted_at = "2026-06-15 11:00:00.000";
          invitation.accepted_by = userId;
        }

        return [{ affectedRows: invitation ? 1 : 0 }];
      }

      if (normalizedQuery.includes("release_lock")) {
        return [[{ released: 1 }]];
      }

      throw new Error(`Unexpected connection query: ${query}`);
    }),
  };
}
