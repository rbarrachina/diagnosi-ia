-- Remove the obsolete UUID default from two-digit text block identifiers.

alter table public.question_blocks
  alter column id drop default;
