-- Enforce one diagnostic space per authenticated creator and reset spaces safely.
-- Existing duplicate owner spaces from before this rule are kept in the database
-- but detached from the owner, deactivated, and prevented from exposing results
-- by shared token. No anonymous submissions or answers are deleted here.
-- Resetting removes anonymous submissions and answers from the selected current
-- space, then rotates public and private result links so old links stop working.

with ranked_owner_spaces as (
  select
    diagnostic_spaces.id,
    row_number() over (
      partition by diagnostic_spaces.owner_user_id
      order by diagnostic_spaces.created_at desc, diagnostic_spaces.id desc
    ) as owner_position
  from public.diagnostic_spaces
  where diagnostic_spaces.owner_user_id is not null
)
update public.diagnostic_spaces
set owner_user_id = null,
    is_active = false,
    closed_at = coalesce(closed_at, now()),
    results_token_enabled = false
where diagnostic_spaces.id in (
  select ranked_owner_spaces.id
  from ranked_owner_spaces
  where ranked_owner_spaces.owner_position > 1
);

create unique index diagnostic_spaces_owner_user_id_unique_idx
  on public.diagnostic_spaces(owner_user_id)
  where owner_user_id is not null;

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
begin
  if p_owner_user_id is null then
    raise exception 'Owner user id is required'
      using errcode = '22023';
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
  set public_code = p_new_public_code,
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

comment on index public.diagnostic_spaces_owner_user_id_unique_idx is
  'Ensures each authenticated XTEC creator owns at most one anonymous diagnostic space.';

comment on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) is
  'Server-only reset for an owner space. Deletes anonymous submissions and answers, then rotates public and shared results links.';

revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from public;
revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from anon;
revoke all on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) from authenticated;
grant execute on function public.reset_owner_diagnostic_space(uuid, text, text, text, text) to service_role;
