# Esquema de base de dades

La base de dades activa és MySQL 8.4. L'esquema executable és
`lib/db/schema.ts` i les migracions generades es desen a `drizzle/`.

La taula principal d'espais s'anomena `diagnostic_spaces`. Les identitats
institucionals es desen a `centres` i `centre_accounts`, separades de les
respostes.

## Principis

- El client MySQL és server-only.
- Els UUID es generen al servidor.
- Les dates es desen amb precisió de mil·lisegons i es tracten com UTC.
- Les relacions compostes garanteixen que espais, submissions, preguntes i
  respostes pertanyin a la mateixa versió.
- Les operacions multi-taula són transaccionals.
- Les consultes de resultats retornen només recomptes agregats.

## Relacions

```mermaid
erDiagram
  questionnaires ||--o{ question_blocks : contains
  question_blocks ||--o{ questions : contains
  questionnaires ||--o{ diagnostic_spaces : assigned_to
  centres ||--o{ centre_accounts : authorizes
  centres ||--o| diagnostic_spaces : owns
  diagnostic_spaces ||--o{ submission_locks : limits
  diagnostic_spaces ||--o{ submissions : receives
  submissions ||--o{ answers : contains
  questions ||--o{ answers : answered_by
  admin_users ||--o{ admin_email_invitations : manages
```

## Taules

### `questionnaires`

Versions del qüestionari. L'identificador té tres dígits, la versió i el títol
són únics, els minuts estimats van d'1 a 120 i només una versió pot estar activa
des de la lògica transaccional d'administració.

### `question_blocks`

Blocs ordenats d'una versió. La clau primària és
`(id, questionnaire_id)`; l'identificador té dos dígits i la posició va d'1 a
10.

### `questions`

Preguntes tancades amb UUID, versió, bloc, posició global, posició dins del bloc
i text. L'escala vàlida és fixa de 0 a 3. Cada bloc admet entre 1 i 10 preguntes
i cada versió fins a 100.

### `centres`

Centres identificats amb correu institucional únic, codi oficial opcional, nom
oficial, municipi, àrea territorial, servei educatiu, estat de sincronització,
darrer intent i darrera actualització correcta. El correu és la clau estable
quan Dades Obertes encara no ha retornat cap fitxa.

També conté l'estat de l'alta (`profile_confirmed_at` i
`email_policy_configured_at`) i la política docent: `allow_xtec` i un únic
`custom_domain` opcional. El domini es desa en minúscules i s'aplica per
coincidència exacta. Aquestes dades descriuen el centre, no identifiquen cap
docent.

### `centre_accounts`

Comptes responsables amb identificador Google opac, correu i nom visible. Un
compte de centre s'associa al seu centre. Els administradors amb compte
personal tenen també una fila de fitxa institucional per gestionar l'espai de
prova; la consulta a Dades Obertes normalment queda amb estat `not_found`.

### `diagnostic_spaces`

Espais amb UUID, codi públic, propietari opac, centre opcional, versió
assignada, estat i metadades del token de resultats. El codi públic, el
propietari i el centre són únics. No conté correu de participant.

El token de resultats es conserva com HMAC i, quan s'ha de recuperar per al
creador, també xifrat amb una clau server-side.

### `submission_locks`

Bloquejos pseudònims contra respostes repetides. La clau és
`(diagnostic_space_id, lock_hmac)`. No conté `submission_id`, correu, IP,
user agent, dispositiu ni respostes, i no es consulta per calcular resultats.

### `submissions`

Enviaments anònims amb UUID tècnic, espai, versió i data tècnica. No contenen
usuari, correu, IP o informació de dispositiu i no es retornen al navegador.

### `answers`

Respostes tancades amb clau `(submission_id, question_id)`, versió i valor
entre 0 i 3. Les claus foranes compostes impedeixen barrejar versions.

### `admin_users`

Administradors identificats amb un identificador opac, correu XTEC, nom visible,
rol, estat, creador i darrera entrada. Aquesta és una excepció limitada a la
gestió administrativa i no pot relacionar-se amb respostes.

### `admin_email_invitations`

Invitacions d'administració pendents o acceptades. Desa el correu XTEC, qui
convida i la traça mínima d'acceptació. No pot contenir dades de participants.

### `app_settings`

Configuració global no personal:

- `responsible_access_mode`: `all_xtec` o `centre_xtec`.
- `admin_results_minimum_submissions`: enter de 0 a 10.
- `communication_subject`: assumpte global del comunicat.
- `communication_body`: text global amb la marca opcional
  `{URL_QUESTIONARI}`.
- El comunicat també admet `{NOM_CENTRE}`.

No pot contenir dades de participants.

## Regles de versionat del qüestionari

- La versió inicial és `2026.1` i la versió activa corregida és `2026.2`.
- El seed actiu inicial conté 5 blocs i 20 preguntes amb escala 0-3.
- Una versió sense espais assignats pot editar estructura.
- Una versió assignada exigeix confirmació explícita abans d'editar-se.
- Una versió activa o amb respostes només permet corregir títols i textos
  mantenint identificadors i estructura.
- Els canvis estructurals creen una versió nova.
- Activar una versió no reassigna espais existents.

## Transaccions

La creació de submissions bloqueja la fila de l'espai, torna a consultar la
política de domini del centre i després comprova el límit i insereix bloqueig,
submission i respostes dins la mateixa transacció. El correu docent no
s'insereix en cap taula.

El reinici d'un espai elimina bloquejos i respostes, assigna la versió activa i
rota codi i token dins una transacció. No modifica el qüestionari versionat.

La creació, còpia, activació i eliminació de versions també s'executa amb
transaccions server-side.

## Resultats agregats

Les consultes agrupen per `question_id` i `value` i retornen només el recompte.
No seleccionen `submission_id`, timestamps individuals ni combinacions de
respostes. El model final inclou totals, percentatges globals, per bloc i per
pregunta, i distribucions agregades.

## Migracions i seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:push` es reserva per a desenvolupament local. Els entorns compartits han
d'aplicar migracions versionades de `drizzle/`.
