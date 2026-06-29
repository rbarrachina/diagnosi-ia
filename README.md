# Diagnosi IA

Aplicació web per conèixer el grau d'ús educatiu de la intel·ligència artificial en centres educatius a partir de respostes anònimes i resultats de conjunt.

Diagnosi IA no identifica centres ni docents. No és una eina d'avaluació individual del professorat, sinó una eina de diagnosi global per orientar decisions de centre.

Aplicació en funcionament: https://diagnosi-ia.vercel.app/

## Estat del projecte

`main` continua sent la versio estable historica amb Vercel i
Supabase/PostgreSQL.

La branca `migration/mysql` és la branca experimental de migracio local. En
aquesta branca, el flux principal local funciona amb Next.js i MySQL local:

- carrega del qüestionari públic;
- creacio i gestio d'espais amb auth local provisional;
- enviament de respostes;
- resultats agregats;
- generacio de PDF;
- bootstrap i gestio bàsica de `admin_users` a MySQL;
- gestio avançada de versions de qüestionari a MySQL.

La carpeta `supabase/` es conserva intacta com a referencia historica de
`main`. El flux principal local de `migration/mysql` no necessita Supabase ni
Vercel.

L'autenticacio de `migration/mysql` ja no depen de Supabase. Es pot usar
`AUTH_MODE=local` per desenvolupament ràpid o `AUTH_MODE=google` per fer login
real amb Google OAuth i comptes `@xtec.cat`.

Abans d'implementar funcionalitat, cal mantenir com a referència:

- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PRIVACY.md](docs/PRIVACY.md)
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/LOCAL_MYSQL_SETUP.md](docs/LOCAL_MYSQL_SETUP.md)
- [docs/MYSQL_MIGRATION_WORK_INSTRUCTIONS.md](docs/MYSQL_MIGRATION_WORK_INSTRUCTIONS.md)

## Arquitectura a `migration/mysql`

- Next.js amb App Router
- TypeScript estricte
- Tailwind CSS
- MySQL 8.4 local
- Drizzle ORM amb `mysql2`
- Auth local provisional per desenvolupament
- Recharts per a gràfiques web
- `@react-pdf/renderer` per generar informes PDF al servidor
- Validacio estricta de dades al servidor
- Operacions sensibles només mitjançant Route Handlers o funcions de servidor
- Sense accés MySQL des del navegador
- Sense accés directe del navegador a `diagnostic_spaces`, `submissions` ni
  `answers`

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

## Executar localment amb MySQL

Canvia a la branca experimental:

```bash
git checkout migration/mysql
```

Instal·la dependències:

```bash
npm install
```

Arrenca MySQL i phpMyAdmin:

```bash
docker compose up -d
```

MySQL queda a `127.0.0.1:3306`. phpMyAdmin queda a
`http://127.0.0.1:8080`.

Crea `.env.local` localment. Aquest fitxer no s'ha de versionar i no ha de
contenir secrets reals del Departament:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="mysql://diagnosi_user:diagnosi_password@127.0.0.1:3306/diagnosi_ia"
PRIVATE_TOKEN_HMAC_SECRET=replace-with-strong-random-secret
RESULTS_TOKEN_ENCRYPTION_KEY=replace-with-32-byte-base64url-key
AUTH_MODE=local
LOCAL_AUTH_USER_ID=00000000-0000-4000-8000-000000000001
LOCAL_AUTH_EMAIL=usuari.prova@xtec.cat
LOCAL_AUTH_ALLOW_PRODUCTION=false
AUTH_SESSION_SECRET=replace-with-at-least-32-random-characters
AUTH_USER_ID_SECRET=replace-with-at-least-32-random-characters
```

Per provar login real amb Google sense Supabase:

```bash
AUTH_MODE=google
GOOGLE_CLIENT_ID=replace-with-google-oauth-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-oauth-client-secret
AUTH_SESSION_SECRET=replace-with-at-least-32-random-characters
AUTH_USER_ID_SECRET=replace-with-at-least-32-random-characters
AUTH_SESSION_MAX_AGE_SECONDS=28800
```

El client OAuth de Google ha de tenir autoritzada aquesta redireccio:

```text
http://localhost:3000/auth/callback
```

Aplica l'esquema i el seed local:

```bash
npm run db:push
npm run db:seed
```

Si es vol treballar amb migracions generades:

```bash
npm run db:generate
npm run db:migrate
```

Executa en desenvolupament:

```bash
npm run dev
```

Obre:

```text
http://localhost:3000
```

Per provar el mode produccio local:

```bash
npm run build
LOCAL_AUTH_ALLOW_PRODUCTION=true npm start
```

### Flux local que ha de funcionar

Amb `AUTH_MODE=local`, l'usuari local `LOCAL_AUTH_EMAIL` actua com a creador
XTEC provisional. Amb `AUTH_MODE=google`, `/auth/login` redirigeix a Google
OAuth, valida el `id_token` server-side, exigeix email `@xtec.cat` i crea una
sessio `httpOnly` signada. L'identificador desat a MySQL és un UUID opac
derivat amb HMAC; no es desa l'email a `admin_users` ni a `diagnostic_spaces`.

Per verificar `npm start` en local cal activar explícitament
`LOCAL_AUTH_ALLOW_PRODUCTION=true` en el procés. No s'ha d'activar en un
servidor real.

Flux principal:

1. Obre `/crear`.
2. Crea un espai de diagnosi.
3. Copia l'enllaç públic `/q/[publicCode]`.
4. Respon el qüestionari.
5. Consulta els resultats des de l'enllaç privat compartit o des de
   `/espais/[publicCode]/resultats`.
6. Genera el PDF des de la pantalla de resultats.
7. Prova la regeneracio de l'enllaç privat i el reset de l'espai des de
   `/crear`.

També es pot accedir a `/admin?section=admins` per fer el bootstrap local del
primer administrador a `admin_users`. Aquesta taula desa només
`LOCAL_AUTH_USER_ID` com identificador opac i metadades de rol; no copia nom,
cognoms ni email.

Regles de configuracio:

- Si `NEXT_PUBLIC_APP_URL` no està configurada, l'aplicació genera els enllaços a partir del domini de la petició.
- Si `NEXT_PUBLIC_APP_URL` apunta a `localhost` però la petició arriba des d'un domini públic, s'ignora per evitar enllaços de producció cap a local.
- `DATABASE_URL` no pot tenir prefix `NEXT_PUBLIC_`.
- `PRIVATE_TOKEN_HMAC_SECRET` només pot existir al servidor.
- `RESULTS_TOKEN_ENCRYPTION_KEY` només pot existir al servidor i ha de ser una clau base64url de 32 bytes.
- Cap secret pot exposar-se amb prefix `NEXT_PUBLIC_`.
- El token privat no s'ha d'incloure mai en query params ni logs.
- No cal cap variable `NEXT_PUBLIC_SUPABASE_*` ni `SUPABASE_SERVICE_ROLE_KEY`
  per al flux local.

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

Els creadors d'espais s'autentiquen amb el mode local provisional a
`migration/mysql`. Només s'accepta un email acabat en `@xtec.cat`. Aquest
identificador només serveix per crear i gestionar espais propis, no per
identificar participants. El professorat participant continua sense compte
d'usuari.

## Llicència

Pendent de decidir.
