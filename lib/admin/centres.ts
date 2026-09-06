import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import type { AdminCentreOption } from "@/lib/admin/types";
import { mysqlPool } from "@/lib/db/client";

type AdminCentreRow = RowDataPacket & {
  id: string;
  name: string;
  official_code: string | null;
  municipality: string | null;
  questionnaire_id: string;
};

export async function listAdminCentresWithResults(
  minimumSubmissions: number,
): Promise<AdminCentreOption[]> {
  const [rows] = await mysqlPool.execute<AdminCentreRow[]>(
    `
      select
        centres.id,
        coalesce(centres.official_name, centres.email) as name,
        centres.official_code,
        centres.municipality,
        diagnostic_spaces.questionnaire_id
      from centres
      inner join diagnostic_spaces
        on diagnostic_spaces.centre_id = centres.id
      inner join submissions
        on submissions.diagnostic_space_id = diagnostic_spaces.id
        and submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
      group by
        centres.id,
        centres.official_name,
        centres.email,
        centres.official_code,
        centres.municipality,
        diagnostic_spaces.questionnaire_id
      having count(submissions.id) > ?
      order by name asc
    `,
    [minimumSubmissions],
  );

  const centres = new Map<string, AdminCentreOption>();

  for (const row of rows) {
    const centre = centres.get(row.id) ?? {
      id: row.id,
      name: row.name,
      officialCode: row.official_code,
      municipality: row.municipality,
      questionnaireIds: [],
    };
    centre.questionnaireIds.push(row.questionnaire_id);
    centres.set(row.id, centre);
  }

  return [...centres.values()];
}
