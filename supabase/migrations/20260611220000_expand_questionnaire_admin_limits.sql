-- Expand questionnaire administration limits to 10 blocks and 10 questions per block.
-- Submissions must answer every question in the diagnostic space questionnaire version.

alter table public.question_blocks
  drop constraint if exists question_blocks_position_check;

alter table public.question_blocks
  add constraint question_blocks_position_check
  check (position between 1 and 10);

alter table public.questions
  drop constraint if exists questions_position_check;

alter table public.questions
  add constraint questions_position_check
  check (position between 1 and 100);

alter table public.questions
  drop constraint if exists questions_block_position_check;

alter table public.questions
  add constraint questions_block_position_check
  check (block_position between 1 and 10);

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
  into block_count, question_count, invalid_block_count
  from parsed_blocks;

  if block_count > 10 or question_count > 100 or invalid_block_count <> 0 then
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
  where question_block_position not between 1 and 10
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
    having count(*) > 10
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
    ((parsed_questions.block_position - 1) * 10) + parsed_questions.question_block_position,
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
    having count(questions.id) < 1
       or count(questions.id) > 10
  ) invalid_blocks;

  if block_count < 1
    or block_count > 10
    or question_count < block_count
    or question_count > 100
    or invalid_block_count <> 0
  then
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

create or replace function public.create_submission_with_answers(
  p_public_code text,
  p_questionnaire_version text,
  p_answers jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_space_id uuid;
  target_questionnaire_id text;
  target_question_count integer;
  new_submission_id uuid;
  answer_count integer;
  current_submission_count integer;
  invalid_shape_count integer;
  duplicate_question_count integer;
  matched_question_count integer;
begin
  select diagnostic_spaces.id, diagnostic_spaces.questionnaire_id
  into target_space_id, target_questionnaire_id
  from public.diagnostic_spaces
  join public.questionnaires
    on questionnaires.id = diagnostic_spaces.questionnaire_id
  where diagnostic_spaces.public_code = p_public_code
    and diagnostic_spaces.is_active = true
    and questionnaires.version = p_questionnaire_version
  for update of diagnostic_spaces;

  if target_space_id is null or target_questionnaire_id is null then
    raise exception 'Diagnostic space not found or inactive'
      using errcode = '22023';
  end if;

  select count(*)
  into current_submission_count
  from public.submissions
  where submissions.diagnostic_space_id = target_space_id;

  if current_submission_count >= 300 then
    raise exception 'Diagnostic space submission limit reached'
      using errcode = '23514';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Answers must be a JSON array'
      using errcode = '22023';
  end if;

  select count(*)
  into target_question_count
  from public.questions
  where questions.questionnaire_id = target_questionnaire_id;

  if target_question_count < 1 or target_question_count > 100 then
    raise exception 'Questionnaire version is not complete'
      using errcode = '23514';
  end if;

  answer_count := jsonb_array_length(p_answers);

  if answer_count <> target_question_count then
    raise exception 'Expected answers for every questionnaire question'
      using errcode = '22023';
  end if;

  select count(*)
  into invalid_shape_count
  from jsonb_array_elements(p_answers) as answer_item(answer)
  where jsonb_typeof(answer_item.answer) is distinct from 'object'
    or not (answer_item.answer ? 'questionId')
    or not (answer_item.answer ? 'value')
    or exists (
      select 1
      from jsonb_object_keys(answer_item.answer) as answer_key(key)
      where answer_key.key not in ('questionId', 'value')
    )
    or jsonb_typeof(answer_item.answer -> 'questionId') is distinct from 'string'
    or (answer_item.answer ->> 'questionId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or jsonb_typeof(answer_item.answer -> 'value') is distinct from 'number'
    or (answer_item.answer ->> 'value') not in ('0', '1', '2');

  if invalid_shape_count <> 0 then
    raise exception 'Invalid answer payload'
      using errcode = '22023';
  end if;

  select count(*) - count(distinct answer_item.answer ->> 'questionId')
  into duplicate_question_count
  from jsonb_array_elements(p_answers) as answer_item(answer);

  if duplicate_question_count <> 0 then
    raise exception 'Duplicate question answers'
      using errcode = '22023';
  end if;

  with parsed_answers as (
    select
      (answer_item.answer ->> 'questionId')::uuid as question_id,
      (answer_item.answer ->> 'value')::smallint as value
    from jsonb_array_elements(p_answers) as answer_item(answer)
  )
  select count(*)
  into matched_question_count
  from parsed_answers
  join public.questions
    on questions.id = parsed_answers.question_id
   and questions.questionnaire_id = target_questionnaire_id;

  if matched_question_count <> target_question_count then
    raise exception 'Answers do not match questionnaire questions'
      using errcode = '22023';
  end if;

  insert into public.submissions (diagnostic_space_id, questionnaire_id)
  values (target_space_id, target_questionnaire_id)
  returning id into new_submission_id;

  with parsed_answers as (
    select
      (answer_item.answer ->> 'questionId')::uuid as question_id,
      (answer_item.answer ->> 'value')::smallint as value
    from jsonb_array_elements(p_answers) as answer_item(answer)
  )
  insert into public.answers (
    submission_id,
    questionnaire_id,
    question_id,
    value
  )
  select
    new_submission_id,
    target_questionnaire_id,
    parsed_answers.question_id,
    parsed_answers.value
  from parsed_answers;

  return new_submission_id;
end;
$$;

comment on function public.replace_questionnaire_content(text, text, jsonb) is
  'Server-only replacement of questionnaire blocks and questions before submissions exist; drafts allow up to 10 blocks and 10 questions per block.';
comment on function public.activate_questionnaire_version(text) is
  'Server-only activation of one non-empty questionnaire version with up to 10 blocks and 10 questions per block, without touching existing spaces.';
comment on function public.create_submission_with_answers(text, text, jsonb) is
  'Server-only RPC that validates and inserts one anonymous complete submission for all questions in the diagnostic space questionnaire version, capped at 300 submissions per space.';
