# Arquitectura

## Stack

- Next.js App Router
- TypeScript estricte
- Tailwind CSS
- Vercel
- PostgreSQL a Supabase
- Recharts per a grafiques web
- `@react-pdf/renderer` per generar PDF al servidor

## Principis

- El client mai accedeix directament a taules sensibles.
- Totes les operacions sensibles passen per Route Handlers o funcions de servidor.
- El servidor valida totes les entrades amb esquemes estrictes.
- El servidor retorna resultats agregats, no files individuals.
- Els tokens privats es comparen amb hash o HMAC, mai amb text pla.
- El token privat no es posa en query params ni logs.

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

- Generar codis publics amb `crypto.randomBytes` o Web Crypto server-side.
- Evitar caracters confusos: `0`, `O`, `1`, `I`, `L`.
- Generar tokens privats amb minim 32 bytes aleatoris.
- Calcular HMAC o hash de token amb secret del servidor.
- Comparacio segura de tokens.

Decisio proposada:

- Codi public: 8 caracters utils de l'alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, renderitzat com `C-XXXX-XXXX`.
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
- Validacio de `publicCode`, `privateToken` i respostes.

Es recomana usar `zod` si s'accepta la dependencia. Alternativa: validacio manual fortament tipada.

### `lib/questionnaire`

Responsabilitats:

- Carregar questionari actiu o versionat.
- Validar que l'espai usa la versio esperada.
- Garantir que les preguntes d'una versio amb respostes no s'editen.

### `lib/aggregation`

Responsabilitats:

- Calcular mitjana global.
- Calcular mitjana per bloc.
- Calcular mitjana per pregunta.
- Calcular distribucions per pregunta.
- Generar textos d'interpretacio a partir d'agregats.

No ha d'exposar submissions individuals.

### `lib/pdf`

Responsabilitats:

- Generar PDF server-side amb `@react-pdf/renderer`.
- Reutilitzar dades agregades validades.
- No incloure token ni dades individuals.

## Endpoints

### `POST /api/spaces`

Entrada: cos buit o opcions futures estrictament validades.

Flux:

1. Generar codi public.
2. Generar token privat.
3. Calcular HMAC del token.
4. Inserir `diagnostic_spaces`.
5. Si hi ha col.lisio unique de codi public, regenerar i reintentar.
6. Retornar enllacos public i privat.

Resposta:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "publicUrl": "/q/C-7KX9-M2Q8",
  "privateResultsUrl": "/resultats/C-7KX9-M2Q8#token=..."
}
```

### `POST /api/submissions`

Entrada:

```json
{
  "publicCode": "C-7KX9-M2Q8",
  "questionnaireVersion": "2026.1",
  "answers": [
    { "questionId": "uuid", "value": 0 }
  ]
}
```

Validacions:

- L'espai existeix.
- L'espai esta actiu.
- La versio coincideix amb l'espai.
- Hi ha exactament 20 respostes.
- No hi ha preguntes duplicades.
- Totes les preguntes pertanyen a la versio.
- Tots els valors son `0`, `1` o `2`.
- No hi ha camps addicionals.

Persistencia:

- Insercio de `submissions` i `answers` dins una transaccio.

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
2. Buscar espai pel codi public.
3. Comparar HMAC del token.
4. Calcular agregats.
5. Retornar nomes agregats.

### `POST /api/reports/pdf`

Entrada igual que `POST /api/results`.

Flux:

1. Validar token novament.
2. Calcular o reutilitzar agregats server-side.
3. Generar PDF.
4. Retornar `application/pdf`.

## Pagines

### `/`

Presenta l'eina i enllaca a `/crear`. Ha de reforcar que es tracta d'una diagnosi anonima i agregada.

### `/crear`

Permet crear un espai anonim. Mostra els enllacos generats i recomana conservar l'enllac privat.

### `/q/[publicCode]`

Carrega metadades publiques minimes del questionari necessari per respondre. No mostra dades de l'espai mes enlla del codi.

### `/resultats/[publicCode]`

Client page o component client petit per llegir `window.location.hash`, extreure `token`, eliminar-lo visualment si escau i fer `POST /api/results`. No ha de renderitzar el token.

## Gestio d'errors

- Codis inexistents: missatge generic.
- Token invalid: missatge generic sense revelar si el codi existeix.
- Espai inactiu: informar que la diagnosi no accepta respostes.
- Validacio de formulari: indicar camps pendents sense exposar detalls interns.
- Errors de servidor: no incloure payloads sensibles en logs.

## Observabilitat

Es poden registrar errors tecnics sense dades personals ni tokens. Cal evitar logar:

- `privateToken`
- cos complet de peticions de resultats
- cos complet de submissions
- cap IP dins la base de dades de l'aplicacio

## Decisions pendents

- Dependencia de validacio: `zod` o validacio manual.
- Implementacio de transaccions: RPC SQL a Supabase o connexio Postgres directa server-side.
- Estrategia anti-bots i rate limiting en fase 2.
- Politica de caducitat o tancament d'espais.
