# Configuracio local de MySQL

Aquest document recull la configuracio MySQL nomes local de la branca
experimental `migration/mysql`.

`main` continua usant Supabase/PostgreSQL. No facis servir aquest document com
a guia de desplegament de produccio.

## Arrencar MySQL

```bash
docker compose up -d
```

El fitxer Compose arrenca MySQL 8.4 a `127.0.0.1:3306` i phpMyAdmin a
`http://127.0.0.1:8080`.

MySQL local:

- base de dades: `diagnosi_ia`
- usuari: `diagnosi_user`
- contrasenya: `diagnosi_password`
- charset: `utf8mb4`
- collation: `utf8mb4_unicode_ci`
- volum persistent: `diagnosi_ia_mysql_data`

## Interficie web amb phpMyAdmin

Obre:

```text
http://127.0.0.1:8080
```

Credencials locals:

- usuari: `diagnosi_user`
- contrasenya: `diagnosi_password`
- base de dades: `diagnosi_ia`

phpMyAdmin està configurat per connectar al servei MySQL intern `mysql`. És
només una eina local de desenvolupament. No s'ha de considerar part del
desplegament de produccio.

## Entorn local

Crea `.env.local` localment. Aquest fitxer està ignorat per Git i no s'ha de
commitejar.

```bash
DATABASE_URL="mysql://diagnosi_user:diagnosi_password@127.0.0.1:3306/diagnosi_ia"
PRIVATE_TOKEN_HMAC_SECRET="replace-with-strong-random-secret"
RESULTS_TOKEN_ENCRYPTION_KEY="replace-with-32-byte-base64url-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth local provisional, nomes per desenvolupament a migration/mysql.
AUTH_MODE="local"
LOCAL_AUTH_USER_ID="00000000-0000-4000-8000-000000000001"
LOCAL_AUTH_EMAIL="usuari.prova@xtec.cat"
# Nomes per verificar `npm start` en local. No activar en un servidor real.
LOCAL_AUTH_ALLOW_PRODUCTION="false"
AUTH_SESSION_SECRET="replace-with-at-least-32-random-characters"
AUTH_USER_ID_SECRET="replace-with-at-least-32-random-characters"
```

El flux principal local no necessita variables de Supabase. Les variables
`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` no són
necessaries per carregar qüestionaris, crear espais, respondre, consultar
resultats o generar PDF en `migration/mysql`.

## Autenticacio sense Supabase

La branca `migration/mysql` no necessita Supabase Auth. Té dos modes:

- `AUTH_MODE=local`: mode provisional per desenvolupament ràpid.
- `AUTH_MODE=google`: login real amb Google OAuth i comptes `@xtec.cat`.

### Auth local provisional

La branca `migration/mysql` inclou un mode local provisional per provar el flux
de creador i el bootstrap d'administracio sense Supabase Auth.

Aquest mode:

- nomes s'activa amb `AUTH_MODE=local`;
- no s'activa en produccio excepte si s'habilita explícitament
  `LOCAL_AUTH_ALLOW_PRODUCTION=true` per verificar `npm start` en local;
- exigeix que `LOCAL_AUTH_EMAIL` acabi en `@xtec.cat`;
- usa `LOCAL_AUTH_USER_ID` com a identificador opac de creador o administrador;
- no crea comptes per al professorat participant;
- no desa nom, cognoms ni email a `admin_users`.

### Google OAuth sense Supabase

Per provar el login real en local:

```bash
AUTH_MODE="google"
GOOGLE_CLIENT_ID="replace-with-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="replace-with-google-oauth-client-secret"
AUTH_SESSION_SECRET="replace-with-at-least-32-random-characters"
AUTH_USER_ID_SECRET="replace-with-at-least-32-random-characters"
AUTH_SESSION_MAX_AGE_SECONDS="28800"
```

Al client OAuth de Google cal autoritzar la redireccio:

```text
http://localhost:3000/auth/callback
```

El servidor valida el `id_token` amb Google, exigeix email `@xtec.cat` i crea
una cookie de sessio `httpOnly` signada. L'identificador que es desa com
`owner_user_id` o `admin_users.user_id` és un UUID opac derivat amb HMAC de
l'identificador de Google. No es desa l'email a MySQL.

`AUTH_USER_ID_SECRET` s'ha de mantenir estable entre desplegaments. Si canvia,
canviarà l'UUID opac derivat per al mateix compte Google.

## Comandes Drizzle

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

La Fase 1 nomes crea la infraestructura. L'esquema MySQL real i les dades de
seed s'afegeixen a la Fase 2.
