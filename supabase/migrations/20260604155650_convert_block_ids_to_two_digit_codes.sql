-- Convert question block identifiers from UUIDs to two-digit codes.
-- Block ids are scoped by questionnaire_id, so every questionnaire can use
-- 01, 02, 03, 04 and 05.

begin;

create temp table block_id_migration_map on commit drop as
select
  id as old_id,
  questionnaire_id,
  lpad(row_number() over (partition by questionnaire_id order by position, id)::text, 2, '0') as new_id
from public.question_blocks;

do $$
begin
  if exists (
    select 1
    from block_id_migration_map
    group by questionnaire_id
    having count(*) > 99
  ) then
    raise exception 'Cannot convert more than 99 blocks per questionnaire to two-digit ids.'
      using errcode = '22023';
  end if;
end $$;

create function pg_temp.map_block_id(value uuid)
returns text
language sql
stable
as $$
  select new_id
  from block_id_migration_map
  where old_id = value;
$$;

alter table public.questions
  drop constraint if exists questions_block_questionnaire_fk,
  drop constraint if exists questions_block_position_key;

alter table public.question_blocks
  drop constraint if exists question_blocks_id_questionnaire_unique,
  drop constraint if exists question_blocks_pkey;

alter table public.question_blocks
  alter column id type text using pg_temp.map_block_id(id);

alter table public.questions
  alter column block_id type text using pg_temp.map_block_id(block_id);

alter table public.question_blocks
  add constraint question_blocks_id_format_check check (id ~ '^[0-9]{2}$'),
  add constraint question_blocks_pkey primary key (id, questionnaire_id);

alter table public.questions
  add constraint questions_block_position_key unique (questionnaire_id, block_id, block_position),
  add constraint questions_block_questionnaire_fk
  foreign key (block_id, questionnaire_id)
  references public.question_blocks(id, questionnaire_id)
  on delete restrict;

commit;
