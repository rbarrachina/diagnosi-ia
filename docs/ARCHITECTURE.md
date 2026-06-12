# Arquitectura

## Stack

- Next.js App Router
- TypeScript estricte
- Tailwind CSS
- Vercel
- PostgreSQL a Supabase
- Supabase Auth amb Google OAuth per a creadors XTEC
- Recharts per a gràfiques web
- `@react-pdf/renderer` per generar PDF al servidor

## Principis

- El client mai accedeix directament a taules sensibles.
- Totes les operacions sensibles passen per Route Handlers o funcions de servidor.
- El servidor valida totes les entrades amb esquemes estrictes.
- El servidor retorna resultats de conjunt, no files individuals.
- Els tokens privats es comparen amb hash o HMAC, mai amb text pla.
- El token privat no és posa en query params ni logs.
- La creació i gestio d'espais requereix sessió OAuth amb correu `@xtec.cat`.
- L'administracio global requereix sessió OAuth i autoritzacio explicita com a
  administrador, excepte el bootstrap inicial quan `admin_users` encara és
  buida.
- L'administracio del qüestionari no pot exposar `submissions` ni `answers`
  individuals al navegador.

## Estructura prevista

```text
app/
  page.tsx
  crear/page.tsx
  espais/page.tsx
  espais/[publicCode]/resultats/page.tsx
  q/[publicCode]/page.tsx
  resultats/[publicCode]/page.tsx
  resultats/compartit/[publicCode]/page.tsx
  admin/
    page.tsx
    versions/
    administradors/
  auth/callback/route.ts
  api/
    admin/
    spaces/route.ts
    spaces/[publicCode]/reset/route.ts
    submissions/route.ts
    results/route.ts
    reports/pdf/route.ts
components/
  questionnaire/
  results/
  ui/
lib/
  aggregation/
  crypto/
  database/
  pdf/
  questionnaire/
  admin/
  validation/
supabase/
  migrations/
  seed.sql
tests/
```

## Components de servidor

### `lib/crypto`

Responsabilitats:

- Generar codis públics amb `crypto.randomBytes` o Web Crypto server-side.
- Evitar caràcters confusos: `0`, `O`, `1`, `I`, `L`.
- Generar tokens privats amb com a mínim 32 bytes aleatoris.
- Calcular HMAC o hash de token amb secret del servidor.
- Comparacio segura de tokens.

Decisio implementada:

- Codi públic: 8 caràcters útils de l'alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, renderitzat com `C-XXXX-XXXX`, generat amb `crypto.randomInt`.
- Token privat: 32 bytes aleatoris codificats en base64url.
- Persistencia: `results_token_hash = HMAC-SHA256(token, PRIVATE_TOKEN_HMAC_SECRET)`.
- Recuperacio del token compartit: `results_token_encrypted` xifrat amb `RESULTS_TOKEN_ENCRYPTION_KEY`.

### `lib/database`

Responsabilitats:

- Crear client Supabase server-only amb `SUPABASE_SERVICE_ROLE_KEY`.
- Encapsular consultes sensibles.
- Evitar que components client importin clients amb privilegis.

### `lib/validation`

Responsabilitats:

- Esquemes estrictes per a cada endpoint.
- Rebuig de camps addicionals inesperats.
- Validació de `publicCode`, `privateToken` i respostes.

Decisio implementada:

- `zod` per validar payloads d'API amb `.strict()`.
- Validacio duplicada a PostgreSQL per a l'enviament de respostes mitjançant RPC.

### `lib/questionnaire`

Responsabilitats:

- Carregar qüestionari actiu o versionat.
- Validar que l'espai usa la versió esperada.
- Bloquejar inicialment l'edicio de versions assignades a espais i exigir una
  confirmacio explícita abans de corregir-les.
- Crear noves versions a partir d'una versio existent quan calgui fer canvis
  estructurals sobre un qüestionari que ja té respostes.

Regla de correccions:

