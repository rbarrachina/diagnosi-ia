import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenCentreLookup } from "@/lib/centres/open-data";

let mode: string;
let admin: boolean;
let profile: ReturnType<typeof emptyProfile> | null;
let accountId: string | null;
let spaces: { owner: string; centreId: string | null; code: string }[];
let lookup: OpenCentreLookup;
let failRepair: boolean;

const transaction = vi.hoisted(() => ({
  beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) => execute(query, values)),
    getConnection: vi.fn(async () => ({
      ...transaction,
      execute: (query: string, values: unknown[] = []) => execute(query, values),
    })),
  },
}));
vi.mock("@/lib/centres/open-data", () => ({
  lookupCentreOpenData: vi.fn(async () => lookup),
}));

const { mysqlPool } = await import("@/lib/db/client");
const { lookupCentreOpenData } = await import("@/lib/centres/open-data");
const { registerResponsibleCentreAccount, refreshCentreProfileForUser } =
  await import("@/lib/centres/centre-profiles");
const {
  confirmCentreProfileForUser, updateCentreEmailPolicyForUser,
  getCentreEmailPolicyForPublicCode, isEmailAllowedByCentrePolicy,
} = await import("@/lib/centres/email-policy");

const user = { id: "owner-test", email: "docent.prova@xtec.cat", displayName: "Compte de prova" };

beforeEach(() => {
  vi.clearAllMocks();
  mode = "all_xtec";
  admin = false;
  profile = null;
  accountId = null;
  spaces = [];
  lookup = { status: "not_found" };
  failRepair = false;
});

