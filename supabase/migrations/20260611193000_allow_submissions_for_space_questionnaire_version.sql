-- Allow existing diagnostic spaces to keep accepting submissions for their
-- assigned questionnaire version after another version becomes active.
-- The submitted version must still match the version linked to the space.

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

  answer_count := jsonb_array_length(p_answers);

  if answer_count <> 20 then
    raise exception 'Expected exactly 20 answers'
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

  if matched_question_count <> 20 then
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

comment on function public.create_submission_with_answers(text, text, jsonb) is
  'Server-only RPC that validates and inserts one anonymous complete submission for the questionnaire version assigned to the diagnostic space, capped at 300 submissions per space.';

revoke all on function public.create_submission_with_answers(text, text, jsonb) from public;
revoke all on function public.create_submission_with_answers(text, text, jsonb) from anon;
revoke all on function public.create_submission_with_answers(text, text, jsonb) from authenticated;
grant execute on function public.create_submission_with_answers(text, text, jsonb) to service_role;