- Una versio sense `diagnostic_space` associat es pot editar directament.
- Si una versio ja està assignada a un espai, la UI exigeix prémer `Editar` i
  acceptar un avís abans de desar.
- Si una versio està activa o ja té respostes, només es poden corregir títols i
  textos existents. Els canvis d'estructura requereixen una nova versio
  inactiva.
- Activar una versio només afecta els nous espais que es crein a partir
  d'aquell moment; els espais existents mantenen el seu `questionnaire_id`.

### `lib/admin`

Responsabilitats:

- Validar que l'usuari OAuth autenticat és administrador actiu.
- Encapsular operacions server-side de gestio de versions, blocs, preguntes i
  administradors.
- Evitar que components client importin el client Supabase amb `service_role`.
- Retornar només metadades de qüestionari i administracio, mai files
  individuals de `submissions` o `answers`.

### `lib/aggregation`

Responsabilitats:

- Calcular mitjana global.
- Calcular mitjana per bloc.
- Calcular mitjana per pregunta.
- Calcular distribucions per pregunta.
- Generar textos d'interpretació a partir de resultats de conjunt.

No ha d'exposar submissions individuals.

### `lib/pdf`

Responsabilitats:

- Generar PDF server-side amb `@react-pdf/renderer`.
- Reutilitzar dades de conjunt validades.
- No incloure token ni dades individuals.

## Endpoints

Nota d'implementacio: la UI d'administracio pot executar mutacions amb server
actions de Next.js sempre que mantinguin les mateixes garanties que els Route
Handlers: validacio server-side, comprovacio d'administrador actiu i ús exclusiu
del client Supabase amb `service_role` al servidor. Els endpoints
`app/api/admin/**` només són necessaris si cal exposar una API HTTP interna
separada de la pantalla `/admin`.

### `/admin`

Pantalla d'entrada a l'administracio.

Flux:

1. Si no hi ha sessió OAuth, mostrar accés amb Google.
2. Després del callback OAuth, validar que l'usuari és `@xtec.cat`.
3. Si `admin_users` és buida, crear aquest usuari com a primer administrador
   dins una operacio atòmica server-side i permetre l'accés.
4. Si `admin_users` no és buida, permetre l'accés només si l'usuari té una fila
   activa a `admin_users`.
5. Si l'usuari no és administrador actiu, mostrar accés denegat sense revelar
   metadades d'altres administradors.

El bootstrap inicial ha d'estar separat de la creació d'espais de diagnosi.
Crear un espai no concedeix permisos d'administracio.

La pantalla `/admin` implementada separa la gestio en dues vistes de menú:

- gestio de qüestionaris;
- gestio d'usuaris administradors.

La vista de gestio de qüestionaris mostra:

- llista de versions amb estat actiu, nombre de blocs, preguntes, espais i
  submissions;
- formulari únic per crear una versio en blanc o copiar una versio existent;
- editor de blocs i preguntes amb creacio i eliminacio d'elements;
- avís i confirmacio abans d'editar versions assignades a espais;
- activacio d'una versio completa amb confirmacio.
- eliminacio destructiva d'una versio no activa amb avís i confirmacio
  explícita.

La vista de gestio d'usuaris mostra la gestio d'administradors per
`auth.users.id`. Per fer la seleccio usable, el servidor pot consultar
Supabase Auth Admin amb `service_role`, cercar comptes XTEC per nom, cognoms o
correu i retornar només els camps necessaris per triar l'administrador. La taula
`admin_users` continua desant només l'identificador d'Auth i metadades de rol.

### Server action o `POST /api/admin/questionnaires`

Entrada: dades estrictament validades per crear una nova versio o clonar una
versio existent.

Flux:

1. Validar sessió OAuth.
2. Validar que l'usuari és administrador actiu.
3. Crear la nova fila de `questionnaires`.
4. Validar que el títol no dupliqui cap versio existent.
5. Crear blocs i preguntes associats dins una operacio transaccional quan es
   copia una versio existent.
6. Retornar només metadades de la versio creada.

