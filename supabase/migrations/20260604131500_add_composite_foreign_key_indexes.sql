-- Cover composite foreign keys reported by Supabase performance advisors.

create index questions_block_questionnaire_fk_idx
  on public.questions(block_id, questionnaire_id);

create index submissions_space_questionnaire_fk_idx
  on public.submissions(diagnostic_space_id, questionnaire_id);

create index answers_submission_questionnaire_fk_idx
  on public.answers(submission_id, questionnaire_id);

create index answers_question_questionnaire_fk_idx
  on public.answers(question_id, questionnaire_id);
