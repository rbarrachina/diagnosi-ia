-- Server-only RPCs for administration workflows.
-- These functions do not expose diagnostic spaces, submissions or answers.

create or replace function public.bootstrap_first_admin(
  p_user_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'User id is required'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('diagnosi_ia_admin_bootstrap'));

  if exists (select 1 from public.admin_users) then
    return false;
  end if;

  insert into public.admin_users (user_id, role, is_active)
  values (p_user_id, 'admin', true);

  return true;
end;
$$;

create or replace function private.next_questionnaire_id()
returns text
language sql
stable
set search_path = public
as $$
  select lpad((coalesce(max(id::integer), 0) + 1)::text, 3, '0')
  from public.questionnaires;
$$;

create or replace function private.questionnaire_submission_count(
  p_questionnaire_id text
)
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::integer
  from public.submissions
  where submissions.questionnaire_id = p_questionnaire_id;
$$;

create or replace function public.create_questionnaire_draft(
  p_version text,
  p_title text
)
returns table (
  id text,
  version text,
  title text,
  is_active boolean
)
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  new_questionnaire_id text;
begin
  if p_version is null or p_version !~ '^[0-9]{4}\.[0-9]+$' then
    raise exception 'Invalid questionnaire version'
      using errcode = '22023';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Questionnaire title is required'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('diagnosi_ia_questionnaire_id'));
  new_questionnaire_id := private.next_questionnaire_id();

  insert into public.questionnaires (id, version, title, is_active)
  values (new_questionnaire_id, p_version, btrim(p_title), false);

  return query
  select
    questionnaires.id,
    questionnaires.version,
    questionnaires.title,
    questionnaires.is_active
  from public.questionnaires
  where questionnaires.id = new_questionnaire_id;
end;
$$;

create or replace function public.copy_questionnaire_version(
  p_source_questionnaire_id text,
  p_new_version text,
  p_new_title text
)
returns table (
  id text,
  version text,
  title text,
  is_active boolean
)
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  new_questionnaire_id text;
begin
  if not exists (
    select 1
    from public.questionnaires
    where questionnaires.id = p_source_questionnaire_id
  ) then
    raise exception 'Source questionnaire not found'
      using errcode = 'P0002';
  end if;

  if p_new_version is null or p_new_version !~ '^[0-9]{4}\.[0-9]+$' then
    raise exception 'Invalid questionnaire version'
      using errcode = '22023';
  end if;

  if p_new_title is null or btrim(p_new_title) = '' then
    raise exception 'Questionnaire title is required'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('diagnosi_ia_questionnaire_id'));
  new_questionnaire_id := private.next_questionnaire_id();

  insert into public.questionnaires (id, version, title, is_active)
  values (new_questionnaire_id, p_new_version, btrim(p_new_title), false);

  insert into public.question_blocks (id, questionnaire_id, position, title)
  select
    question_blocks.id,
    new_questionnaire_id,
    question_blocks.position,
    question_blocks.title
  from public.question_blocks
  where question_blocks.questionnaire_id = p_source_questionnaire_id
  order by question_blocks.position;

  insert into public.questions (
    questionnaire_id,
    block_id,
    position,
    block_position,
    text,
    scale_min,
    scale_max
  )
  select
    new_questionnaire_id,
    questions.block_id,
    questions.position,
    questions.block_position,
    questions.text,
    questions.scale_min,
    questions.scale_max
  from public.questions
  where questions.questionnaire_id = p_source_questionnaire_id
  order by questions.position;

  return query
  select
    questionnaires.id,
    questionnaires.version,
    questionnaires.title,
    questionnaires.is_active
  from public.questionnaires
  where questionnaires.id = new_questionnaire_id;
end;
$$;

create or replace function public.replace_questionnaire_content(
  p_questionnaire_id text,
  p_title text,
  p_blocks jsonb
)
returns table (
  id text,
  version text,
  title text,
  is_active boolean
)
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  block_count integer;
  question_count integer;
  invalid_block_count integer;