### Server action o `PATCH /api/admin/questionnaires/[id]`

Entrada: canvis de títol, blocs o preguntes tancades.

Flux:

1. Validar sessió OAuth i rol administrador.
2. Comprovar si la versio està assignada a algun `diagnostic_space`.
3. Si no està assignada a cap espai, permetre correccions in-place.
4. Si ja està assignada a un espai, exigir confirmacio explícita.
5. Si està activa o ja té respostes, permetre només correccions de títols i
   textos mantenint la mateixa estructura de blocs i preguntes.

El desat pot deixar una versio sense respostes com a esborrany parcial, fins a
un màxim de 10 blocs i 10 preguntes per bloc. En afegir un bloc nou, la UI
afegeix una pregunta inicial. La validacio d'estructura activable es fa en
l'activacio, no en cada desat.

### Server action o `POST /api/admin/questionnaires/[id]/activate`

Entrada: sense cos o cos buit estrictament validat.

Flux:

1. Validar sessió OAuth i rol administrador.
2. Validar que la versio té entre 1 i 10 blocs, entre 1 i 10 preguntes per
   bloc i escala `0`, `1`, `2`.
3. Desactivar la versio activa anterior i activar la versio indicada dins una
   operacio transaccional.
4. No modificar cap `diagnostic_space` existent.

### Server action o `POST /api/admin/questionnaires/[id]/delete`

Entrada: identificador de versio no activa i confirmacio explícita
d'eliminacio.

Flux:

1. Validar sessió OAuth i rol administrador.
2. Exigir confirmacio explícita al formulari i avís de navegador.
3. Rebutjar versions actives.
4. Cridar una RPC server-only que elimina, en aquest ordre, `answers`,
   `submissions`, `diagnostic_spaces`, `questions`, `question_blocks` i
   `questionnaires` de la versio.
5. No retornar files individuals ni cossos de respostes.

### Server action o `POST /api/admin/admins`

Entrada: identificador d'usuari Supabase Auth seleccionat des d'una cerca
server-side d'usuaris Auth o introduit manualment.

Flux:

1. Validar sessió OAuth i rol administrador.
2. Cercar usuaris Auth només al servidor si cal mostrar candidats.
3. Crear o activar l'administrador guardant només `auth.users.id`.
4. Retornar metadades mínimes de gestio.

No s'ha de desar ni mostrar informació de participants en cap endpoint
d'administracio.

### `POST /api/spaces`

Entrada: cos buit o opcions futures estrictament validades.

Flux:

0. Comprovar que el creador autenticat no té ja un espai diagnòstic.
1. Generar codi públic.
2. Generar token privat.
3. Calcular HMAC del token.
4. Xifrar el token privat per recuperar-lo des de la gestio del creador.
5. Inserir `diagnostic_spaces` amb `owner_user_id` i el `questionnaire_id` de
   la versio activa en aquell moment.
5. Si hi ha col·lisió unique de codi públic, regenerar i reintentar.
6. Retornar enllaços públic i privat.

Resposta:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "públicUrl": "/q/C-7KX9-M2Q8",
  "sharedResultsUrl": "/resultats/compartit/C-7KX9-M2Q8#token=...",
  "ownerResultsUrl": "/espais/C-7KX9-M2Q8/resultats"
}
```

Si el creador ja té un espai, la resposta és `409` i la UI el deriva a la gestio de l'espai existent.

### `POST /api/spaces/[publicCode]/reset`

Entrada: sense cos.

Flux:

1. Validar sessió OAuth XTEC.
2. Validar que l'espai pertany al creador autenticat.
3. Generar un codi públic nou.
4. Generar un token privat nou, calcular HMAC i xifrar-lo.
5. Cridar la RPC server-only `public.reset_owner_diagnostic_space`.
6. Retornar nous enllaços públic, compartit i de resultats del creador.

La RPC elimina `answers` i `submissions` de l'espai, pero no elimina `questions`, `question_blocks` ni `questionnaires`. El canvi de codi públic i token invalida els enllaços antics.

### `POST /api/submissions`

Entrada:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "questionnaireVersion": "2026.2",
  "answers": [
    { "questionId": "uuid", "value": 0 }
  ]
}
```

