# Supabase setup

Aquest document descriu les accions manuals necessaries per aplicar la base de dades a Supabase i configurar la fase 3 de creació d'espais i formulari.

## Abast de la fase 2

Implementat:

- Esquema PostgreSQL.
- Migracio inicial.
- Seed del qüestionari actiu.
- Restriccions d'integritat.
- Row Level Security a totes les taules.
- Revocacio d'accés directe a `anon` i `authenticated`.
- Politiques RLS de denegació explícita per a clients.

No implementat encara:

- Resultats de conjunt.
- PDF.

## Fitxers

- `supabase/migrations/20260604130000_initial_schema.sql`
- `supabase/migrations/20260604131500_add_composite_foreign_key_indexes.sql`
- `supabase/migrations/20260604143000_create_submission_rpc.sql`
- `supabase/migrations/20260610140500_limit_submissions_per_space.sql`
- `supabase/migrations/20260611183000_add_admin_users.sql`
- `supabase/migrations/20260611184500_add_admin_read_rls_policies.sql`
- `supabase/migrations/20260611190000_add_admin_service_rpcs.sql`
- `supabase/migrations/20260611193000_allow_submissions_for_space_questionnaire_version.sql`
- `supabase/migrations/20260611203000_grant_private_schema_usage_to_service_role.sql`
- `supabase/seed.sql`

## Projecte Supabase creat

El projecte nou de Supabase ja s'ha creat amb el connector:

- Nom: `diagnosi-ia`
- Project ref: `toaniwueiumbgvndfhgh`
- URL: `https://toaniwueiumbgvndfhgh.supabase.co`
- Regio: `eu-west-1`

Migracions aplicades:

- `initial_schema`
- `seed_questionnaire_2026_1`
- `add_composite_foreign_key_indexes`
- `create_submission_rpc`
- `limit_submissions_per_space`

## Aplicació manual a Supabase

Opcio recomanada amb Supabase CLI:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase db seed
```

En aquesta màquina el CLI `supabase` no està instal·lat. Cal instal·lar-lo localment si vols aquest flux.

Opcio amb SQL Editor del dashboard:

1. Obre el projecte a Supabase.
2. Ves a `SQL Editor`.
3. Executa tot el contingut de `supabase/migrations/20260604130000_initial_schema.sql`.
4. Executa tot el contingut de `supabase/seed.sql`.
5. Executa tot el contingut de `supabase/migrations/20260604131500_add_composite_foreign_key_indexes.sql`.
6. Executa tot el contingut de `supabase/migrations/20260604143000_create_submission_rpc.sql`.
7. Executa tot el contingut de `supabase/migrations/20260610140500_limit_submissions_per_space.sql`.
8. Executa tot el contingut de `supabase/migrations/20260611183000_add_admin_users.sql`.
9. Executa tot el contingut de `supabase/migrations/20260611184500_add_admin_read_rls_policies.sql`.
10. Executa tot el contingut de `supabase/migrations/20260611190000_add_admin_service_rpcs.sql`.
11. Executa tot el contingut de `supabase/migrations/20260611193000_allow_submissions_for_space_questionnaire_version.sql`.
12. Executa tot el contingut de `supabase/migrations/20260611203000_grant_private_schema_usage_to_service_role.sql`.
13. Desa els resultats de verificació indicats més avall.

## Configuracio manual important

Al dashboard de Supabase:

- No creis cap taula `centres`.
- No afegeixis columnes de nom de centre, codi de centre, nom, cognoms, email, IP, user agent o dispositiu.
- No creis polítiques públiques de lectura per a `diagnostic_spaces`, `submissions` ni `answers`.
- No exposis la `service_role key` al navegador.
- Si revises `Project Settings > API`, comprova que qualsevol exposicio via Data API queda protegida per RLS i sense grants a `anon`/`authenticated` per aquestes taules.
- Desa `SUPABASE_SERVICE_ROLE_KEY` només en entorns de servidor.
- En fases posteriors, configura a Vercel només variables server-side per a secrets.

## Bootstrap del primer administrador

El primer administrador és el primer usuari autenticat amb compte `@xtec.cat`
que accedeix correctament a la pantalla `/admin`.

Aquesta regla només s'aplica quan `public.admin_users` és buida. Quan ja hi ha
almenys un administrador actiu o inactiu, l'accés a `/admin` no ha de concedir
cap nou permís d'administracio. Els administradors següents només es poden
afegir o reactivar des de l'administracio per part d'un administrador actiu.

La creació d'espais de diagnosi no concedeix permisos d'administracio.

Requisits d'implementacio:

- El provider Google OAuth ja ha d'estar configurat.
- La migració `supabase/migrations/20260611183000_add_admin_users.sql` ha
  d'estar aplicada.
- El bootstrap s'ha de fer server-side després de validar que l'usuari és
  `@xtec.cat`.
- La base de dades de l'aplicació només ha de desar el `auth.users.id` del
  primer usuari; no s'han de copiar emails.
- La comprovacio "no hi ha cap admin" i la insercio del primer admin han de ser
  atòmiques, preferiblement amb una RPC PostgreSQL amb bloqueig transaccional,
  per evitar que dos primers logins simultanis a `/admin` puguin obtenir el rol.

SQL orientatiu per a la futura RPC de bootstrap:

```sql
select pg_advisory_xact_lock(hashtext('diagnosi_ia_admin_bootstrap'));

insert into public.admin_users (user_id, role, is_active)
select
  p_user_id,
  'admin',
  true
