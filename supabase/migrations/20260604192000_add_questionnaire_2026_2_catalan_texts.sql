-- Add a corrected Catalan questionnaire version without mutating 2026.1,
-- which may already have submissions.

begin;

update public.questionnaires
set is_active = false
where version = '2026.1';

insert into public.questionnaires (id, version, title, is_active)
values ('002', '2026.2', 'Diagnosi IA - Qüestionari 2026.2', true)
on conflict (version) do update
set
  title = excluded.title,
  is_active = excluded.is_active
where not exists (
  select 1
  from public.submissions
  where submissions.questionnaire_id = public.questionnaires.id
);

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
where not exists (
  select 1
  from public.submissions
  where submissions.questionnaire_id = public.question_blocks.questionnaire_id
);

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
where not exists (
  select 1
  from public.submissions
  where submissions.questionnaire_id = public.questions.questionnaire_id
);

commit;