begin
  if not exists (
    select 1
    from public.questionnaires
    where questionnaires.id = p_questionnaire_id
  ) then
    raise exception 'Questionnaire not found'
      using errcode = 'P0002';
  end if;

  if private.questionnaire_submission_count(p_questionnaire_id) <> 0 then
    raise exception 'Questionnaire content cannot be changed after submissions exist'
      using errcode = '23514';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Questionnaire title is required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_blocks) is distinct from 'array'
    or jsonb_array_length(p_blocks) > 5
  then
    raise exception 'Expected at most 5 question blocks'
      using errcode = '22023';
  end if;

  with parsed_blocks as (
    select
      (block_item.block ->> 'position')::integer as position,
      block_item.block ->> 'title' as title,
      block_item.block -> 'questions' as questions
    from jsonb_array_elements(p_blocks) as block_item(block)
  )
  select
    count(*),
    coalesce(sum(jsonb_array_length(parsed_blocks.questions)), 0),
    count(*) filter (
      where parsed_blocks.position not between 1 and 5
        or btrim(coalesce(parsed_blocks.title, '')) = ''
        or jsonb_typeof(parsed_blocks.questions) is distinct from 'array'
        or jsonb_array_length(parsed_blocks.questions) > 4
    )
  into block_count, question_count, invalid_block_count
  from parsed_blocks;

  if block_count > 5 or question_count > 20 or invalid_block_count <> 0 then
    raise exception 'Invalid questionnaire block shape'
      using errcode = '22023';
  end if;

  with parsed_questions as (
    select
      (block_item.block ->> 'position')::integer as block_position,
      question_item.question ->> 'text' as text,
      (question_item.question ->> 'blockPosition')::integer as question_block_position
    from jsonb_array_elements(p_blocks) as block_item(block)
    cross join lateral jsonb_array_elements(block_item.block -> 'questions') as question_item(question)
  )
  select count(*)
  into invalid_block_count
  from parsed_questions
  where question_block_position not between 1 and 4
     or btrim(coalesce(text, '')) = '';

  if invalid_block_count <> 0 then
    raise exception 'Invalid questionnaire question shape'
      using errcode = '22023';
  end if;

  with block_positions as (
    select (block_item.block ->> 'position')::integer as position
    from jsonb_array_elements(p_blocks) as block_item(block)
  )
  select count(*) - count(distinct position)
  into invalid_block_count
  from block_positions;

  if invalid_block_count <> 0 then
    raise exception 'Duplicate block positions'
      using errcode = '22023';
  end if;

  with parsed_questions as (
    select
      (block_item.block ->> 'position')::integer as block_position,
      (question_item.question ->> 'blockPosition')::integer as question_block_position
    from jsonb_array_elements(p_blocks) as block_item(block)
    cross join lateral jsonb_array_elements(block_item.block -> 'questions') as question_item(question)
  )
  select count(*)
  into invalid_block_count
  from (
    select block_position
    from parsed_questions
    group by block_position
    having count(*) > 4
       or count(*) <> count(distinct question_block_position)
  ) invalid_blocks;

  if invalid_block_count <> 0 then
    raise exception 'Invalid question positions inside blocks'
      using errcode = '22023';
  end if;

  update public.questionnaires
  set title = btrim(p_title)
  where questionnaires.id = p_questionnaire_id;

  delete from public.questions
  where questions.questionnaire_id = p_questionnaire_id;

  delete from public.question_blocks
  where question_blocks.questionnaire_id = p_questionnaire_id;

  with parsed_blocks as (
    select
      lpad((block_item.block ->> 'position')::integer::text, 2, '0') as id,
      (block_item.block ->> 'position')::integer as position,
      btrim(block_item.block ->> 'title') as title
    from jsonb_array_elements(p_blocks) as block_item(block)
  )
  insert into public.question_blocks (id, questionnaire_id, position, title)
  select
    parsed_blocks.id,
    p_questionnaire_id,
    parsed_blocks.position,
    parsed_blocks.title
  from parsed_blocks
  order by parsed_blocks.position;

  with parsed_questions as (
    select
      (block_item.block ->> 'position')::integer as block_position,
      (question_item.question ->> 'blockPosition')::integer as question_block_position,
      btrim(question_item.question ->> 'text') as text
    from jsonb_array_elements(p_blocks) as block_item(block)
    cross join lateral jsonb_array_elements(block_item.block -> 'questions') as question_item(question)
  )
  insert into public.questions (
    questionnaire_id,
    block_id,
    position,
    block_position,
    text,
    scale_min,
    scale_max
  )
  select
    p_questionnaire_id,
    lpad(parsed_questions.block_position::text, 2, '0'),
    ((parsed_questions.block_position - 1) * 4) + parsed_questions.question_block_position,
    parsed_questions.question_block_position,
    parsed_questions.text,
    0,
    2
  from parsed_questions
  order by parsed_questions.block_position, parsed_questions.question_block_position;

  return query
  select
    questionnaires.id,
    questionnaires.version,
    questionnaires.title,
    questionnaires.is_active
  from public.questionnaires
  where questionnaires.id = p_questionnaire_id;
