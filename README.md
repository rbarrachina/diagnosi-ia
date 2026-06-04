# Diagnosi IA

Aplicacio web per coneixer el grau d'us educatiu de la intel.ligencia artificial en centres educatius a partir de respostes anonimes i resultats agregats.

Diagnosi IA no identifica centres ni docents. No es una eina d'avaluacio individual del professorat, sino una eina de diagnosi agregada per orientar decisions de centre.

## Estat del projecte

Aquest repositori te implementada la primera fase tecnica: aplicacio Next.js inicial, TypeScript estricte, Tailwind CSS, lint, tests i estructura de carpetes base.

La funcionalitat de negoci encara no esta implementada. En particular, encara no hi ha integracio amb Supabase, creacio d'espais, formulari de respostes, resultats ni PDF.

Abans d'implementar funcionalitat, cal mantenir com a referencia:

- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PRIVACY.md](docs/PRIVACY.md)
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

## Arquitectura prevista

- Next.js amb App Router
- TypeScript estricte
- Tailwind CSS
- Vercel per al desplegament
- PostgreSQL a Supabase
- Recharts per a grafiques web
- `@react-pdf/renderer` per generar informes PDF al servidor
- Validacio estricta de dades al servidor
- Operacions sensibles nomes mitjancant Route Handlers o funcions de servidor
- Sense acces directe del navegador a les taules de respostes

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

El projecte haura d'incloure un fitxer `.env.example` sense secrets reals:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-key
PRIVATE_TOKEN_HMAC_SECRET=replace-with-strong-random-secret
```

Regles:

- `SUPABASE_SERVICE_ROLE_KEY` nomes pot existir al servidor.
- `PRIVATE_TOKEN_HMAC_SECRET` nomes pot existir al servidor.
- Cap secret pot exposar-se amb prefix `NEXT_PUBLIC_`.
- El token privat no s'ha d'incloure mai en query params ni logs.

## Com executar el projecte

Instal.lar dependencies:

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

L'aplicacio no ha de recollir ni desar:

- nom del centre
- codi oficial del centre
- nom o cognoms dels docents
- correus electronics
- comptes d'usuari
- identificadors personals
- informacio del dispositiu
- adreces IP a la base de dades de l'aplicacio
- respostes obertes

No ha d'existir cap taula anomenada `centres`. La taula principal d'espais anonims s'ha d'anomenar `diagnostic_spaces`.

## Llicencia

Pendent de decidir.
