# Arquitectura

## Stack actiu

- Next.js amb App Router i runtime Node.js.
- TypeScript en mode estricte.
- Tailwind CSS.
- MySQL 8.4.
- Drizzle ORM amb `mysql2`.
- Google OAuth amb sessió server-side pròpia.
- Recharts per a les gràfiques web.
- `@react-pdf/renderer` per als informes PDF.

## Principis

- El navegador no es connecta directament a MySQL.
- `DATABASE_URL` i la resta de secrets només existeixen al servidor.
- Totes les operacions sensibles passen per Route Handlers, server actions o
  funcions server-only.
- El servidor valida les entrades amb esquemes estrictes i rebutja camps
  addicionals.
- Les operacions que afecten diverses taules s'executen dins una transacció.
- Els resultats web i PDF es construeixen exclusivament amb dades agregades.
- Cap endpoint retorna files individuals de `submissions` o `answers`.
- Els tokens privats es desen com HMAC per validar-los i xifrats per
  recuperar-los; mai en text pla.
- Els tokens no apareixen en query strings, logs, errors o PDFs.

## Límits de confiança

### Navegador

El navegador pot rebre el qüestionari públic, metadades mínimes de l'espai i
resultats agregats. No pot importar el client de base de dades ni rebre
identificadors de submissions, respostes individuals o secrets.

### Servidor Next.js

El servidor valida sessió, rol, propietat, tokens i payloads. També coordina les
transaccions i transforma consultes agregades en els models del tauler i del
PDF.

### MySQL

MySQL conserva l'esquema relacional i les restriccions d'integritat. L'accés
queda limitat al servidor de l'aplicació. Les credencials de base de dades no es
comparteixen amb el client.

## Capes

- `app/`: pàgines, Route Handlers i server actions.
- `components/`: formularis i presentació.
- `lib/auth/`: Google OAuth, mode local i cookies de sessió.
- `lib/db/`: client i esquema Drizzle server-only.
- `lib/repositories/`: consultes i transaccions MySQL.
- `lib/submissions/`: validació i creació atòmica de respostes.
- `lib/results/`: obtenció i càlcul de resultats agregats.
- `lib/admin/`: administració autoritzada.
- `lib/crypto/`: codis, HMAC i xifrat.
- `lib/pdf/`: renderització server-side de l'informe.
- `lib/validation/`: esquemes estrictes.

## Autenticació i autorització

`AUTH_MODE=google` inicia el flux OAuth, valida el token de Google al servidor,
exigeix un correu `@xtec.cat` i crea una cookie `httpOnly` signada.

L'identificador desat per a creadors i bloquejos de resposta és un UUID opac
derivat amb HMAC. El correu no es copia a `diagnostic_spaces`,
`submission_locks`, `submissions` ni `answers`.

`AUTH_MODE=local` és exclusiu de desenvolupament. En producció queda
desactivat, tret d'una habilitació explícita destinada només a verificacions
locals.

L'administració exigeix una fila activa a `admin_users`. Els administradors no
són anònims: aquesta taula pot contenir el correu, nom visible i darrera entrada
necessaris per gestionar l'accés. Aquestes dades no es poden relacionar amb
respostes.

## Fluxos sensibles

### Creació d'espai

1. Validar la sessió XTEC i el mode d'accés configurat.
2. Verificar que el creador no tingui ja un espai.
3. Generar codi públic i token privat.
4. Calcular l'HMAC i xifrar el token.
5. Crear l'espai amb la versió activa dins una operació server-side.
6. Retornar només els enllaços necessaris.

### Enviament de respostes

1. Validar sessió, codi públic i payload.
2. Iniciar una transacció MySQL.
3. Bloquejar la fila de l'espai.
4. Validar estat, versió, preguntes, duplicats i límit de 300 respostes.
5. Crear el bloqueig HMAC contra repeticions.
6. Inserir `submission` i `answers`.
7. Confirmar o revertir la transacció.

### Resultats i PDF

1. Validar de nou la propietat o el token privat.
2. Consultar únicament recomptes agrupats per pregunta i valor.
3. Construir el model agregat.
4. Retornar el tauler o generar el PDF sense dades individuals.

### Administració

Les lectures i mutacions d'administració validen sessió i rol al servidor.
L'edició de qüestionaris manté les regles de versionat. Els resultats globals
s'agrupen per versió i no admeten filtres per espai, creador, persona o data.

## Gestió d'errors i observabilitat

Els errors visibles són genèrics. No es registren tokens, payloads complets de
respostes, correus de participants, IPs ni informació de dispositiu.

## Decisions pendents

- Rate limiting i protecció anti-bots.
- Política de retenció i tancament d'espais.
- Infraestructura definitiva de desplegament i còpies de seguretat.
- Revisió legal o DPO abans d'un ús institucional ampli.
