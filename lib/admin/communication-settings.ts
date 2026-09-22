import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import {
  DEFAULT_COMMUNICATION_BODY,
  DEFAULT_COMMUNICATION_SUBJECT,
  QUESTIONNAIRE_CODE_PLACEHOLDER,
  QUESTIONNAIRE_URL_PLACEHOLDER,
  type CommunicationTemplate,
} from "@/lib/communication/email-template";
import { mysqlPool } from "@/lib/db/client";

export const COMMUNICATION_SUBJECT_SETTING_KEY = "communication_subject";
export const COMMUNICATION_BODY_SETTING_KEY = "communication_body";

type SettingRow = RowDataPacket & {
  setting_key: string;
  setting_value: string;
};

export class CommunicationSettingsError extends Error {
  constructor(message = "Could not update communication settings") {
    super(message);
    this.name = "CommunicationSettingsError";
  }
}

export async function getCommunicationTemplate(): Promise<CommunicationTemplate> {
  try {
    const [rows] = await mysqlPool.execute<SettingRow[]>(
      `
        select setting_key, setting_value
        from app_settings
        where setting_key in (?, ?)
      `,
      [COMMUNICATION_SUBJECT_SETTING_KEY, COMMUNICATION_BODY_SETTING_KEY],
    );
    const settings = new Map(
      rows.map((row) => [row.setting_key, row.setting_value]),
    );

    return {
      subject:
        settings.get(COMMUNICATION_SUBJECT_SETTING_KEY) ??
        DEFAULT_COMMUNICATION_SUBJECT,
      body:
        ensureRequiredCommunicationPlaceholders(
          settings.get(COMMUNICATION_BODY_SETTING_KEY) ??
            DEFAULT_COMMUNICATION_BODY,
        ),
    };
  } catch (error) {
    if (isMissingSettingsTableError(error)) {
      return {
        subject: DEFAULT_COMMUNICATION_SUBJECT,
        body: DEFAULT_COMMUNICATION_BODY,
      };
    }

    throw error;
  }
}

export async function setCommunicationTemplate(
  template: CommunicationTemplate,
): Promise<CommunicationTemplate> {
  const subject = template.subject.trim();
  const body = ensureRequiredCommunicationPlaceholders(template.body.trim());

  if (!subject || !body) {
    throw new CommunicationSettingsError();
  }

  await mysqlPool.execute(
    `
      insert into app_settings (setting_key, setting_value)
      values (?, ?), (?, ?)
      on duplicate key update
        setting_value = values(setting_value),
        updated_at = current_timestamp(3)
    `,
    [
      COMMUNICATION_SUBJECT_SETTING_KEY,
      subject,
      COMMUNICATION_BODY_SETTING_KEY,
      body,
    ],
  );

  return { subject, body };
}

function ensureRequiredCommunicationPlaceholders(body: string): string {
  const additions: string[] = [];

  if (!body.includes(QUESTIONNAIRE_URL_PLACEHOLDER)) {
    additions.push(`Podeu accedir-hi des d'aquest enllaç:\n${QUESTIONNAIRE_URL_PLACEHOLDER}`);
  }

  if (!body.includes(QUESTIONNAIRE_CODE_PLACEHOLDER)) {
    additions.push(
      `Per tornar-hi a accedir més endavant, conserveu aquest codi:\n${QUESTIONNAIRE_CODE_PLACEHOLDER}`,
    );
  }

  return additions.length === 0
    ? body
    : `${body.trim()}\n\n${additions.join("\n\n")}`;
}

function isMissingSettingsTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_NO_SUCH_TABLE"
  );
}
