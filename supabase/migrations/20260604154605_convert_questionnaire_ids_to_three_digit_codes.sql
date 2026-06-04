-- Convert questionnaire identifiers from UUIDs to three-digit codes.
-- The initial questionnaire becomes 001. Related tables keep their rows and
-- foreign-key protections.

begin;

create temp table questionnaire_id_migration_map on commit drop as
select
  id as old_id,
  lpad(row_number() over (order by created_at, version)::text, 3, '0') as new_id
from public.questionnaires;

do $$
begin
  if (select count(*) from questionnaire_id_migration_map) > 999 then
    raise exception 'Cannot convert more than 999 questionnaires to three-digit ids.'
      using errcode = '22023';
  end if;
end $$;

create function pg_temp.map_questionnaire_id(value uuid)
returns text
language sql
stable
as $$
  select new_id
  from questionnaire_id_migration_map
  where old_id = value;
$$;

drop function if exists public.create_submission_with_answers(text, text, jsonb);

drop trigger if exists questionnaires_prevent_identity_mutation on public.questionnaires;
drop trigger if exists question_blocks_prevent_content_mutation on public.question_blocks;
drop trigger if exists questions_prevent_content_mutation on public.questions;

drop function if exists private.prevent_questionnaire_identity_mutation();
drop function if exists private.prevent_questionnaire_content_mutation();
drop function if exists private.questionnaire_has_submissions(uuid);

alter table public.answers
  drop constraint if exists answers_submission_questionnaire_fk,
  drop constraint if exists answers_question_questionnaire_fk;

alter table public.submissions
  drop constraint if exists submissions_space_questionnaire_fk;

alter table public.questions
  drop constraint if exists questions_block_questionnaire_fk,
  drop constraint if exists questions_questionnaire_id_fkey;

alter table public.question_blocks
  drop constraint if exists question_blocks_questionnaire_id_fkey;

alter table public.diagnostic_spaces
  drop constraint if exists diagnostic_spaces_questionnaire_id_fkey;

alter table public.questionnaires
  alter column id drop default,
  alter column id type text using pg_temp.map_questionnaire_id(id);

alter table public.question_blocks
  alter column questionnaire_id type text using pg_temp.map_questionnaire_id(questionnaire_id);

alter table public.questions
  alter column questionnaire_id type text using pg_temp.map_questionnaire_id(questionnaire_id);

alter table public.diagnostic_spaces
  alter column questionnaire_id type text using pg_temp.map_questionnaire_id(questionnaire_id);

alter table public.submissions
  alter column questionnaire_id type text using pg_temp.map_questionnaire_id(questionnaire_id);

alter table public.answers
  alter column questionnaire_id type text using pg_temp.map_questionnaire_id(questionnaire_id);

alter table public.questionnaires
  add constraint questionnaires_id_format_check check (id ~ '^[0-9]{3}$');

alter table public.question_blocks
  add constraint question_blocks_questionnaire_id_fkey
  foreign key (questionnaire_id)
  references public.questionnaires(id)
  on delete restrict;

alter table public.questions
  add constraint questions_questionnaire_id_fkey
  foreign key (questionnaire_id)
  references public.questionnaires(id)
  on delete restrict,
  add constraint questions_block_questionnaire_fk
  foreign key (block_id, questionnaire_id)
  references public.question_blocks(id, questionnaire_id)
  on delete restrict;

alter table public.diagnostic_spaces
  add constraint diagnostic_spaces_questionnaire_id_fkey
  foreign key (questionnaire_id)
  references public.questionnaires(id)
  on delete restrict;

alter table public.submissions
  add constraint submissions_space_questionnaire_fk
  foreign key (diagnostic_space_id, questionnaire_id)
  references public.diagnostic_spaces(id, questionnaire_id)
  on delete restrict;

alter table public.answers
  add constraint answers_submission_questionnaire_fk
  foreign key (submission_id, questionnaire_id)
  references public.submissions(id, questionnaire_id)
  on delete cascade,
  add constraint answers_question_questionnaire_fk
  foreign key (question_id, questionnaire_id)
  references public.questions(id, questionnaire_id)
  on delete restrict;

create or replace function private.questionnaire_has_submissions(target_questionnaire_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.submissions
    where questionnaire_id = target_questionnaire_id
  );
$$;

create or replace function private.prevent_questionnaire_content_mutation()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  target_questionnaire_id text;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    target_questionnaire_id := new.questionnaire_id;
  else
    target_questionnaire_id := old.questionnaire_id;
  end if;

  if private.questionnaire_has_submissions(target_questionnaire_id) then
    raise exception
      'Questionnaire content cannot be changed after submissions exist. Create a new questionnaire version instead.'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.prevent_questionnaire_identity_mutation()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    if private.questionnaire_has_submissions(old.id) then
      raise exception
        'Questionnaire identity cannot be changed after submissions exist. Create a new questionnaire version instead.'
        using errcode = '23514';
    end if;

    return old;
  end if;

  if private.questionnaire_has_submissions(old.id)
    and (
      new.version is distinct from old.version
      or new.title is distinct from old.title
    )
  then
    raise exception
      'Questionnaire identity cannot be changed after submissions exist. Create a new questionnaire version instead.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger questionnaires_prevent_identity_mutation
before update or delete on public.questionnaires
for each row
execute function private.prevent_questionnaire_identity_mutation();

create trigger question_blocks_prevent_content_mutation
before insert or update or delete on public.question_blocks
for each row
execute function private.prevent_questionnaire_content_mutation();

create trigger questions_prevent_content_mutation
before insert or update or delete on public.questions
for each row
execute function private.prevent_questionnaire_content_mutation();

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
    and questionnaires.is_active = true;

  if target_space_id is null or target_questionnaire_id is null then
    raise exception 'Diagnostic space not found or inactive'
      using errcode = '22023';
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
  'Server-only RPC that validates and inserts one anonymous complete submission atomically.';

revoke all on function public.create_submission_with_answers(text, text, jsonb) from public;
revoke all on function public.create_submission_with_answers(text, text, jsonb) from anon;
revoke all on function public.create_submission_with_answers(text, text, jsonb) from authenticated;
grant execute on function public.create_submission_with_answers(text, text, jsonb) to service_role;

commit;
