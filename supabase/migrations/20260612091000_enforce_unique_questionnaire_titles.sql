-- Questionnaire titles must be unique for admin readability.

create unique index if not exists questionnaires_title_unique_idx
  on public.questionnaires (lower(btrim(title)));

comment on index public.questionnaires_title_unique_idx is
  'Prevents duplicate questionnaire titles after trimming and case normalization.';