Validacions:

- L'espai existeix.
- L'espai està actiu.
- La versió coincideix amb la versio assignada a l'espai quan es va crear.
- La versio assignada a l'espai no ha de continuar sent la versio activa; els
  espais existents poden seguir rebent submissions amb la seva versio original.
- L'espai encara no ha arribat a 300 submissions.
- Hi ha exactament una resposta per cada pregunta de la versio assignada a
  l'espai.
- No hi ha preguntes duplicades.
- Totes les preguntes pertanyen a la versió.
- Tots els valors són `0`, `1` o `2`.
- No hi ha camps addicionals.

Persistencia:

- Inserció de `submissions` i `answers` dins una transacció amb `public.create_submission_with_answers`.
- La RPC bloqueja la fila de `diagnostic_spaces` amb `FOR UPDATE` abans de comptar submissions per evitar superar el límit en enviaments simultanis.

Resposta:

```json
{ "ok": true }
```

### `POST /api/results`

Entrada:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "privateToken": "token"
}
```

Flux:

1. Validar forma del codi i token.
2. Buscar espai pel codi públic.
3. Comparar HMAC del token.
4. Calcular resultats de conjunt.
5. Retornar només dades de conjunt.

Implementacio actual:

- El token arriba només per `POST`.
- El client llegeix `#token=` i elimina el fragment visualment amb `history.replaceState`.
- La resposta no inclou token, submissions, dates individuals ni combinacions de respostes.
- El recompte de respostes es fa amb la RPC server-only `public.get_diagnostic_answer_counts(uuid)`, que retorna només totals agregats per pregunta i valor de l'escala.

### `POST /api/reports/pdf`

Entrada igual que `POST /api/results`.

Flux:

1. Validar token novament.
2. Calcular o reutilitzar resultats de conjunt server-side.
3. Generar PDF.
4. Retornar `application/pdf`.

Implementacio actual:

- El PDF es genera amb `@react-pdf/renderer` al runtime Node.
- Les gràfiques del PDF són barres simples renderitzades server-side a partir dels resultats de conjunt.
- No s'inclouen dades personals, token ni respostes individuals.

## Pagines

### `/`

Presenta l'eina i enllaça a `/crear`. Ha de reforçar que es tracta d'una diagnosi anònima amb resultats de conjunt.

### `/crear`

Abans de l'autenticació mostra dues capses: accés per a responsables i informació per al professorat participant. Després de l'autenticació permet crear l'únic espai del creador o gestionar l'espai existent: enllaços, resultats, regeneració de l'enllaç privat i reinici del qüestionari.

### `/espais`

Ruta de compatibilitat. Redirigeix a `/crear`, que és la pantalla única de gestio de l'espai del creador.

### `/q/[publicCode]`

Carrega metadades públiques mínimes del qüestionari necessari per respondre. No mostra dades de l'espai més enllà del codi.

### `/resultats/[publicCode]`

Client page o component client petit per llegir `window.location.hash`, extreure `token`, eliminar-lo visualment si escau i fer `POST /api/results`. No ha de renderitzar el token.

## Gestio d'errors

- Codis inexistents: missatge genèric.
- Token invàlid: missatge genèric sense revelar si el codi existeix.
- Espai inactiu: informar que la diagnosi no accepta respostes.
- Validacio de formulari: indicar camps pendents sense exposar detalls interns.
- Errors de servidor: no incloure payloads sensibles en logs.

## Observabilitat

Es poden registrar errors tècnics sense dades personals ni tokens. Cal evitar logar:

- `privateToken`
- cos complet de pèticions de resultats
- cos complet de submissions
- cap IP dins la base de dades de l'aplicació

## Decisions pendents

- Estrategia anti-bots i rate limiting.
- Politica de caducitat o tancament d'espais.
