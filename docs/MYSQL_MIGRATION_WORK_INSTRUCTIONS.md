# Instruccions de treball per a la migracio a MySQL

Aquest document recull les ordres que el propietari del projecte pot donar a
Codex, fase a fase, per migrar Diagnosi IA de Supabase/PostgreSQL a un entorn
local amb MySQL.

L'objectiu immediat no és desplegar al servidor del Departament ni preparar
Vercel. L'objectiu immediat és que la branca `migration/mysql` funcioni
completament en local amb Next.js i MySQL.

## Regles generals per a totes les fases

Abans de cada fase, dona una instruccio petita i concreta. Codex ha de fer
nomes aquella fase i aturar-se amb un resum del diff, les proves i els riscos.

Regles fixes:

- No treballar a `main`.
- Treballar sempre a `migration/mysql`.
- Mantenir `main` com a versio estable amb Supabase/PostgreSQL.
- No eliminar Supabase de cop si aixo deixa l'aplicacio trencada.
- No afegir cap taula `centres`.
- No afegir camps de nom de centre, codi de centre, noms, cognoms, correus,
  IPs, user agents, dispositius ni respostes obertes per al professorat
  participant.
- No exposar `diagnostic_spaces`, `submissions` ni `answers` al navegador.
- No retornar files individuals de `submissions` o `answers`.
- No mostrar ni exportar combinacions de respostes d'una mateixa persona.
- Mantenir tots els resultats com a dades de conjunt.
- No posar mai secrets en fitxers versionats, logs, URLs amb query string,
  PDFs o respostes d'error.
- Tractar `.env.local` com a fitxer local ignorat per Git; documentar-ne el
  contingut, pero no versionar-lo.
- Canviar de MySQL local a MySQL del Departament hauria de requerir nomes
  canviar `DATABASE_URL`.

Comprovacions recomanades al final de cada fase, quan apliqui:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

Si una fase es nomes documental, pot ser suficient revisar el diff i explicar
que no s'han executat proves de runtime perque no hi ha canvis de codi.

## Decisions de migracio ja fixades

- Base de dades local: MySQL 8.4.
- ORM preferent: Drizzle ORM amb `mysql2` i `drizzle-kit`.
- Connexio: nomes server-side, llegint `DATABASE_URL`.
- Cap variable MySQL amb prefix `NEXT_PUBLIC_`.
- UUIDs generats des de TypeScript amb `crypto.randomUUID()` o helper
  server-side equivalent.
- Timestamps MySQL amb `datetime(3)` o equivalent, tractats com UTC.
- `jsonb` de PostgreSQL passa a `json` de MySQL.
- RPCs PostgreSQL passen a funcions TypeScript server-side amb transaccions.
- RLS de Supabase passa a control d'acces server-side, repositoris i Route
  Handlers/server actions.
- `supabase/migrations` es conserva intacte per a `main`; a `migration/mysql`
  es crea un esquema MySQL net des de l'estat final actual, no una traduccio
  literal de cada migracio historica.
- `admin_users` tambe forma part de la migracio. A MySQL ha de guardar un
  identificador opac d'usuari autenticat, pero no ha de tenir FK a
  `auth.users`.
- La validacio de submissions no ha de codificar sempre "20 preguntes". Ha de
  validar exactament totes les preguntes del qüestionari assignat a l'espai. El
  seed inicial `2026.2` si que ha de crear 5 blocs i 20 preguntes.
- Els tokens privats de resultats s'han de guardar com HMAC/hash i, si cal
  recuperar l'enllac per al creador, tambe xifrats amb clau server-side. Mai en
  text pla.
- Cal separar clarament dues migracions:
  - migracio de dades de Supabase/PostgreSQL a MySQL;
  - substitucio de Supabase Auth per una estrategia local provisional i,
    posteriorment, per OAuth/OIDC institucional o equivalent.

## Fase 0: documentacio i arquitectura de migracio

Envia aquesta instruccio:

