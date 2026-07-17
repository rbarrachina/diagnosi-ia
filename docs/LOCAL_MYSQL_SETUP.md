# Configuració local de MySQL

## Arrencar els serveis

```bash
docker compose up -d
```

MySQL 8.4 queda disponible a `127.0.0.1:3306` i phpMyAdmin a
`http://127.0.0.1:8080`.

Credencials locals:

- base de dades: `diagnosi_ia`;
- usuari: `diagnosi_user`;
- contrasenya: `diagnosi_password`;
- charset: `utf8mb4`.

Aquestes credencials són exclusives de desenvolupament local.

## Entorn

Copia `.env.example` a `.env.local` i substitueix els valors de mostra. El
fitxer `.env.local` està ignorat per Git i no s'ha de versionar.

`DATABASE_URL`, les claus HMAC, la clau de xifrat i els secrets OAuth són
server-side i no poden tenir prefix `NEXT_PUBLIC_`.

## Autenticació

- `AUTH_MODE=local`: desenvolupament ràpid.
- `AUTH_MODE=google`: OAuth real; els responsables usen `@xtec.cat` i el
  professorat els dominis Google configurats pel centre.

El mode local queda desactivat en producció. L'excepció
`LOCAL_AUTH_ALLOW_PRODUCTION=true` només serveix per verificar localment
`npm start` i no s'ha d'activar en un servidor.

Per al mode Google, autoritza:

```text
http://localhost:3000/auth/callback
```

`AUTH_USER_ID_SECRET` s'ha de mantenir estable perquè determina els
identificadors opacs.

## Esquema i dades

```bash
npm run db:push
npm run db:seed
```

Per treballar amb migracions versionades:

```bash
npm run db:generate
npm run db:migrate
```

## Aplicació

```bash
npm run dev
```

Obre `http://localhost:3000`.
