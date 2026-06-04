-- Diagnosi IA initial database schema.
-- This migration intentionally stores anonymous diagnostic spaces only.
-- Do not add centre names, teacher names, emails, IPs, user agents, or open answers.

create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),

  constraint questionnaires_version_key unique (version),
  constraint questionnaires_version_format_check check (version ~ '^[0-9]{4}\.[0-9]+$'),
  constraint questionnaires_title_not_blank_check check (btrim(title) <> '')
);

comment on table public.questionnaires is
  'Versioned fixed questionnaires. Versions with submissions must not be edited in place.';

create table public.question_blocks (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete restrict,
  position integer not null,
  title text not null,

  constraint question_blocks_id_questionnaire_unique unique (id, questionnaire_id),
  constraint question_blocks_questionnaire_position_key unique (questionnaire_id, position),
  constraint question_blocks_position_check check (position between 1 and 5),
  constraint question_blocks_title_not_blank_check check (btrim(title) <> '')
);

comment on table public.question_blocks is
  'Question blocks for a questionnaire version. Contains no centre or personal data.';

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete restrict,
  block_id uuid not null,
  position integer not null,
  block_position integer not null,
  text text not null,
  scale_min smallint not null default 0,
  scale_max smallint not null default 2,

  constraint questions_id_questionnaire_unique unique (id, questionnaire_id),
  constraint questions_questionnaire_position_key unique (questionnaire_id, position),
  constraint questions_block_position_key unique (block_id, block_position),
  constraint questions_block_questionnaire_fk
    foreign key (block_id, questionnaire_id)
    references public.question_blocks(id, questionnaire_id)
    on delete restrict,
  constraint questions_position_check check (position between 1 and 20),
  constraint questions_block_position_check check (block_position between 1 and 4),
  constraint questions_text_not_blank_check check (btrim(text) <> ''),
  constraint questions_scale_min_check check (scale_min = 0),
  constraint questions_scale_max_check check (scale_max = 2)
);

comment on table public.questions is
  'Closed questionnaire questions. No open answer fields are allowed.';

create table public.diagnostic_spaces (
  id uuid primary key default gen_random_uuid(),
  public_code text not null,
  private_token_hmac text not null,
  questionnaire_id uuid not null references public.questionnaires(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  closed_at timestamptz,

  constraint diagnostic_spaces_id_questionnaire_unique unique (id, questionnaire_id),
  constraint diagnostic_spaces_public_code_key unique (public_code),
  constraint diagnostic_spaces_public_code_format_check
    check (public_code ~ '^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$'),
  constraint diagnostic_spaces_private_token_hmac_length_check
    check (char_length(private_token_hmac) >= 43),
  constraint diagnostic_spaces_closed_at_check
    check (closed_at is null or closed_at >= created_at)
);

comment on table public.diagnostic_spaces is
  'Anonymous diagnostic spaces. Never add centre name, centre code, responsible person, email, IP, or device fields.';
comment on column public.diagnostic_spaces.private_token_hmac is
  'Server-side HMAC or hash of the private token. The plaintext private token must never be stored.';

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  diagnostic_space_id uuid not null,
  questionnaire_id uuid not null,
  created_at timestamptz not null default now(),

  constraint submissions_id_questionnaire_unique unique (id, questionnaire_id),
  constraint submissions_space_questionnaire_fk
    foreign key (diagnostic_space_id, questionnaire_id)
    references public.diagnostic_spaces(id, questionnaire_id)
    on delete restrict
);

comment on table public.submissions is
  'Anonymous submissions. No teacher, account, email, IP, user agent, or device fields are permitted.';

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  questionnaire_id uuid not null,
  question_id uuid not null,
  value smallint not null,

  constraint answers_submission_question_key unique (submission_id, question_id),
  constraint answers_submission_questionnaire_fk
    foreign key (submission_id, questionnaire_id)
    references public.submissions(id, questionnaire_id)
    on delete cascade,
  constraint answers_question_questionnaire_fk
    foreign key (question_id, questionnaire_id)
    references public.questions(id, questionnaire_id)
    on delete restrict,
  constraint answers_value_check check (value in (0, 1, 2))
);

comment on table public.answers is
  'Closed answers only. Individual rows must never be exposed to the browser, dashboard, exports, or PDF.';

create index question_blocks_questionnaire_id_idx on public.question_blocks(questionnaire_id);
create index questions_questionnaire_id_idx on public.questions(questionnaire_id);
create index questions_block_id_idx on public.questions(block_id);
create index diagnostic_spaces_questionnaire_id_idx on public.diagnostic_spaces(questionnaire_id);
create index submissions_diagnostic_space_id_idx on public.submissions(diagnostic_space_id);
create index submissions_questionnaire_id_idx on public.submissions(questionnaire_id);
create index answers_submission_id_idx on public.answers(submission_id);
create index answers_question_id_idx on public.answers(question_id);
create index answers_questionnaire_id_idx on public.answers(questionnaire_id);

create or replace function private.questionnaire_has_submissions(target_questionnaire_id uuid)
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
  target_questionnaire_id uuid;
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

alter table public.questionnaires enable row level security;
alter table public.question_blocks enable row level security;
alter table public.questions enable row level security;
alter table public.diagnostic_spaces enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;

alter table public.questionnaires force row level security;
alter table public.question_blocks force row level security;
alter table public.questions force row level security;
alter table public.diagnostic_spaces force row level security;
alter table public.submissions force row level security;
alter table public.answers force row level security;

revoke all on public.questionnaires from anon, authenticated;
revoke all on public.question_blocks from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.diagnostic_spaces from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.answers from anon, authenticated;

grant select, insert, update, delete on public.questionnaires to service_role;
grant select, insert, update, delete on public.question_blocks to service_role;
grant select, insert, update, delete on public.questions to service_role;
grant select, insert, update, delete on public.diagnostic_spaces to service_role;
grant select, insert, update, delete on public.submissions to service_role;
grant select, insert, update, delete on public.answers to service_role;

-- Explicit deny policies for browser-facing roles.
-- The application server must use server-side Route Handlers or server functions.
create policy "No direct client access to questionnaires"
on public.questionnaires
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "No direct client access to question blocks"
on public.question_blocks
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "No direct client access to questions"
on public.questions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "No direct client access to diagnostic spaces"
on public.diagnostic_spaces
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "No direct client access to submissions"
on public.submissions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "No direct client access to answers"
on public.answers
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