```text
Crea o utilitza la branca migration/mysql i fes nomes la Fase 0 documental:
- actualitza els documents normatius per reflectir la migracio local a MySQL;
- deixa clar que main continua sent Supabase/PostgreSQL;
- documenta que migration/mysql es experimental;
- separa base de dades i autenticacio;
- documenta l'estrategia d'auth local provisional;
- documenta que RLS/RPC de Supabase se substitueixen per control server-side i transaccions MySQL;
- inclou admin_users dins l'abast de migracio;
- no canviis encara codi d'aplicacio ni dependencies;
- revisa el diff i indica quines proves has executat o per que no calen.
```

Criteris d'acceptacio:

- Els documents no contradiuen que `main` encara funciona amb Supabase.
- La branca `migration/mysql` queda descrita com a branca experimental.
- Queda clar que l'objectiu immediat es local amb MySQL.
- Queda clar que Supabase Auth encara s'ha de substituir o encapsular.
- No hi ha canvis de runtime.

## Fase 1: MySQL local, entorn i Drizzle

Envia aquesta instruccio:

```text
Aplica la Fase 1: prepara MySQL local i la capa base de Drizzle, sense migrar encara cap consulta de negoci.
- afegeix docker-compose.yml amb mysql:8.4;
- crea la base diagnosi_ia, usuari diagnosi_user i contrasenya diagnosi_password;
- exposa MySQL a 127.0.0.1:3306;
- configura charset utf8mb4 i collation utf8mb4_unicode_ci;
- afegeix volum persistent per dades locals;
- actualitza .env.example amb DATABASE_URL, PRIVATE_TOKEN_HMAC_SECRET, RESULTS_TOKEN_ENCRYPTION_KEY i NEXT_PUBLIC_APP_URL;
- no versionis .env.local, nomes documenta com crear-lo;
- afegeix drizzle-orm, mysql2 i drizzle-kit;
- crea lib/db/client.ts, lib/db/schema.ts i drizzle.config.ts;
- assegura que el client de DB es nomes server-side;
- afegeix scripts db:generate, db:migrate, db:push, db:seed i db:studio si escau;
- executa lint, tests, typecheck i build si el canvi ho permet.
```

Criteris d'acceptacio:

- `docker compose up -d` pot aixecar MySQL local.
- `DATABASE_URL` no es publica al navegador.
- El projecte compila o, si encara no compila per dependencies pendents, queda
  documentat exactament el bloqueig.
- No s'ha migrat cap flux funcional encara.

## Fase 2: esquema MySQL i seed local

Envia aquesta instruccio:

```text
Aplica la Fase 2: crea l'esquema MySQL final i el seed local.
- defineix amb Drizzle les taules questionnaires, question_blocks, questions, diagnostic_spaces, submissions, answers i admin_users;
- preserva les restriccions de privacitat i anonimat;
- usa char(36) o varchar equivalent per UUIDs;
- usa ids de qüestionari de 3 digits i ids de bloc de 2 digits;
- implementa claus uniques i foreign keys equivalents a l'esquema actual;
- afegeix checks o validacions equivalents per escala 0, 1, 2, 3 i formats quan MySQL ho permeti;
- crea seed per al qüestionari actiu 2026.2 amb 5 blocs i 20 preguntes;
- no tradueixis literalment totes les migracions PostgreSQL, crea un esquema net de l'estat final;
- executa db:generate/db:push o db:migrate segons la decisio del projecte;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- El seed crea el qüestionari actiu `2026.2`.
- No existeix cap taula `centres`.
- No hi ha camps identificatius prohibits.
- `admin_users` existeix sense copiar nom, cognoms ni email.
- L'esquema permet submissions atomiques i resultats agregats.

## Fase 3: repositoris i lectura del qüestionari

Envia aquesta instruccio:

```text
Aplica la Fase 3: crea la capa de repositoris i migra nomes la lectura del qüestionari.
- crea lib/repositories/questionnaires.ts;
- crea funcions getActiveQuestionnaire() i getDiagnosticSpaceByPublicCode();
- substitueix la carrega publica del qüestionari per MySQL;
- mantingues la validacio server-side;
- no migris encara submissions, resultats, espais ni administracio;
- afegeix o actualitza tests de lectura de qüestionari;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- `/q/[publicCode]` pot carregar el qüestionari des de MySQL quan hi ha dades
  locals.
