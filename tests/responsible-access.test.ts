import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResponsibleAccessMode } from "@/lib/auth/responsible-access";

let responsibleAccessMode: ResponsibleAccessMode | null;
let adminMinimumSubmissions: number | null;
let activeAdminUserIds: Set<string>;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      executeQuery(query, values),
    ),
  },
}));

const {
  canUseResponsibleAccess,
  getAdminResultsMinimumSubmissions,
  getResponsibleAccessMode,
  setAdminResultsMinimumSubmissions,
  setResponsibleAccessMode,
} = await import("@/lib/auth/responsible-access");

describe("responsible access settings", () => {
  beforeEach(() => {
    responsibleAccessMode = "all_xtec";
    adminMinimumSubmissions = 0;
    activeAdminUserIds = new Set();
  });

  it("defaults to any XTEC account for responsible access", async () => {
    await expect(getResponsibleAccessMode()).resolves.toBe("all_xtec");
    await expect(
      canUseResponsibleAccess({
        id: "00000000-0000-4000-8000-000000000001",
        email: "persona.prova@xtec.cat",
      }),
    ).resolves.toBe(true);
  });

  it("allows only centre accounts or active admins in centre mode", async () => {
    responsibleAccessMode = "centre_xtec";
    activeAdminUserIds.add("00000000-0000-4000-8000-000000000003");

    await expect(
      canUseResponsibleAccess({
        id: "00000000-0000-4000-8000-000000000001",
        email: "persona.prova@xtec.cat",
      }),
    ).resolves.toBe(false);
    await expect(
      canUseResponsibleAccess({
        id: "00000000-0000-4000-8000-000000000002",
        email: "a1234567@xtec.cat",
      }),
    ).resolves.toBe(true);
    await expect(
      canUseResponsibleAccess({
        id: "00000000-0000-4000-8000-000000000003",
        email: "admin.prova@xtec.cat",
      }),
    ).resolves.toBe(true);
  });

  it("persists the selected responsible access mode", async () => {
    await expect(setResponsibleAccessMode("centre_xtec")).resolves.toBe(
      "centre_xtec",
    );
    await expect(getResponsibleAccessMode()).resolves.toBe("centre_xtec");
  });

  it("persists the minimum responses used for admin result aggregation", async () => {
    await expect(setAdminResultsMinimumSubmissions(7)).resolves.toBe(7);
    await expect(getAdminResultsMinimumSubmissions()).resolves.toBe(7);
  });

  it("defaults invalid minimum responses to zero", async () => {
    adminMinimumSubmissions = 12;

    await expect(getAdminResultsMinimumSubmissions()).resolves.toBe(0);
  });
});

async function executeQuery(query: string, values: unknown[] = []) {
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes("from app_settings")) {
    const settingKey = String(values[0]);

    if (settingKey === "admin_results_minimum_submissions") {
      return [
        adminMinimumSubmissions === null
          ? []
          : [{ setting_value: String(adminMinimumSubmissions) }],
      ];
    }

    return [
      responsibleAccessMode
        ? [{ setting_value: responsibleAccessMode }]
        : [],
    ];
  }

  if (normalizedQuery.includes("insert into app_settings")) {
    const settingKey = String(values[0]);

    if (settingKey === "admin_results_minimum_submissions") {
      adminMinimumSubmissions = Number(values[1]);
    } else {
      responsibleAccessMode = String(values[1]) as ResponsibleAccessMode;
    }

    return [{ affectedRows: 1 }];
  }

  if (normalizedQuery.includes("from admin_users")) {
    const userId = String(values[0]);
    return [activeAdminUserIds.has(userId) ? [{ user_id: userId }] : []];
  }

  throw new Error(`Unexpected query: ${query}`);
}
