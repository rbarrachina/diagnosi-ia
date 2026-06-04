# Diagnosi IA

Aplicació web per conèixer el grau d'ús educatiu de la intel·ligència artificial en centres educatius a partir de respostes anònimes i resultats de conjunt.

Diagnosi IA no identifica centres ni docents. No és una eina d'avaluació individual del professorat, sinó una eina de diagnosi global per orientar decisions de centre.

## Estat del projecte

Aquest repositori té implementades les primeres fases:

- Fase 1: aplicació Next.js inicial, TypeScript estricte, Tailwind CSS, lint, tests i estructura base.
- Fase 2: esquema PostgreSQL per a Supabase, seed del qüestionari, restriccions i RLS.
- Fase 3: creació d'espais anònims, generació segura de codi públic i token privat, formulari públic i enviament validat de respostes.
- Fase 4: tauler privat de resultats de conjunt, gràfiques web i informe PDF server-side.

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
- `/q/[publicCode]`
- `/resultats/[publicCode]`
- `POST /api/spaces`
- `POST /api/submissions`
- `POST /api/results`
- `POST /api/reports/pdf`

## Variables d'entorn previstes

El projecte haurà d'incloure un fitxer `.env.example` sense secrets reals:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-key
PRIVATE_TOKEN_HMAC_SECRET=replace-with-strong-random-secret
```

Regles:

- `SUPABASE_SERVICE_ROLE_KEY` només pot existir al servidor.
- `PRIVATE_TOKEN_HMAC_SECRET` només pot existir al servidor.
- Cap secret pot exposar-se amb prefix `NEXT_PUBLIC_`.
- El token privat no s'ha d'incloure mai en query params ni logs.

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

L'aplicació no ha de recollir ni desar:

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

## Llicència

Pendent de decidir.