- Cap component client importa el client MySQL.
- No es retornen dades sensibles de `diagnostic_spaces`.

## Fase 4: submissions atomiques amb MySQL

Envia aquesta instruccio:

```text
Aplica la Fase 4: substitueix create_submission_with_answers per una funcio TypeScript server-side amb transaccio MySQL.
- crea lib/repositories/submissions.ts;
- implementa createSubmissionWithAnswers();
- valida publicCode, questionnaireVersion, espai actiu i qüestionari assignat a l'espai;
- valida exactament totes les preguntes del qüestionari assignat, no un nombre fix hardcoded excepte tests del seed;
- valida shape estricte, questionId, value, duplicats, pertinença de preguntes i valors 0/1/2;
- aplica el limit de 300 submissions per espai dins la transaccio;
- usa bloqueig equivalent a SELECT ... FOR UPDATE per evitar superar el limit en concurrencia;
- insereix una fila a submissions i totes les files a answers dins la mateixa transaccio;
- si falla qualsevol pas, rollback;
- no retornis files individuals;
- afegeix tests de payload valid, invalid, duplicats, valors fora de rang, preguntes alienes, rollback i limit de 300;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- `POST /api/submissions` funciona contra MySQL.
- No hi ha dependencia de `supabase.rpc("create_submission_with_answers")`.
- Les insercions son atomiques.
- El navegador no accedeix a `submissions` ni `answers`.

## Fase 5: resultats agregats i PDF

Envia aquesta instruccio:

```text
Aplica la Fase 5: migra resultats agregats i PDF a MySQL.
- crea lib/repositories/results.ts;
- substitueix get_diagnostic_answer_counts per una consulta MySQL agregada;
- retorna nomes counts per question_id i value;
- calcula mitjanes i distribucions en TypeScript a partir de totals agregats;
- valida de nou el token privat a /api/results i /api/reports/pdf;
- assegura que el token no passa per query params ni apareix al PDF;
- no carreguis combinacions de respostes d'una mateixa submission;
- mantingues el PDF com a informe de conjunt;
- afegeix tests de token valid/invalid, resultats agregats i PDF sense dades sensibles;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- Es poden consultar resultats amb token valid.
- El creador pot consultar resultats del seu espai si l'auth local ho permet.
- El PDF es genera sense token, sense dades personals i sense files individuals.
- No queda dependencia de RPC de resultats de Supabase.

## Fase 6: creacio, gestio i reset d'espais

Envia aquesta instruccio:

```text
Aplica la Fase 6: migra creacio, gestio, regeneracio de token i reset d'espais a MySQL.
- crea lib/repositories/diagnostic-spaces.ts;
- implementa createDiagnosticSpace();
- implementa listOwnerSpaces(), getOwnerSpace(), regenerateOwnerResultsToken() i resetOwnerDiagnosticSpace();
- genera public_code amb el helper existent i reintents per collisions;
- genera token privat segur;
- desa nomes hash/HMAC i token xifrat si cal recuperar l'enllac;
- no desis mai el token en clar;
- cada creador autenticat pot tenir com a maxim un espai;
- el reset elimina answers i submissions anonimes, conserva l'espai i propietari, reassigna el qüestionari actiu i rota public_code i token;
- fes el reset dins una transaccio;
- afegeix tests de collisions, token, unicitat per creador i reset;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- Es pot crear un espai diagnostic localment amb MySQL.
- Es pot regenerar l'enllac privat.
- Es pot reiniciar el qüestionari sense conservar respostes individuals.
- Cap token privat queda en clar.

## Fase 7: auth local provisional i administracio

Envia aquesta instruccio:

```text
Aplica la Fase 7: encapsula o substitueix Supabase Auth per un mode local provisional.
- crea una capa d'auth propia server-side;
- permet un mode local de desenvolupament controlat per variables d'entorn;
- exigeix email @xtec.cat tambe en mode local;
- no creis comptes per professorat participant;
- mantingues owner_user_id com identificador opac del creador;
- adapta /auth/login, /auth/callback, /auth/logout o documenta rutes equivalents locals;
- adapta l'administracio per usar admin_users a MySQL;
- mantingues el bootstrap del primer administrador de manera atomica;
- no copiïs nom, cognoms ni email a admin_users;
- documenta clarament que aquesta auth local es provisional i no es la solucio final del Departament;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- `/crear` funciona localment sense Supabase Auth.
- L'administracio pot fer bootstrap local del primer administrador.
- `admin_users` no conte dades personals copiades.
- El professorat participant continua sense compte d'usuari.

