-- Server-only aggregate results RPC.
-- Returns per-question distribution counts without exposing individual answers.

create or replace function public.get_diagnostic_answer_counts(
  p_diagnostic_space_id uuid
)
returns table (
  question_id uuid,
  value smallint,
  answer_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    answers.question_id,
    answers.value,
    count(*)::bigint as answer_count
  from public.answers
  join public.submissions
    on submissions.id = answers.submission_id
   and submissions.questionnaire_id = answers.questionnaire_id
  where submissions.diagnostic_space_id = p_diagnostic_space_id
  group by answers.question_id, answers.value
  order by answers.question_id, answers.value;
$$;

comment on function public.get_diagnostic_answer_counts(uuid) is
  'Server-only RPC that returns aggregate answer counts by question and scale value. It must never expose individual answers.';

revoke all on function public.get_diagnostic_answer_counts(uuid) from public;
revoke all on function public.get_diagnostic_answer_counts(uuid) from anon;
revoke all on function public.get_diagnostic_answer_counts(uuid) from authenticated;
grant execute on function public.get_diagnostic_answer_counts(uuid) to service_role;
