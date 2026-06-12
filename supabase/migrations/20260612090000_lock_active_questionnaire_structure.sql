-- Active questionnaire versions can only receive text/title corrections.
-- Structural changes must be made in a new inactive version.

alter function public.replace_questionnaire_content(text, text, jsonb, boolean)
  set schema private;

alter function private.replace_questionnaire_content(text, text, jsonb, boolean)
  rename to replace_questionnaire_content_without_active_text_lock;

revoke all on function private.replace_questionnaire_content_without_active_text_lock(text, text, jsonb, boolean) from anon;
revoke all on function private.replace_questionnaire_content_without_active_text_lock(text, text, jsonb, boolean) from authenticated;
grant execute on function private.replace_questionnaire_content_without_active_text_lock(text, text, jsonb, boolean) to service_role;

create or replace function public.replace_questionnaire_content(
  p_questionnaire_id text,
  p_title text,
  p_blocks jsonb,
  p_confirm_assigned_edit boolean
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
  invalid_count integer;
  assigned_space_count integer;
  existing_response_count integer;
  is_active_questionnaire boolean;
begin
  select questionnaires.is_active
  into is_active_questionnaire
  from public.questionnaires
  where questionnaires.id = p_questionnaire_id;

  if is_active_questionnaire is null then
    raise exception 'Questionnaire not found'
      using errcode = 'P0002';
  end if;

  assigned_space_count := private.questionnaire_space_count(p_questionnaire_id);
  existing_response_count := private.questionnaire_submission_count(p_questionnaire_id);

  if assigned_space_count <> 0 and p_confirm_assigned_edit is not true then
    raise exception 'Confirmed edit is required for questionnaires assigned to spaces'
      using errcode = '23514';
  end if;

  if not is_active_questionnaire and existing_response_count = 0 then
    return query
    select *
    from private.replace_questionnaire_content_without_active_text_lock(
      p_questionnaire_id,
      p_title,
      p_blocks,
      p_confirm_assigned_edit
    );
    return;
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Questionnaire title is required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_blocks) is distinct from 'array'
    or jsonb_array_length(p_blocks) > 10
  then
    raise exception 'Expected at most 10 question blocks'
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
      where parsed_blocks.position not between 1 and 10
        or btrim(coalesce(parsed_blocks.title, '')) = ''
        or jsonb_typeof(parsed_blocks.questions) is distinct from 'array'
        or jsonb_array_length(parsed_blocks.questions) > 10
    )
  into block_count, question_count, invalid_count
  from parsed_blocks;

  if block_count > 10 or question_count > 100 or invalid_count <> 0 then
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
  into invalid_count
  from parsed_questions
  where question_block_position not between 1 and 10
     or btrim(coalesce(text, '')) = '';

  if invalid_count <> 0 then
    raise exception 'Invalid questionnaire question shape'
      using errcode = '22023';
  end if;

  with block_positions as (
    select (block_item.block ->> 'position')::integer as position
    from jsonb_array_elements(p_blocks) as block_item(block)
  )
  select count(*) - count(distinct position)
  into invalid_count
  from block_positions;

  if invalid_count <> 0 then
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
  into invalid_count
  from (
    select block_position
    from parsed_questions
    group by block_position
    having count(*) > 10
       or count(*) <> count(distinct question_block_position)
  ) invalid_blocks;

  if invalid_count <> 0 then
    raise exception 'Invalid question positions inside blocks'
      using errcode = '22023';
  end if;

  with parsed_blocks as (
    select (block_item.block ->> 'position')::integer as position
    from jsonb_array_elements(p_blocks) as block_item(block)
  ),
  existing_blocks as (
    select question_blocks.position
    from public.question_blocks
    where question_blocks.questionnaire_id = p_questionnaire_id
  ),
  block_differences as (
    (select position from parsed_blocks except select position from existing_blocks)
    union all
    (select position from existing_blocks except select position from parsed_blocks)
  )
  select count(*)
  into invalid_count
  from block_differences;

  if invalid_count <> 0 then
    raise exception 'Questionnaire structure cannot be changed after responses or activation'
      using errcode = '23514';
  end if;

  with parsed_questions as (
    select
      (block_item.block ->> 'position')::integer as block_position,
      (question_item.question ->> 'blockPosition')::integer as question_block_position
    from jsonb_array_elements(p_blocks) as block_item(block)
    cross join lateral jsonb_array_elements(block_item.block -> 'questions') as question_item(question)
  ),
  existing_questions as (
    select
      question_blocks.position as block_position,
      questions.block_position as question_block_position
    from public.questions
    join public.question_blocks
      on question_blocks.questionnaire_id = questions.questionnaire_id
     and question_blocks.id = questions.block_id
    where questions.questionnaire_id = p_questionnaire_id
  ),
  question_differences as (
    (
      select block_position, question_block_position
      from parsed_questions
      except
      select block_position, question_block_position
      from existing_questions
    )
    union all
    (
      select block_position, question_block_position
      from existing_questions
      except
      select block_position, question_block_position
      from parsed_questions
    )
  )
  select count(*)
  into invalid_count
  from question_differences;

  if invalid_count <> 0 then
    raise exception 'Questionnaire structure cannot be changed after responses or activation'
      using errcode = '23514';
  end if;

  update public.questionnaires
  set title = btrim(p_title)
  where questionnaires.id = p_questionnaire_id;

  with parsed_blocks as (
    select
      (block_item.block ->> 'position')::integer as position,
      btrim(block_item.block ->> 'title') as title
    from jsonb_array_elements(p_blocks) as block_item(block)
  )
  update public.question_blocks
  set title = parsed_blocks.title
  from parsed_blocks
  where question_blocks.questionnaire_id = p_questionnaire_id
    and question_blocks.position = parsed_blocks.position;

  with parsed_questions as (
    select
      (block_item.block ->> 'position')::integer as block_position,
      (question_item.question ->> 'blockPosition')::integer as question_block_position,
      btrim(question_item.question ->> 'text') as text
    from jsonb_array_elements(p_blocks) as block_item(block)
    cross join lateral jsonb_array_elements(block_item.block -> 'questions') as question_item(question)
  )
  update public.questions
  set text = parsed_questions.text
  from parsed_questions
  join public.question_blocks
    on question_blocks.questionnaire_id = p_questionnaire_id
   and question_blocks.position = parsed_questions.block_position
  where questions.questionnaire_id = p_questionnaire_id
    and questions.block_id = question_blocks.id
    and questions.block_position = parsed_questions.question_block_position;

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
language sql
security invoker
set search_path = public, pg_temp
as $$
  select *
  from public.replace_questionnaire_content(
    p_questionnaire_id,
    p_title,
    p_blocks,
    false
  );
$$;

revoke all on function public.replace_questionnaire_content(text, text, jsonb, boolean) from anon;
revoke all on function public.replace_questionnaire_content(text, text, jsonb, boolean) from authenticated;
grant execute on function public.replace_questionnaire_content(text, text, jsonb, boolean) to service_role;

comment on function public.replace_questionnaire_content(text, text, jsonb, boolean) is
  'Server-only replacement or correction of questionnaire content. Active versions and versions with responses preserve structure.';
