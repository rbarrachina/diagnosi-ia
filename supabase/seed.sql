-- Diagnosi IA questionnaire seed.
-- Version 2026.2: 20 compulsory closed questions, 5 blocks, 4 questions per block.

insert into public.questionnaires (id, version, title, is_active)
values (
  '002',
  '2026.2',
  'Diagnosi IA - Qüestionari 2026.2',
  true
)
on conflict (version) do update
set
  title = excluded.title,
  is_active = excluded.is_active
where public.questionnaires.title is distinct from excluded.title
   or public.questionnaires.is_active is distinct from excluded.is_active;

with questionnaire as (
  select id
  from public.questionnaires
  where version = '2026.2'
),
block_seed(id, position, title) as (
  values
    ('01', 1, 'Alfabetització i ús crític de la IA'),
    ('02', 2, 'Ús de la IA en la pràctica docent'),
    ('03', 3, 'Ús de la IA amb l''alumnat'),
    ('04', 4, 'Avaluació i retroacció'),
    ('05', 5, 'Dades, seguretat i criteris compartits')
)
insert into public.question_blocks (id, questionnaire_id, position, title)
select
  block_seed.id,
  questionnaire.id,
  block_seed.position,
  block_seed.title
from questionnaire
cross join block_seed
on conflict (questionnaire_id, position) do update
set title = excluded.title
where public.question_blocks.title is distinct from excluded.title;

with questionnaire as (
  select id
  from public.questionnaires
  where version = '2026.2'
),
question_seed(position, block_position, block_number, text) as (
  values
    (1, 1, 1, 'Identifico oportunitats i limitacions de la IA en contextos educatius.'),
    (2, 2, 1, 'Contrasto les respostes generades per IA abans d''utilitzar-les.'),
    (3, 3, 1, 'Explico que la IA pot contenir errors, biaixos o informació inventada.'),
    (4, 4, 1, 'Conec criteris bàsics d''ús ètic i responsable de la IA.'),

    (5, 1, 2, 'Utilitzo IA per preparar materials didàctics.'),
    (6, 2, 2, 'Utilitzo IA per adaptar activitats a necessitats diverses de l''alumnat.'),
    (7, 3, 2, 'Utilitzo IA per generar idees, exemples o seqüències d''aprenentatge.'),
    (8, 4, 2, 'Reviso i ajusto les propostes generades per IA abans de portar-les a l''aula.'),

    (9, 1, 3, 'Proposo activitats on l''alumnat utilitza IA amb un objectiu d''aprenentatge clar.'),
    (10, 2, 3, 'Ajudo l''alumnat a formular bones instruccions i revisar resultats de la IA.'),
    (11, 3, 3, 'Promoc que l''alumnat declari quan ha utilitzat IA en una tasca.'),
    (12, 4, 3, 'Treballo amb l''alumnat els límits de la IA i la importància del criteri propi.'),

    (13, 1, 4, 'Utilitzo IA per preparar rúbriques o criteris d''avaluació.'),
    (14, 2, 4, 'Utilitzo IA per generar exemples de retroacció que després reviso.'),
    (15, 3, 4, 'Integro la IA per detectar patrons generals de dificultats d''aprenentatge.'),
    (16, 4, 4, 'Mantinc la decisió docent final en qualsevol procés d''avaluació assistit per IA.'),

    (17, 1, 5, 'Evito introduir dades personals o sensibles en eines d''IA.'),
    (18, 2, 5, 'Conec criteris bàsics de protecció de dades aplicats a la IA.'),
    (19, 3, 5, 'L''equip educatiu disposa de criteris compartits sobre quan i com utilitzar IA.'),
    (20, 4, 5, 'Conversem com a equip docent sobre riscos, oportunitats i bones pràctiques d''IA.')
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
  questionnaire.id,
  question_blocks.id,
  question_seed.position,
  question_seed.block_position,
  question_seed.text,
  0,
  2
from questionnaire
join question_seed on true
join public.question_blocks
  on question_blocks.questionnaire_id = questionnaire.id
 and question_blocks.position = question_seed.block_number
on conflict (questionnaire_id, position) do update
set
  block_id = excluded.block_id,
  block_position = excluded.block_position,
  text = excluded.text,
  scale_min = excluded.scale_min,
  scale_max = excluded.scale_max
where public.questions.block_id is distinct from excluded.block_id
   or public.questions.block_position is distinct from excluded.block_position
   or public.questions.text is distinct from excluded.text
   or public.questions.scale_min is distinct from excluded.scale_min
   or public.questions.scale_max is distinct from excluded.scale_max;

do $$
declare
  target_questionnaire_id text;
  block_count integer;
  question_count integer;
  invalid_block_count integer;
begin
  select id into target_questionnaire_id
  from public.questionnaires
  where version = '2026.2';

  select count(*) into block_count
  from public.question_blocks
  where questionnaire_id = target_questionnaire_id;

  select count(*) into question_count
  from public.questions
  where questionnaire_id = target_questionnaire_id;

  select count(*) into invalid_block_count
  from (
    select block_id
    from public.questions
    where questionnaire_id = target_questionnaire_id
    group by block_id
    having count(*) <> 4
  ) invalid_blocks;

  if block_count <> 5 or question_count <> 20 or invalid_block_count <> 0 then
    raise exception
      'Invalid questionnaire seed shape for 2026.2: blocks %, questions %, invalid blocks %',
      block_count,
      question_count,
      invalid_block_count;
  end if;
end $$;
