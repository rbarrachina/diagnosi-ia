# Revisio de seguretat i privacitat

Data de revisió: 2026-06-11.

## Abast revisat

- Rutes públiques i privades de Next.js.
- Validacio de payloads.
- Gestio de token privat.
- Consultes Supabase server-side.
- RLS, grants i RPC de submissions.
- Resultats de conjunt i PDF.
- Administracio global del qüestionari.
- Cerca de secrets i logs.

## Resultats de la revisió

### Acces a respostes individuals

No s'ha trobat cap endpoint que retorni files individuals de `submissions` o `answers`.

- `POST /api/results` retorna només dades de conjunt calculades al servidor.
- `POST /api/reports/pdf` reutilitza la mateixa capa de resultats de conjunt i revalida el token.
- El navegador no importa `@supabase/supabase-js` ni `createSupabaseAdminClient`.
- Les consultes a `answers` i `submissions` només apareixen en moduls server-only.
- L'administracio no té cap `app/api/admin/**` implementat actualment; la UI
  `/admin` usa server actions i serveis server-only.
- La UI d'administracio només mostra metadades de qüestionari:
  versions, blocs, preguntes, estat actiu i recompte de respostes.
- El recompte de respostes d'una versio es fa amb `select` amb
  `{ count: "exact", head: true }`; no es retornen files individuals.
- L'administracio no consulta `answers`.

### Administracio i dades identificatives

- No s'han afegit filtres per centre, persona, docent, dispositiu, IP o user
  agent.
- La gestio d'administradors usa `auth.users.id`. No es desa email a
  `admin_users`.
- La pantalla `/admin` pot mostrar el correu del compte OAuth autenticat actual
  com a estat de sessio, pero no mostra dades de participants.
- Les mutacions d'administracio validen sessio i rol al servidor abans de
  cridar les RPCs o serveis amb `service_role`.
- Les correccions sobre versions actives o amb respostes passen per la RPC
  server-only `replace_questionnaire_content`, que exigeix confirmacio quan hi
  ha espais assignats i preserva l'estructura de blocs i preguntes.
- L'eliminacio destructiva d'una versio no activa passa per la RPC server-only
  `delete_questionnaire_version`; elimina dades dependents sense retornar files
  individuals al navegador i rebutja versions actives.

### Tokens privats

- El token privat es genera amb 32 bytes aleatoris.
- El token es desa com HMAC-SHA256 amb `PRIVATE_TOKEN_HMAC_SECRET`.
- El token de resultats s'envia només per `POST`.
- La pagina de resultats llegeix `#token=` i elimina el fragment amb `history.replaceState`.
- No hi ha `console.log` ni `console.error` en codi d'aplicació que pugui escriure tokens.
- S'ha afegit política `referrer: "no-referrer"` a la metadata de Next.js.

### Secrets

- `.env.local` existeix només en local i està ignorat per Git.
- `.env.example` conté placeholders, no secrets reals.
- `SUPABASE_SERVICE_ROLE_KEY` només s'utilitza a `lib/database/server.ts`, que importa `server-only`.
- No s'han trobat claus reals en fitxers versionables.
- Els errors d'administracio són genèrics i no inclouen tokens, secrets, rows
  individuals, identificadors de submissions o dades de participants.

### Supabase

Verificacions fetes al projecte `diagnosi-ia`:

- Security advisors: cap avís.
- RLS activat i forcat a:
  - `questionnaires`
  - `question_blocks`
  - `questions`
  - `diagnostic_spaces`
  - `submissions`
  - `answers`
- `anon` i `authenticated` no tenen grants sobre `diagnostic_spaces`, `submissions` ni `answers`.
- `anon` i `authenticated` no poden executar `public.create_submission_with_answers`.
- No s'han trobat columnes identificatives prohibides.

Els performance advisors mostren avisos `unused_index` de nivell INFO, esperables en una base de dades amb poc ús.

## Correccions aplicades

- S'ha centralitzat la lectura de JSON en `lib/http/request.ts`.
- S'han afegit límits de mida de payload:
  - `POST /api/spaces`: 1 KB.
  - `POST /api/submissions`: 16 KB.
  - `POST /api/results`: 4 KB.
  - `POST /api/reports/pdf`: 4 KB.
- Les rutes rebutgen JSON invàlid i payloads no `application/json`.
- S'han afegit proves per als límits i validació de cos de pèticio.
- S'ha afegit `referrer: "no-referrer"` a `app/layout.tsx`.
- S'han afegit capcaleres HTTP basiques a `next.config.ts`: `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` i `Permissions-Policy`.
- S'han afegit proves estàtiques d'administracio a
  `tests/admin-privacy-review.test.ts` per detectar:
  - endpoints admin que referencien `submissions` o `answers`;
  - lectures directes d'`answers` o files de `submissions` des d'admin;
  - formularis amb camps de centre, persona o participant;
  - `console.*` en codi admin;
  - secrets o tokens en codi i errors d'admin.

## Riscos pendents

- No hi ha rate limiting. Un actor podria fer spam a `/api/spaces`, `/api/submissions`, `/api/results` o `/api/reports/pdf`.
- No hi ha protecció anti-bots o CAPTCHA.
- Amb molt poques respostes, especialment 1 resposta, les distribucions i mitjanes per pregunta poden revelar respostes concretes. El producte exigeix consultar resultats des de la primera resposta, de manera que aquest risc no es pot eliminar sense canviar requisits.
- No hi ha política de retenció, eliminacio o tancament automatic d'espais.
- Els tokens privats no tenen caducitat ni rotacio.
- No hi ha monitoratge de seguretat configurat amb una política clara que eviti dades personals.

## Recomanacions per a la fase seguent

- Afegir rate limiting server-side per IP o per codi públic sense persistir IP a la base de dades de l'aplicació.
- Afegir protecció anti-bots a creació d'espais i submissions.
- Definir política de retenció i tancament d'espais.
- Decidir si cal ocultar distribucions per pregunta quan `totalSubmissions` sigui molt baix, encara que els resultats globals continuin visibles.
- Revisar si cal afegir Content Security Policy estricta quan la UI i les dependències visuals estiguin estabilitzades.