end;
$$;

create or replace function public.activate_questionnaire_version(
  p_questionnaire_id text
)
returns table (
  id text,
  version text,
  title text,
  is_active boolean
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  block_count integer;
  question_count integer;
  invalid_block_count integer;
begin
  if not exists (
    select 1
    from public.questionnaires
    where questionnaires.id = p_questionnaire_id
  ) then
    raise exception 'Questionnaire not found'
      using errcode = 'P0002';
  end if;

  select count(*)
  into block_count
  from public.question_blocks
  where question_blocks.questionnaire_id = p_questionnaire_id;

  select count(*)
  into question_count
  from public.questions
  where questions.questionnaire_id = p_questionnaire_id
    and questions.scale_min = 0
    and questions.scale_max = 2;

  select count(*)
  into invalid_block_count
  from (
    select question_blocks.id
    from public.question_blocks
    left join public.questions
      on questions.questionnaire_id = question_blocks.questionnaire_id
     and questions.block_id = question_blocks.id
    where question_blocks.questionnaire_id = p_questionnaire_id
    group by question_blocks.id
    having count(questions.id) <> 4
  ) invalid_blocks;

  if block_count <> 5 or question_count <> 20 or invalid_block_count <> 0 then
    raise exception 'Questionnaire version is not complete'
      using errcode = '23514';
  end if;

  update public.questionnaires
  set is_active = false
  where questionnaires.is_active = true
    and questionnaires.id <> p_questionnaire_id;

  update public.questionnaires
  set is_active = true
  where questionnaires.id = p_questionnaire_id;

  return query
  select
    questionnaires.id,
    questionnaires.version,
    questionnaires.title,
    questionnaires.is_active
  from public.questionnaires
  where questionnaires.id = p_questionnaire_id;
end;
$$;

comment on function public.bootstrap_first_admin(uuid) is
  'Server-only bootstrap that makes the first authenticated XTEC admin when admin_users is empty.';
comment on function public.create_questionnaire_draft(text, text) is
  'Server-only creation of an inactive questionnaire draft.';
comment on function public.copy_questionnaire_version(text, text, text) is
  'Server-only copy of a questionnaire version into a new inactive version.';
comment on function public.replace_questionnaire_content(text, text, jsonb) is
  'Server-only replacement of questionnaire blocks and questions before submissions exist.';
comment on function public.activate_questionnaire_version(text) is
  'Server-only activation of one complete questionnaire version without touching existing spaces.';

revoke all on function public.bootstrap_first_admin(uuid) from public;
revoke all on function public.bootstrap_first_admin(uuid) from anon;
revoke all on function public.bootstrap_first_admin(uuid) from authenticated;
grant execute on function public.bootstrap_first_admin(uuid) to service_role;

revoke all on function public.create_questionnaire_draft(text, text) from public;
revoke all on function public.create_questionnaire_draft(text, text) from anon;
revoke all on function public.create_questionnaire_draft(text, text) from authenticated;
grant execute on function public.create_questionnaire_draft(text, text) to service_role;

revoke all on function public.copy_questionnaire_version(text, text, text) from public;
revoke all on function public.copy_questionnaire_version(text, text, text) from anon;
revoke all on function public.copy_questionnaire_version(text, text, text) from authenticated;
grant execute on function public.copy_questionnaire_version(text, text, text) to service_role;

revoke all on function public.replace_questionnaire_content(text, text, jsonb) from public;
revoke all on function public.replace_questionnaire_content(text, text, jsonb) from anon;
revoke all on function public.replace_questionnaire_content(text, text, jsonb) from authenticated;
grant execute on function public.replace_questionnaire_content(text, text, jsonb) to service_role;

revoke all on function public.activate_questionnaire_version(text) from public;
revoke all on function public.activate_questionnaire_version(text) from anon;
revoke all on function public.activate_questionnaire_version(text) from authenticated;
grant execute on function public.activate_questionnaire_version(text) to service_role;
