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
  admin_users ||--o{ admin_centre_actions : performs
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
`custom_domain` opcional, que són excloents quan la política està configurada.
El domini es desa en minúscules i s'aplica per
coincidència exacta. Aquestes dades descriuen el centre, no identifiquen cap
docent.

`is_suspended`, `suspended_at` i `suspended_by` permeten bloquejar de manera
reversible el responsable i l'espai públic. No es relacionen amb cap resposta.

### `centre_accounts`

Comptes responsables amb identificador Google opac, correu i nom visible. Un
compte de centre s'associa al seu centre. En mode `all_xtec`, els comptes XTEC
no oficials tenen una fila de fitxa institucional per gestionar el seu espai
de prova; els administradors la tenen en qualsevol mode. La consulta a Dades
Obertes normalment queda amb estat `not_found` per a aquestes fitxes.

### `diagnostic_spaces`

Espais amb UUID, codi públic, propietari opac, centre opcional, versió
assignada, estat i metadades del token de resultats. El codi públic, el
propietari i el centre són únics. No conté correu de participant.

L'esquema manté `centre_id` nullable per compatibilitat, sense cap migració
nova. El codi exigeix una fitxa configurada per crear espais nous. El registre
del responsable vincula els seus espais antics sense centre a la seva fitxa,
sense modificar els codis públics, els tokens ni les respostes existents.

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

### `admin_centre_actions`

Registre mínim de suspensions, reactivacions, reinicis i eliminacions de
centres. Desa un UUID, l'identificador i etiqueta institucional del centre, el
tipus d'acció, l'administrador, el recompte agregat afectat i la data. No té
clau forana cap a `centres` perquè el registre de governança es conserva després
d'una eliminació. No conté `submission_id`, `answer_id`, correus docents ni
contingut de respostes. `actor_user_id` utilitza `utf8mb4_unicode_ci`, la mateixa
col·lació que `admin_users.user_id`, per garantir que el `JOIN` administratiu
sigui compatible també en bases de dades amb `utf8mb4_0900_ai_ci` per defecte.

### `app_settings`

Configuració global no personal:

- `responsible_access_mode`: `all_xtec` o `centre_xtec`.
- `admin_results_minimum_submissions`: enter de 0 a 10.
- `communication_subject`: assumpte global del comunicat.
- `communication_body`: text global amb la marca opcional
  `{URL_QUESTIONARI}`.
- `language_selector_visible`: booleà textual que mostra o oculta el selector
  d’idioma global.
- `visible_languages`: codis de llengua visibles separats per comes; sempre ha
  d’incloure `CA` mentre el contingut només estigui disponible en català.
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

Les accions administratives sobre un centre bloquegen primer la seva fila. La
suspensió és reversible; els reinicis i l'eliminació esborren `answers`,
`submissions` i `submission_locks` en aquest ordre abans d'actualitzar o
eliminar l'espai. El registre administratiu s'insereix dins la mateixa
transacció.

La creació, còpia, activació i eliminació de versions també s'executa amb
transaccions server-side.

## Resultats agregats

Les consultes agrupen per `question_id` i `value` i retornen només el recompte.
No seleccionen `submission_id`, timestamps individuals ni combinacions de
respostes. El model final inclou totals, percentatges globals, per bloc i per
pregunta, i distribucions agregades.

Els resultats d'administracio poden limitar l'agregacio a un `centre_id`
identificat. La subconsulta d'espais elegibles aplica abans el llindar mínim de
respostes; un centre que no el supera no aporta recomptes al resultat. Aquesta
seleccio no modifica l'esquema ni crea cap relacio nova entre `centres` i les
respostes individuals.

## Migracions i seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:push` es reserva per a desenvolupament local. Els entorns compartits han
d'aplicar migracions versionades de `drizzle/`.
