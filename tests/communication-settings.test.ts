import { beforeEach, describe, expect, it, vi } from "vitest";

let communicationSettings: Map<string, string>;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn((query: string, values: unknown[] = []) =>
      executeQuery(query, values),
    ),
  },
}));

const {
  COMMUNICATION_BODY_SETTING_KEY,
  COMMUNICATION_SUBJECT_SETTING_KEY,
  getCommunicationTemplate,
  setCommunicationTemplate,
} = await import("@/lib/admin/communication-settings");

describe("communication settings", () => {
  beforeEach(() => {
    communicationSettings = new Map();
  });

  it("returns default communication text when settings are missing", async () => {
    const template = await getCommunicationTemplate();

    expect(template.subject).toContain("Qüestionari de diagnosi");
    expect(template.body).toContain("{URL_QUESTIONARI}");
  });

  it("persists configured communication text", async () => {
    await expect(
      setCommunicationTemplate({
        subject: "Nou títol",
        body: "Nou cos {URL_QUESTIONARI}",
      }),
    ).resolves.toEqual({
      subject: "Nou títol",
      body: "Nou cos {URL_QUESTIONARI}",
    });

    await expect(getCommunicationTemplate()).resolves.toEqual({
      subject: "Nou títol",
      body: "Nou cos {URL_QUESTIONARI}",
    });
  });
});

async function executeQuery(query: string, values: unknown[] = []) {
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes("from app_settings")) {
    return [
      [...communicationSettings.entries()]
        .filter(([key]) => values.includes(key))
        .map(([setting_key, setting_value]) => ({
          setting_key,
          setting_value,
        })),
    ];
  }

  if (normalizedQuery.includes("insert into app_settings")) {
    communicationSettings.set(
      COMMUNICATION_SUBJECT_SETTING_KEY,
      String(values[1]),
    );
    communicationSettings.set(COMMUNICATION_BODY_SETTING_KEY, String(values[3]));

    return [{ affectedRows: 2 }];
  }

  throw new Error(`Unexpected query: ${query}`);
}
