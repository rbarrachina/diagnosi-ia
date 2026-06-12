-- Resetting a creator space now starts a fresh run with the active
-- questionnaire version while keeping the same anonymous diagnostic space.

create or replace function public.reset_owner_diagnostic_space(
  p_owner_user_id uuid,
  p_current_public_code text,
  p_new_public_code text,
  p_results_token_hash text,
  p_results_token_encrypted text
)
returns table (
  public_code text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_space_id uuid;
  active_questionnaire_id text;
begin
  if p_owner_user_id is null then
    raise exception 'Owner user id is required'
      using errcode = '22023';
  end if;

  select questionnaires.id
  into active_questionnaire_id
  from public.questionnaires
  where questionnaires.is_active = true
  order by questionnaires.created_at desc, questionnaires.id desc
  limit 1;

  if active_questionnaire_id is null then
    raise exception 'Active questionnaire not found'
      using errcode = 'P0002';
  end if;

  select diagnostic_spaces.id
    into target_space_id
  from public.diagnostic_spaces
  where diagnostic_spaces.owner_user_id = p_owner_user_id
    and diagnostic_spaces.public_code = p_current_public_code
  for update;

  if target_space_id is null then
    raise exception 'Diagnostic space not found'
      using errcode = 'P0002';
  end if;

  delete from public.answers as answer_rows
  using public.submissions as submission_rows
  where answer_rows.submission_id = submission_rows.id
    and answer_rows.questionnaire_id = submission_rows.questionnaire_id
    and submission_rows.diagnostic_space_id = target_space_id;

  delete from public.submissions as submission_rows
  where submission_rows.diagnostic_space_id = target_space_id;

  update public.diagnostic_spaces
  set questionnaire_id = active_questionnaire_id,
      public_code = p_new_public_code,
      private_token_hmac = p_results_token_hash,
      results_token_hash = p_results_token_hash,
      results_token_encrypted = p_results_token_encrypted,
      results_token_enabled = true,
      results_token_created_at = now(),
      results_token_expires_at = null,
      is_active = true,
      closed_at = null
  where diagnostic_spaces.id = target_space_id;

  return query
  select p_new_public_code;
end;
$$;

comment on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) is
  'Server-only reset for an owner space. Deletes anonymous submissions and answers, assigns the active questionnaire version, then rotates public and shared results links.';

revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from public;
revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from anon;
revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from authenticated;
grant execute on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) to service_role;