describe("responsible centre registration and onboarding", () => {
  it("gives an ordinary XTEC responsible a persistent profile with guided setup", async () => {
    const result = await registerResponsibleCentreAccount(user);
    expect(result).toMatchObject({
      email: user.email, displayName: user.displayName, officialCode: null,
      sourceStatus: "not_found", profileConfirmedAt: null,
      emailPolicyConfiguredAt: null, allowXtec: true,
    });
    expect(result?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(accountId).toBe(user.id);
    expect(transaction.commit).toHaveBeenCalledOnce();
    expect(transaction.release).toHaveBeenCalledOnce();
    const second = await registerResponsibleCentreAccount(user);
    expect(second?.id).toBe(result?.id);
    expect(lookupCentreOpenData).toHaveBeenCalledTimes(1);
  });

  it("repairs only the owner's orphan space and exposes its public policy after setup", async () => {
    spaces = [
      { owner: user.id, centreId: null, code: "C-AAAA-AAAA" },
      { owner: "another-owner", centreId: null, code: "C-BBBB-BBBB" },
      { owner: user.id, centreId: "existing-centre", code: "C-CCCC-CCCC" },
    ];
    const result = await registerResponsibleCentreAccount(user);
    expect(spaces.map((space) => space.centreId)).toEqual([result?.id, null, "existing-centre"]);
    expect(await getCentreEmailPolicyForPublicCode("C-AAAA-AAAA")).toMatchObject({ configured: false });
    expect(await updateCentreEmailPolicyForUser(user.id, { allowXtec: true, customDomain: null })).toBeNull();
    expect(await confirmCentreProfileForUser(user.id)).toBe(true);
    expect(await updateCentreEmailPolicyForUser(user.id, { allowXtec: true, customDomain: null })).toMatchObject({ configured: true });
    const policy = await getCentreEmailPolicyForPublicCode("C-AAAA-AAAA");
    expect(policy).toEqual({ allowXtec: true, customDomain: null, configured: true });
    expect(isEmailAllowedByCentrePolicy("participant@xtec.cat", policy!)).toBe(true);
    expect(isEmailAllowedByCentrePolicy("participant@example.org", policy!)).toBe(false);
  });

  it("denies ordinary XTEC accounts in restricted mode, even with an existing profile", async () => {
    await registerResponsibleCentreAccount(user);
    vi.clearAllMocks();
    mode = "centre_xtec";
    expect(await registerResponsibleCentreAccount(user)).toBeNull();
    expect(await refreshCentreProfileForUser(user)).toBeNull();
    expect(mysqlPool.getConnection).not.toHaveBeenCalled();
    expect(lookupCentreOpenData).not.toHaveBeenCalled();
  });

  it.each(["all_xtec", "centre_xtec"])("allows active XTEC administrators in %s mode", async (accessMode) => {
    mode = accessMode;
    admin = true;
    expect(await registerResponsibleCentreAccount(user)).toMatchObject({ email: user.email });
  });

  it("keeps official centre details in restricted mode", async () => {
    mode = "centre_xtec";
    lookup = { status: "ok", data: {
      officialCode: "08047431", officialName: "Centre de prova",
      municipality: "Municipi", territorialArea: "Àrea", educationalService: "Servei",
    } };
    expect(await registerResponsibleCentreAccount({ ...user, email: "a8047431@xtec.cat" })).toMatchObject({
      officialCode: "08047431", officialName: "Centre de prova", sourceStatus: "ok",
    });
  });

  it("retains the same profile when the external directory is unavailable", async () => {
    lookup = { status: "unavailable" };
    const first = await registerResponsibleCentreAccount(user);
    expect(first).toMatchObject({ sourceStatus: "unavailable", displayName: user.displayName });
    lookup = { status: "not_found" };
    expect(await refreshCentreProfileForUser(user)).toMatchObject({ id: first?.id, sourceStatus: "not_found" });
  });

  it("does not register non-XTEC accounts, even with an admin flag", async () => {
    admin = true;
    expect(await registerResponsibleCentreAccount({ ...user, email: "external@example.org" })).toBeNull();
    expect(mysqlPool.getConnection).not.toHaveBeenCalled();
  });

  it("rolls back and releases the connection if orphan repair fails", async () => {
    failRepair = true;
    await expect(registerResponsibleCentreAccount(user)).rejects.toThrow("Repair failed");
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledOnce();
    expect(transaction.release).toHaveBeenCalledOnce();
  });
});

function emptyProfile(id: string, email: string) {
  return {
    id, email, display_name: null as string | null,
    official_code: null as string | null, official_name: null as string | null,
    municipality: null as string | null, territorial_area: null as string | null,
    educational_service: null as string | null, source_status: "pending",
    last_attempt_at: null as string | null, last_success_at: null as string | null,
    profile_confirmed_at: null as string | null, allow_xtec: true,
    custom_domain: null as string | null, email_policy_configured_at: null as string | null,
  };
}

// Only MySQL and the external directory are mocked; all services run real code.
async function execute(query: string, values: unknown[]) {
  const sql = query.replace(/\s+/g, " ").trim().toLowerCase();
  if (sql.includes("select centres.is_suspended") && sql.includes("from centre_accounts")) return [[]];
  if (sql.includes("from app_settings")) return [[{ setting_value: mode }]];
  if (sql.includes("from admin_users")) return [admin ? [{ user_id: user.id }] : []];
  if (sql.startsWith("select id from centres")) return [profile && profile.email === values[0] ? [{ id: profile.id }] : []];
  if (sql.startsWith("insert into centres")) {
    profile = emptyProfile(String(values[0]), String(values[1]));
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith("insert into centre_accounts") && profile) {
    accountId = String(values[0]);
    profile.display_name = values[3] as string | null;
    expect(values[1]).toBe(profile.id);
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith("update diagnostic_spaces")) {
    if (failRepair) throw new Error("Repair failed");
    for (const space of spaces) {
      if (space.owner === values[1] && space.centreId === null) space.centreId = String(values[0]);
    }
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith("select") && sql.includes("from diagnostic_spaces")) {
    return [spaces.some((space) => space.code === values[0] && space.centreId === profile?.id) ? [profile] : []];
  }
  if (sql.startsWith("select") && sql.includes("from centres")) {
    return [profile && values[0] === profile.id ? [profile] : []];
  }
  if (sql.startsWith("update centres") && profile) {
    if (sql.includes("set centres.profile_confirmed_at")) {
      if (values[0] !== accountId) return [{ affectedRows: 0 }];
      profile.profile_confirmed_at = "2026-09-03 12:00:00";
    } else if (sql.includes("set centres.allow_xtec")) {
      if (values[2] !== accountId || !profile.profile_confirmed_at) return [{ affectedRows: 0 }];
      profile.allow_xtec = Boolean(values[0]);
      profile.custom_domain = values[1] as string | null;
      profile.email_policy_configured_at = "2026-09-03 12:00:00";
    } else if (sql.includes("set official_code")) {
      [profile.official_code, profile.official_name, profile.municipality, profile.territorial_area, profile.educational_service] = values.slice(0, 5) as string[];
      profile.source_status = "ok";
      profile.last_attempt_at = profile.last_success_at = "2026-09-03 12:00:00";
    } else {
      profile.source_status = String(values[0]);
      profile.last_attempt_at = "2026-09-03 12:00:00";
    }
    return [{ affectedRows: 1 }];
  }
  throw new Error("Unexpected mocked SQL operation");
}
