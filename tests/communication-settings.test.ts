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
    expect(template.body).toContain("{CODI_QUESTIONARI}");
  });

  it("refreshes the known privacy paragraph and preserves custom content", async () => {
    communicationSettings.set(COMMUNICATION_BODY_SETTING_KEY,
      "Salutació personalitzada\n\n" + 'Les respostes no inclouen el vostre nom. La vostra participació es vincula a un identificador pseudonimitzat perquè pugueu consultar-la més endavant amb el mateix compte Google. El centre i l’administració només poden consultar resultats agregats.' + "\n\nComiat personalitzat\n{URL_QUESTIONARI}\n{CODI_QUESTIONARI}");

    const template = await getCommunicationTemplate();
    expect(template.body).toContain("Salutació personalitzada");
    expect(template.body).toContain("Comiat personalitzat");
    expect(template.body).toContain("No es recullen noms i el correu només s’utilitza durant la sessió per validar l’accés.");
    expect(template.body).toContain("identificador pseudonimitzat");
    expect(template.body).not.toContain("Les respostes no inclouen el vostre nom");
  });

  it("persists configured communication text", async () => {
    const normalizedBody =
      "Nou cos {URL_QUESTIONARI}\n\nTambé podeu accedir al qüestionari amb aquest codi:\n{CODI_QUESTIONARI}";

    await expect(
      setCommunicationTemplate({
        subject: "Nou títol",
        body: "Nou cos {URL_QUESTIONARI}",
      }),
    ).resolves.toEqual({
      subject: "Nou títol",
      body: normalizedBody,
    });

    await expect(getCommunicationTemplate()).resolves.toEqual({
      subject: "Nou títol",
      body: normalizedBody,
    });
  });

  it("upgrades a legacy saved template when it is loaded", async () => {
    communicationSettings.set(COMMUNICATION_SUBJECT_SETTING_KEY, "Títol antic");
    communicationSettings.set(
      COMMUNICATION_BODY_SETTING_KEY,
      "Cos antic\n{URL_QUESTIONARI}",
    );

    const template = await getCommunicationTemplate();

    expect(template.body).toContain("{URL_QUESTIONARI}");
    expect(template.body).toContain("{CODI_QUESTIONARI}");
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
