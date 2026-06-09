# Diagnosi IA

Aplicació web per conèixer el grau d'ús educatiu de la intel·ligència artificial en centres educatius a partir de respostes anònimes i resultats de conjunt.

Diagnosi IA no identifica centres ni docents. No és una eina d'avaluació individual del professorat, sinó una eina de diagnosi global per orientar decisions de centre.

Aplicació en funcionament: https://diagnosi-ia.vercel.app/

## Estat del projecte

Aquest repositori té implementades les primeres fases:

- Fase 1: aplicació Next.js inicial, TypeScript estricte, Tailwind CSS, lint, tests i estructura base.
- Fase 2: esquema PostgreSQL per a Supabase, seed del qüestionari, restriccions i RLS.
- Fase 3: creació d'espais anònims, generació segura de codi públic i token privat, formulari públic i enviament validat de respostes.
- Fase 4: tauler privat de resultats de conjunt, gràfiques web i informe PDF server-side.
- Fase 5: autenticació OAuth amb Google/Supabase Auth per a creadors XTEC i gestió dels espais propis.

Encara no estan implementats l'enduriment de rate limiting, protecció anti-bots, política de retenció i tancament d'espais.

Abans d'implementar funcionalitat, cal mantenir com a referència:

- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PRIVACY.md](docs/PRIVACY.md)
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md)
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

## Arquitectura prevista

- Next.js amb App Router
- TypeScript estricte
- Tailwind CSS
- Vercel per al desplegament
- PostgreSQL a Supabase
- Recharts per a gràfiques web
- `@react-pdf/renderer` per generar informes PDF al servidor
- Validacio estricta de dades al servidor
- Operacions sensibles només mitjançant Route Handlers o funcions de servidor
- Sense accés directe del navegador a les taules de respostes

## Rutes previstes

- `/`
- `/crear`
- `/espais`
- `/espais/[publicCode]/resultats`
- `/q/[publicCode]`
- `/resultats/[publicCode]`
- `/resultats/compartit/[publicCode]`
- `/auth/login`
- `/auth/callback`
- `/auth/logout`
- `POST /api/spaces`
- `POST /api/spaces/[publicCode]/results-token`
- `POST /api/submissions`
- `POST /api/results`
- `POST /api/reports/pdf`
- `POST /api/reports/pdf/owner`

## Variables d'entorn previstes

El projecte haurà d'incloure un fitxer `.env.example` sense secrets reals:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-key
PRIVATE_TOKEN_HMAC_SECRET=replace-with-strong-random-secret
RESULTS_TOKEN_ENCRYPTION_KEY=replace-with-32-byte-base64url-key
```

Regles:

- En producció, `NEXT_PUBLIC_APP_URL` ha d'apuntar a `https://diagnosi-ia.vercel.app`.
- Si `NEXT_PUBLIC_APP_URL` no està configurada, l'aplicació genera els enllaços a partir del domini de la petició.
- Si `NEXT_PUBLIC_APP_URL` apunta a `localhost` però la petició arriba des d'un domini públic, s'ignora per evitar enllaços de producció cap a local.
- `SUPABASE_SERVICE_ROLE_KEY` només pot existir al servidor.
- `PRIVATE_TOKEN_HMAC_SECRET` només pot existir al servidor.
- `RESULTS_TOKEN_ENCRYPTION_KEY` només pot existir al servidor i ha de ser una clau base64url de 32 bytes.
- Cap secret pot exposar-se amb prefix `NEXT_PUBLIC_`.
- El token privat no s'ha d'incloure mai en query params ni logs.
- Supabase Auth ha de tenir configurat Google OAuth i les redireccions `/auth/callback`.

## Base de dades

La fase de base de dades inclou:

- `supabase/migrations/20260604130000_initial_schema.sql`
- `supabase/migrations/20260604131500_add_composite_foreign_key_indexes.sql`
- `supabase/migrations/20260604143000_create_submission_rpc.sql`
- `supabase/seed.sql`

Consulta [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) per aplicar manualment les migracions i el seed a Supabase.

## Com executar el projecte

Instal·lar dependències:

```bash
npm install
```

Executar en desenvolupament:

```bash
npm run dev
```

Comprovacions:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Privacitat

L'aplicació no ha de recollir ni desar per al professorat participant:

- nom del centre
- codi oficial del centre
- nom o cognoms dels docents
- correus electrònics
- comptes d'usuari
- identificadors personals
- informació del dispositiu
- adreces IP a la base de dades de l'aplicació
- respostes obertes

No ha d'existir cap taula anomenada `centres`. La taula principal d'espais anònims s'ha d'anomenar `diagnostic_spaces`.

Els creadors d'espais sí que s'autentiquen amb Supabase Auth i Google OAuth. Només s'accepten comptes amb correu acabat en `@xtec.cat`; aquest compte només serveix per crear i gestionar els espais propis, no per identificar participants.

## Llicència

Pendent de decidir.
