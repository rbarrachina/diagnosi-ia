-- Active questionnaire versions must not be deleted in place.
-- Activate another version first, then delete the inactive one.

create or replace function public.delete_questionnaire_version(
  p_questionnaire_id text
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_questionnaire_id text;
  target_is_active boolean;
begin
  select questionnaires.id, questionnaires.is_active
  into target_questionnaire_id, target_is_active
  from public.questionnaires
  where questionnaires.id = p_questionnaire_id
  for update;

  if target_questionnaire_id is null then
    raise exception 'Questionnaire not found'
      using errcode = 'P0002';
  end if;

  if target_is_active then
    raise exception 'Active questionnaire versions cannot be deleted'
      using errcode = '23514';
  end if;

  delete from public.answers
  where answers.questionnaire_id = target_questionnaire_id;

  delete from public.submissions
  where submissions.questionnaire_id = target_questionnaire_id;

  delete from public.diagnostic_spaces
  where diagnostic_spaces.questionnaire_id = target_questionnaire_id;

  delete from public.questions
  where questions.questionnaire_id = target_questionnaire_id;

  delete from public.question_blocks
  where question_blocks.questionnaire_id = target_questionnaire_id;

  delete from public.questionnaires
  where questionnaires.id = target_questionnaire_id;
end;
$$;

revoke all on function public.delete_questionnaire_version(text) from public;
revoke all on function public.delete_questionnaire_version(text) from anon;
revoke all on function public.delete_questionnaire_version(text) from authenticated;
grant execute on function public.delete_questionnaire_version(text) to service_role;

comment on function public.delete_questionnaire_version(text) is
  'Server-only destructive deletion of an inactive questionnaire version and all dependent anonymous data.';