where not exists (
  select 1
  from public.admin_users
);
```

Aquest SQL és orientatiu: no s'ha d'executar manualment sense adaptar-lo dins
una funcio o transaccio que rebi `p_user_id` des del servidor.

## Variables d'entorn per a la fase 3

Per provar `/crear`, `POST /api/spaces`, `/q/[publicCode]` i `POST /api/submissions`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
PRIVATE_TOKEN_HMAC_SECRET=<strong-random-secret>
RESULTS_TOKEN_ENCRYPTION_KEY=<32-byte-base64url-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No posis `SUPABASE_SERVICE_ROLE_KEY`, `PRIVATE_TOKEN_HMAC_SECRET` ni `RESULTS_TOKEN_ENCRYPTION_KEY` amb prefix `NEXT_PUBLIC_`.

El valor de `PRIVATE_TOKEN_HMAC_SECRET` ha de ser llarg i aleatori. No reutilitzis el placeholder de `.env.example`.

El valor de `RESULTS_TOKEN_ENCRYPTION_KEY` ha de descodificar a 32 bytes. Exemple per generar-lo:

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

## Supabase Auth i Google OAuth

Activa Google com a provider d'autenticació a Supabase Auth.

URLs de redirecció de l'aplicació:

```text
http://localhost:3000/auth/callback
https://diagnosi-ia.vercel.app/auth/callback
```

A Google Cloud OAuth, configura com a authorized redirect URI la callback del projecte Supabase indicada al dashboard de Supabase Auth per al provider Google.

## Verificacions recomanades

Executa aquestes consultes al SQL Editor després de migració i seed.

### Taules esperades

```sql
select table_name
from information_schema.tables
where table_schema = 'públic'
order by table_name;
```

Resultat esperat:

- `answers`
- `admin_users`
- `diagnostic_spaces`
- `question_blocks`
- `questionnaires`
- `questions`
- `submissions`

### Cap taula `centres`

```sql
select count(*) as centres_tables
from information_schema.tables
where table_schema = 'públic'
  and table_name = 'centres';
```

Resultat esperat: `0`.

### Cap columna identificativa prohibida

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'públic'
  and (
    column_name ilike '%centre%'
    or column_name ilike '%center%'
    or column_name ilike '%school%'
    or column_name ilike '%email%'
    or column_name ilike '%mail%'
    or column_name ilike '%name%'
    or column_name ilike '%nom%'
    or column_name ilike '%ip%'
    or column_name ilike '%device%'
    or column_name ilike '%user_agent%'
  )
order by table_name, column_name;
```

Resultat esperat: cap fila.

### RLS activat

```sql
select
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
from pg_tables
where schemaname = 'públic'
  and tablename in (
    'questionnaires',
    'question_blocks',
    'questions',
    'diagnostic_spaces',
    'submissions',
    'answers',
    'admin_users'
  )
order by tablename;
```

Resultat esperat: `rowsecurity = true` i `forcerowsecurity = true` a totes les files.

### Sense lectura pública de respostes

```sql
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'públic'
  and tablename in ('diagnostic_spaces', 'submissions', 'answers')
order by tablename, policyname;
```

Resultat esperat: polítiques de denegació amb `qual = false` i `with_check = false`; cap política `using (true)`.

### Lectura d'administracio limitada

```sql
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'admin_users',
    'questionnaires',
    'question_blocks',
    'questions',
    'diagnostic_spaces',
    'submissions',
    'answers'
  )
order by table_name, grantee, privilege_type;
```

Resultat esperat:

- `authenticated` només té `SELECT` sobre `admin_users`, `questionnaires`,
  `question_blocks` i `questions`.
- `anon` no té permisos sobre aquestes taules.
- `diagnostic_spaces`, `submissions` i `answers` no tenen permisos per a
  `anon` ni `authenticated`.

### Seed del qüestionari

```sql
select
  q.version,
  count(distinct qb.id) as blocks,
  count(qu.id) as questions
from questionnaires q
left join question_blocks qb on qb.questionnaire_id = q.id
left join questions qu on qu.questionnaire_id = q.id
where q.version = '2026.2'
group by q.version;
```

Resultat esperat:

- `version = 2026.2`
- `blocks = 5`
- `questions = 20`

### Quatre preguntes per bloc

```sql
select
  qb.position,
  qb.title,
  count(qu.id) as questions
from question_blocks qb
join questionnaires q on q.id = qb.questionnaire_id
left join questions qu on qu.block_id = qb.id
where q.version = '2026.2'
group by qb.position, qb.title
order by qb.position;
```

Resultat esperat: 5 files, totes amb `questions = 4`.

### Permisos de la RPC de submissions

```sql
select
  has_function_privilege('anon', 'public.create_submission_with_answers(text, text, jsonb)', 'execute') as anon_can_execute,
  has_function_privilege('authenticated', 'public.create_submission_with_answers(text, text, jsonb)', 'execute') as authenticated_can_execute,
  has_function_privilege('service_role', 'public.create_submission_with_answers(text, text, jsonb)', 'execute') as service_role_can_execute;
```

Resultat esperat:

- `anon_can_execute = false`
- `authenticated_can_execute = false`
- `service_role_can_execute = true`

## Notes de seguretat

- La migració revoca permisos a `anon` i `authenticated`.
- Les polítiques RLS creades són de denegació explícita.
- Les taules sensibles no tenen lectura pública.
- El seed no crea camps oberts ni dades identificatives.
- Les respostes individuals existeixen només com a files internes i no s'han d'exposar mai per API pública.
