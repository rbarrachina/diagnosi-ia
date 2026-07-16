# Pla d'implementació

## Estat actual

L'aplicació funciona amb Next.js i MySQL i disposa de:

- qüestionari públic versionat;
- Google OAuth i mode local de desenvolupament;
- creació, gestió i reinici d'un espai per creador;
- enviaments atòmics amb bloqueig contra respostes repetides;
- resultats agregats i PDF;
- administració de versions, responsables, administradors i comunicat global;
- resultats globals agregats per versió.

Queden fora de l'abast actual el rate limiting, la protecció anti-bots, la
retenció automàtica i el tancament d'espais.

## Fase 0 — Governança del repositori

Objectiu: establir un flux de canvis verificable.

- `main` és la branca estable.
- Cada canvi es fa en una branca curta.
- Els commits segueixen Conventional Commits.
- Cada integració passa per Pull Request.
- La CI executa lint, type check, proves i build.
- `CHANGELOG.md` i les versions de l'aplicació segueixen SemVer.

## Fase 1 — Base tècnica

Estat: completada.

- Next.js, TypeScript estricte i Tailwind.
- MySQL 8.4, Drizzle ORM i `mysql2`.
- Variables d'entorn server-side.
- Estructura de proves amb Vitest.

## Fase 2 — Esquema i qüestionari

Estat: completada.

- Esquema MySQL a `lib/db/schema.ts`.
- Migracions Drizzle a `drizzle/`.
- Seed de la versió activa.
- Restriccions de pertinença entre versions.
- Cap taula o camp identificatiu de centre.

## Fase 3 — Criptografia i validació

Estat: completada.

- Codis públics sense caràcters ambigus.
- Tokens aleatoris de 32 bytes.
- HMAC per validar i xifrat per recuperar tokens.
- Esquemes estrictes que rebutgen camps addicionals.

## Fase 4 — Espais i autenticació

Estat: completada.

- Google OAuth amb comptes XTEC.
- Mode local només per desenvolupament.
- Identificadors opacs derivats amb HMAC.
- Un espai per creador.
- Regeneració de token i reinici transaccional.

## Fase 5 — Submissions

Estat: completada.

- Sessió XTEC requerida per respondre.
- Bloqueig HMAC separat de submissions i answers.
- Validació de totes les preguntes de la versió assignada.
- Valors 0, 1, 2 i 3.
- Límit de 300 respostes.
- Inserció transaccional amb bloqueig de concurrència.

## Fase 6 — Resultats i PDF

Estat: completada.

- Validació de propietat o token al servidor.
- Consultes MySQL agregades.
- Tauler i PDF sense files individuals.
- Token privat només al fragment de l'enllaç i al cos POST.
- Avís metodològic amb poques respostes.

## Fase 7 — Administració

Estat: completada.

- Bootstrap atòmic del primer administrador.
- Invitacions per correu XTEC separades de les respostes.
- Gestió de versions, blocs, preguntes i configuració.
- Edició protegida de versions assignades.
- Resultats globals i PDF agregats per versió.

## Fase 8 — Enduriment pendent

- Afegir rate limiting sense desar IPs a la base de dades.
- Definir protecció anti-bots compatible amb l'anonimat.
- Aprovar política de retenció i eliminació.
- Definir tancament o caducitat d'espais.
- Fer revisió legal o DPO.
- Definir infraestructura, còpies de seguretat i recuperació.

Cada canvi d'aquesta fase ha d'actualitzar els documents normatius, afegir
proves i superar la checklist de privacitat.

## Qualitat obligatòria

Abans d'integrar qualsevol canvi:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

També cal revisar el diff, cercar secrets i confirmar que no s'han introduït
dades identificatives ni endpoints individuals.
