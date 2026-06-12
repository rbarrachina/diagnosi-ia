-- Allow questionnaire drafts without submissions to be saved while incomplete.
-- Activation still requires exactly 5 blocks and 20 questions.

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

comment on function public.replace_questionnaire_content(text, text, jsonb) is
  'Server-only replacement of questionnaire blocks and questions before submissions exist; drafts may be partial until activation.';
