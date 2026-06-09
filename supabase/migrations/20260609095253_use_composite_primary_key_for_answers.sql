-- Use the natural answer key and remove the unused surrogate UUID.
-- One answer is uniquely identified by its anonymous submission and question.

do $$
begin
  if exists (
    select 1
    from public.answers
    group by submission_id, question_id
    having count(*) > 1
  ) then
    raise exception 'Cannot change answers primary key while duplicate submission/question rows exist.'
      using errcode = '23505';
  end if;
end $$;

alter table public.answers
  drop constraint answers_pkey,
  drop constraint answers_submission_question_key,
  add constraint answers_pkey primary key (submission_id, question_id),
  drop column id;
