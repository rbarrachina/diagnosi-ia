import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{ query: string; values: unknown[] }> = [];
const transaction = vi.hoisted(() => ({
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/crypto/public-code", () => ({
  generatePublicCode: () => "C-ABCD-EFGH",
}));
vi.mock("@/lib/results/results-token", () => ({
  generateResultsToken: () => ({
    encrypted: "encrypted-token",
    hash: "hashed-token",
    token: "clear-token",
  }),
}));
vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      execute(query, values),
    ),
    getConnection: vi.fn(async () => ({
      ...transaction,
      execute: (query: string, values: unknown[] = []) =>
        execute(query, values),
    })),
  },
}));

const {
  deleteAdminCentre,
  listAdminManagedCentres,
  resetAdminCentreResponses,
  resetAdminCentreSpace,
  setAdminCentreSuspended,
} = await import("@/lib/admin/centre-management");

const centreId = "11111111-1111-4111-8111-111111111111";

describe("admin centre management", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.clearAllMocks();
  });

  it("lists institutional data with only an aggregate response count", async () => {
    await expect(listAdminManagedCentres("Institut")).resolves.toEqual([
      expect.objectContaining({
        id: centreId,
        displayName: "Institut Exemple",
        totalSubmissions: 3,
      }),
    ]);

    const query = calls[0]?.query.toLowerCase() ?? "";
    expect(query).toContain("select count(*)");
    expect(query).not.toContain("submissions.id");
    expect(query).not.toContain("from answers");
  });

  it("applies a controlled centre status filter", async () => {
    await listAdminManagedCentres("", "suspended");

    const query = calls[0]?.query.toLowerCase() ?? "";
    expect(query).toContain("and (centres.is_suspended = true)");
  });

  it("suspends the centre and its public space in one transaction", async () => {
    await setAdminCentreSuspended({
      actorUserId: "admin-1",
      centreId,
      suspended: true,
    });

    expect(transaction.beginTransaction).toHaveBeenCalledOnce();
    expect(transaction.commit).toHaveBeenCalledOnce();
    expect(calls.some(({ query }) => query.includes("update centres"))).toBe(true);
    expect(
      calls.some(({ query }) => query.includes("update diagnostic_spaces set is_active")),
    ).toBe(true);
    expect(calls.some(({ query }) => query.includes("insert into admin_centre_actions"))).toBe(true);
  });

  it("resets anonymous responses without loading individual rows", async () => {
    await expect(
      resetAdminCentreResponses({ actorUserId: "admin-1", centreId }),
    ).resolves.toBe(3);

    expect(calls.some(({ query }) => query.includes("delete answers"))).toBe(true);
    expect(calls.some(({ query }) => query.includes("delete submissions"))).toBe(true);
    expect(calls.some(({ query }) => query.includes("delete submission_locks"))).toBe(true);
    expect(transaction.commit).toHaveBeenCalledOnce();
  });

  it("rotates codes and tokens when resetting the complete space", async () => {
    await resetAdminCentreSpace({ actorUserId: "admin-1", centreId });

    const update = calls.find(({ query }) =>
      query.includes("update diagnostic_spaces") && query.includes("public_code"),
    );
    expect(update?.values).toContain("C-ABCD-EFGH");
    expect(update?.values).toContain("hashed-token");
    expect(update?.values).toContain("encrypted-token");
    expect(update?.values).not.toContain("clear-token");
  });

  it("requires the current institutional identifier before deletion", async () => {
    await expect(
      deleteAdminCentre({
        actorUserId: "admin-1",
        centreId,
        confirmation: "incorrecte",
      }),
    ).rejects.toThrow("Invalid deletion confirmation");

    expect(transaction.rollback).toHaveBeenCalledOnce();
    expect(calls.some(({ query }) => query.includes("delete from centres"))).toBe(false);
  });
});

async function execute(query: string, values: unknown[]) {
  const normalized = query.replace(/\s+/g, " ").trim().toLowerCase();
  calls.push({ query: normalized, values });

  if (normalized.includes("for update") && normalized.includes("from centres")) {
    return [[{
      id: centreId,
      label: "Institut Exemple",
      official_code: "08000001",
      centre_email: "a0000001@xtec.cat",
      is_suspended: false,
      space_id: "22222222-2222-4222-8222-222222222222",
    }]];
  }
  if (normalized.includes("select count(*) as submission_count")) {
    return [[{ submission_count: 3 }]];
  }
  if (normalized.includes("from questionnaires") && normalized.includes("is_active = true")) {
    return [[{ id: "002", title: "Diagnosi IA", version: "2026.2" }]];
  }
  if (normalized.includes("from centres") && normalized.includes("centre_accounts")) {
    return [[{
      id: centreId,
      centre_email: "a0000001@xtec.cat",
      official_code: "08000001",
      official_name: "Institut Exemple",
      municipality: "Barcelona",
      territorial_area: "Barcelona Comarques",
      educational_service: "CRP",
      source_status: "ok",
      profile_confirmed_at: "2026-09-01 10:00:00",
      allow_xtec: true,
      custom_domain: "institut.example",
      email_policy_configured_at: "2026-09-01 10:00:00",
      is_suspended: false,
      responsible_email: "a0000001@xtec.cat",
      responsible_name: "Responsable",
      responsible_created_at: "2026-09-01 10:00:00",
      last_login_at: "2026-09-04 09:00:00",
      public_code: "C-WXYZ-2345",
      questionnaire_id: "002",
      questionnaire_title: "Diagnosi IA",
      questionnaire_version: "2026.2",
      space_is_active: true,
      space_created_at: "2026-09-01 11:00:00",
      total_submissions: 3,
    }]];
  }
  if (normalized.startsWith("delete from centres")) {
    return [{ affectedRows: 1 }];
  }
  return [{ affectedRows: 1 }];
}
