import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { mysqlPool } from "@/lib/db/client";

export type AdminSummary = {
  activeCentres: number;
  suspendedCentres: number;
  pendingCentres: number;
  centresWithoutQuestionnaire: number;
  centresWithoutResponses: number;
  computableResponses: number;
  activeCentresWithoutQuestionnaire: number;
  centresWithQuestionnaireWithoutResponses: number;
  activeQuestionnaire: null | {
    id: string;
    title: string;
    version: string;
    createdAt: string;
    centreCount: number;
    computableResponses: number;
  };
};

type CentreSummaryRow = RowDataPacket & {
  active_centres: number | string;
  suspended_centres: number | string;
  pending_centres: number | string;
  centres_without_questionnaire: number | string;
  centres_without_responses: number | string;
  computable_responses: number | string;
  active_centres_without_questionnaire: number | string;
  centres_with_questionnaire_without_responses: number | string;
};

type QuestionnaireSummaryRow = RowDataPacket & {
  id: string;
  title: string;
  version: string;
  created_at: string | Date;
  centre_count: number | string;
  computable_responses: number | string;
};

export async function getAdminSummary(
  minimumSubmissions: number,
): Promise<AdminSummary> {
  const [centreRows] = await mysqlPool.execute<CentreSummaryRow[]>(
    `
      select
        sum(
          centres.is_suspended = false
          and centres.profile_confirmed_at is not null
          and centres.email_policy_configured_at is not null
        ) as active_centres,
        sum(centres.is_suspended = true) as suspended_centres,
        sum(
          centres.is_suspended = false
          and (
            centres.profile_confirmed_at is null
            or centres.email_policy_configured_at is null
          )
        ) as pending_centres,
        sum(space_totals.diagnostic_space_id is null) as centres_without_questionnaire,
        sum(coalesce(space_totals.submission_count, 0) = 0) as centres_without_responses,
        sum(
          centres.is_suspended = false
          and centres.profile_confirmed_at is not null
          and centres.email_policy_configured_at is not null
          and space_totals.diagnostic_space_id is null
        ) as active_centres_without_questionnaire,
        sum(
          space_totals.diagnostic_space_id is not null
          and coalesce(space_totals.submission_count, 0) = 0
        ) as centres_with_questionnaire_without_responses,
        coalesce(
          sum(
            case
              when space_totals.submission_count > ?
                then space_totals.submission_count
              else 0
            end
          ),
          0
        ) as computable_responses
      from centres
      inner join centre_accounts on centre_accounts.centre_id = centres.id
      left join (
        select
          diagnostic_spaces.id as diagnostic_space_id,
          diagnostic_spaces.centre_id,
          count(submissions.id) as submission_count
        from diagnostic_spaces
        left join submissions
          on submissions.diagnostic_space_id = diagnostic_spaces.id
          and submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
        group by diagnostic_spaces.id, diagnostic_spaces.centre_id
      ) as space_totals on space_totals.centre_id = centres.id
    `,
    [minimumSubmissions],
  );

  const [questionnaireRows] = await mysqlPool.execute<QuestionnaireSummaryRow[]>(
    `
      select
        questionnaires.id,
        questionnaires.title,
        questionnaires.version,
        questionnaires.created_at,
        count(space_totals.diagnostic_space_id) as centre_count,
        coalesce(
          sum(
            case
              when space_totals.submission_count > ?
                then space_totals.submission_count
              else 0
            end
          ),
          0
        ) as computable_responses
      from questionnaires
      left join (
        select
          diagnostic_spaces.id as diagnostic_space_id,
          diagnostic_spaces.questionnaire_id,
          count(submissions.id) as submission_count
        from diagnostic_spaces
        left join submissions
          on submissions.diagnostic_space_id = diagnostic_spaces.id
          and submissions.questionnaire_id = diagnostic_spaces.questionnaire_id
        group by diagnostic_spaces.id, diagnostic_spaces.questionnaire_id
      ) as space_totals on space_totals.questionnaire_id = questionnaires.id
      where questionnaires.is_active = true
      group by
        questionnaires.id,
        questionnaires.title,
        questionnaires.version,
        questionnaires.created_at
      order by questionnaires.created_at desc, questionnaires.id desc
      limit 1
    `,
    [minimumSubmissions],
  );

  const centres = centreRows[0];
  const questionnaire = questionnaireRows[0];

  return {
    activeCentres: Number(centres?.active_centres ?? 0),
    suspendedCentres: Number(centres?.suspended_centres ?? 0),
    pendingCentres: Number(centres?.pending_centres ?? 0),
    centresWithoutQuestionnaire: Number(
      centres?.centres_without_questionnaire ?? 0,
    ),
    centresWithoutResponses: Number(centres?.centres_without_responses ?? 0),
    computableResponses: Number(centres?.computable_responses ?? 0),
    activeCentresWithoutQuestionnaire: Number(
      centres?.active_centres_without_questionnaire ?? 0,
    ),
    centresWithQuestionnaireWithoutResponses: Number(
      centres?.centres_with_questionnaire_without_responses ?? 0,
    ),
    activeQuestionnaire: questionnaire
      ? {
          id: questionnaire.id,
          title: questionnaire.title,
          version: questionnaire.version,
          createdAt:
            questionnaire.created_at instanceof Date
              ? questionnaire.created_at.toISOString()
              : questionnaire.created_at,
          centreCount: Number(questionnaire.centre_count),
          computableResponses: Number(questionnaire.computable_responses),
        }
      : null,
  };
}