## Fase 8: eliminar Supabase del flux principal

Envia aquesta instruccio:

```text
Aplica la Fase 8: elimina Supabase del flux principal local.
- cerca tots els imports de @supabase/supabase-js i @supabase/ssr;
- cerca createSupabaseAdminClient, createSupabaseAuthServerClient, .from(), .rpc() i variables SUPABASE_*;
- elimina o ailla qualsevol dependencia que ja no sigui necessaria al flux local;
- mante els fitxers supabase/ intactes com a referencia historica de main, tret que hi hagi una decisio explicita contraria;
- assegura que carregar qüestionari, crear espai, respondre, consultar resultats i generar PDF no requereixen Supabase;
- revisa que cap secret server-side s'exposa al client;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- El flux principal local no usa Supabase.
- Les dependencies Supabase es poden eliminar del `package.json` o queden
  justificades si encara hi ha una peça temporal.
- No hi ha variables `NEXT_PUBLIC_SUPABASE_*` necessaries per al flux local.

## Fase 9: proves funcionals locals i README

Envia aquesta instruccio:

```text
Aplica la Fase 9: documenta i verifica el funcionament local complet.
- actualitza README amb instruccions locals per migration/mysql;
- inclou docker compose up -d;
- inclou creacio de .env.local sense versionar secrets;
- inclou migracions, seed, npm run dev i npm start;
- comprova npm run build i npm start;
- comprova funcionalment carregar qüestionari, crear espai, respondre, consultar resultats i generar PDF;
- revisa el diff complet;
- comprova que no s'han exposat secrets;
- comprova que no s'han introduit dades identificatives;
- executa lint, tests, typecheck i build.
```

Criteris d'acceptacio:

- `docker compose up -d` aixeca MySQL local.
- `npm run dev` funciona amb MySQL local.
- `npm run build` funciona.
- `npm start` funciona.
- El flux complet funciona sense Supabase i sense Vercel.
- No hi ha acces MySQL des del navegador.
- Les operacions critiques son server-side.

## Ordres curtes per continuar

Quan vulguis continuar, envia una d'aquestes ordres:

```text
Comença la Fase 0.
```

```text
Comença la Fase 1.
```

```text
Comença la Fase 2.
```

I aixi successivament. Si vols fer una fase encara mes petita, indica-ho aixi:

```text
De la Fase 4, fes nomes la transaccio de submissions i els tests associats. No toquis resultats ni PDF.
```

## Checklist de privacitat per revisar cada diff

Abans de donar una fase per bona, comprova:

- S'ha creat cap taula `centres`?
- S'ha afegit cap camp de centre, docent, email, IP, dispositiu o user agent?
- El navegador pot llegir directament `diagnostic_spaces`, `submissions` o
  `answers`?
- Algun endpoint retorna files individuals?
- Algun endpoint retorna combinacions de respostes per submission?
- Els resultats son sempre agregats?
- El PDF repeteix la validacio del token?
- El token privat apareix en logs, query params, PDF o errors?
- `.env.example` conte nomes placeholders?
- `.env.local` queda fora de Git?
- Les submissions i answers s'insereixen dins una transaccio?
- Els tests cobreixen tokens, validacio de respostes, calculs agregats i
  rollback?
