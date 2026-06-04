# Arquitectura

## Stack

- Next.js App Router
- TypeScript estricte
- Tailwind CSS
- Vercel
- PostgreSQL a Supabase
- Recharts per a gràfiques web
- `@react-pdf/renderer` per generar PDF al servidor

## Principis

- El client mai accedeix directament a taules sensibles.
- Totes les operacions sensibles passen per Route Handlers o funcions de servidor.
- El servidor valida totes les entrades amb esquemes estrictes.
- El servidor retorna resultats de conjunt, no files individuals.
- Els tokens privats es comparen amb hash o HMAC, mai amb text pla.
- El token privat no és posa en query params ni logs.

## Estructura prevista

```text
app/
  page.tsx
  crear/page.tsx
  q/[publicCode]/page.tsx
  resultats/[publicCode]/page.tsx
  api/
    spaces/route.ts
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
- Persistencia: `private_token_hmac = HMAC-SHA256(token, PRIVATE_TOKEN_HMAC_SECRET)`.

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
- Garantir que les preguntes d'una versió amb respostes no s'editen.

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

### `POST /api/spaces`

Entrada: cos buit o opcions futures estrictament validades.

Flux:

1. Generar codi públic.
2. Generar token privat.
3. Calcular HMAC del token.
4. Inserir `diagnostic_spaces`.
5. Si hi ha col·lisió unique de codi públic, regenerar i reintentar.
6. Retornar enllaços públic i privat.

Resposta:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "públicUrl": "/q/C-7KX9-M2Q8",
  "privateResultsUrl": "/resultats/C-7KX9-M2Q8#token=..."
}
```

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
- La versió coincideix amb l'espai.
- Hi ha exactament 20 respostes.
- No hi ha preguntes duplicades.
- Totes les preguntes pertanyen a la versió.
- Tots els valors són `0`, `1` o `2`.
- No hi ha camps addicionals.

Persistencia:

- Inserció de `submissions` i `answers` dins una transacció amb `public.create_submission_with_answers`.

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

Permet crear un espai anònim. Mostra els enllaços generats i recomana conservar l'enllaç privat.

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
