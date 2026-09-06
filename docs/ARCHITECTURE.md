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

### Arquitectura visual

- `app/globals.css` conté exclusivament les directives base de Tailwind.
- `app/styles/tokens.css` defineix els tokens semàntics de color i les dues
  paletes de l'aplicació. `tailwind.config.ts` consumeix aquests tokens, de
  manera que classes com `bg-surface`, `text-muted`, `border-line` o
  `bg-action` funcionen igual a totes les rutes i canvien amb el tema sense
  selectors correctius.
- `app/styles/shell.css`, `home.css`, `questionnaire.css` i `workspace.css`
  separen respectivament la carcassa compartida, la portada, les escales del
  qüestionari i la navegació o els gràfics de l'espai autenticat.
- `AppHeader`, `AppLogoLink`, `AppLogoMark` i `CentreAppShell` són els únics
  orígens del patró de capçalera, marca i fons autenticat. Les pàgines passen
  només el contingut i les dades del compte; no reprodueixen les capes visuals.
- Els estils inline queden reservats a valors calculats en temps d'execució,
  com l'amplada del progrés i els colors de les sèries dels gràfics.

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

`AUTH_MODE=google` inicia el flux OAuth, valida el token de Google al servidor i
crea una cookie `httpOnly` signada. Els responsables han de tenir correu
`@xtec.cat`. El professorat ha de coincidir exactament amb `@xtec.cat` o amb el
domini de Google Workspace configurat pel centre.

L'identificador desat per a responsables i bloquejos de resposta és un UUID
opac derivat amb HMAC. El correu i nom del responsable es desen a
`centre_accounts`, però no es copien a `submission_locks`, `submissions` ni
`answers`.

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
2. Crear o actualitzar el compte i la fitxa institucional de qualsevol
   responsable autoritzat. En mode `all_xtec`, els correus XTEC no oficials
   reben una fitxa de prova; els administradors la poden rebre en qualsevol
   mode. Les fonts públiques es consulten sempre des del servidor.
3. Exigir al servidor la confirmació de la fitxa i la configuració dels dominis
   docents abans de crear l'espai. Verificar que el centre no tingui ja un espai.
4. Generar codi públic i token privat.
5. Calcular l'HMAC i xifrar el token.
6. Crear l'espai amb la versió activa i un `centre_id` obligatori dins una
   operació server-side.
7. Retornar només els enllaços necessaris.

### Fonts de centres

La integració amb Socrata i amb la font versionada de serveis educatius és
server-only. Les respostes externes es validen amb esquemes estrictes i només
se seleccionen els camps necessaris. La base de dades conserva el darrer intent
de consulta, la darrera actualització correcta i un estat genèric d'error.

Fonts i atribució:

- Directori de centres docents anual, Departament d'Educació:
  `https://analisi.transparenciacatalunya.cat/d/kvmv-ahh4`.
- Relació pública de Serveis Educatius de Zona, incorporada mitjançant la
  instantània atribuïda a
  `https://github.com/rbarrachina/fitxa-centres-educatius`.

### Enviament de respostes

1. Validar sessió Google, codi públic, domini configurat i payload.
2. Iniciar una transacció MySQL.
3. Bloquejar la fila de l'espai.
4. Tornar a validar dins la transacció el domini exacte vigent, l'estat, la
   versió, les preguntes, els duplicats i el límit de 300 respostes.
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
s'agrupen per versió i poden limitar-se a un `centre_id` validat. Tant l'àmbit
global com el d'un centre apliquen el llindar mínim abans de computar respostes.
No admeten filtres per espai, creador, persona o data.
La ruta `/admin` conserva aquesta lògica al servidor i presenta les sis
seccions dins la carcassa visual compartida de l'aplicació. La navegació lateral
només construeix enllaços amb `section` i `questionnaireId`; no replica ni mou
cap lectura, formulari o mutació al client. L'estat plegat del menú és una
preferència visual local independent de les dades administratives.

La secció inicial `Resum` calcula els indicadors amb consultes SQL agregades.
Els totals de respostes només sumen espais que superen el llindar global i no
seleccionen respostes individuals ni camps d'`answers`. La fitxa del
qüestionari actiu usa el mateix criteri de computabilitat.
Els enllaços del resum transmeten únicament un filtre enumerat a la secció de
centres. El servidor valida aquest valor contra una llista tancada i construeix
la condició SQL corresponent; la cerca i la selecció de centre conserven el
filtre sense exposar dades addicionals.

La llista de seleccio de centres llegeix només identitat institucional de
`centres` associats a un espai i la relacio `centre_id`–`questionnaire_id` per
a combinacions que superen el llindar. Aquesta relacio alimenta al client dos
selectors dependents, sense enviar recomptes ni respostes. La consulta de
resultats filtra els espais elegibles per `questionnaire_id`, `centre_id`
opcional i llindar, i retorna únicament recomptes agrupats per pregunta i valor.
El PDF rep l'àmbit al cos POST i repeteix la mateixa validacio i agregacio.

La gestió de centres llegeix `centres`, `centre_accounts`, l'espai i un
recompte correlacionat de `submissions`; no selecciona files ni camps de
`answers`. Les suspensions, reinicis i eliminacions bloquegen el centre i
s'executen en una transacció. Suspendre marca el centre i desactiva el seu
espai; les validacions de responsable, política pública i enviament rebutgen
els centres suspesos. Les accions destructives eliminen les dependències en
l'ordre requerit per les claus foranes i registren només metadades
administratives a `admin_centre_actions`.

## Gestió d'errors i observabilitat

Els errors visibles són genèrics. No es registren tokens, payloads complets de
respostes, correus de participants, IPs ni informació de dispositiu.

## Pàgines d'entrada

- `/` és l'única portada informativa. Mostra objectiu, indicador, rols i accés
  del responsable. La versió mostrada prové de `package.json`; l'autoria, la
  llicència i el repositori són al peu de pàgina. La capçalera fixa activa
  progressivament una superfície translúcida i desenfocada després d'un marge
  inicial de `scrollY`. La intensitat s'interpola durant el tram següent i una
  pseudo-capa degradada suavitza el límit inferior. La corba smoothstep
  amplificada manté l'inici subtil, accelera el tram central i arriba a un estat
  final més opac i desenfocat. La capa de `backdrop-filter` usa una màscara
  vertical perquè el contingut entri transparent per sota i es difumini
  progressivament cap a la part superior. El selector clar/fosc desa la
  preferència a `localStorage`; no envia aquesta preferència al servidor. El
  selector d'idioma és informatiu, es presenta com a `CA` desplegable i no
  modifica la llengua de la pàgina. El layout arrel carrega la configuració
  global que en controla la visibilitat i les llengües previstes a totes les
  capçaleres compartides, inclosa la del qüestionari públic. La mostra de
  pregunta situada al final
  de la portada és JSX estàtic: copia la primera pregunta i les opcions de la
  versió `2026.2`, no carrega dades de MySQL i no renderitza cap control que
  pugui enviar una resposta. Els accessos de responsable obren un diàleg
  client nadiu que explica el requisit de compte institucional de centre abans
  de continuar cap a la mateixa ruta de Google OAuth. El diàleg no valida ni
  desa dades: la validació efectiva es manté exclusivament al servidor.
- El layout arrel executa un inicialitzador mínim de tema abans de pintar el
  cos del document. Llegeix la mateixa preferència local del selector i aplica
  `data-theme` i `color-scheme` abans de la hidratació per evitar superfícies
  clares transitòries durant la navegació completa.
- `/crear` és la pantalla autenticada de creació i gestió de l'espai. Reutilitza
  la capçalera fixa de la portada i substitueix l'accés pel menú del compte,
  amb el tancament de sessió. Un contenidor client manté muntades les vistes
  centrals de qüestionari, fitxa i configuració de correus per preservar-ne
  l'estat local mentre s'alterna entre totes tres. El mateix estat governa una
  sidebar plegable a escriptori, un rail a tauleta i la navegació inferior en
  mòbil. La previsualització del qüestionari i els resultats del propietari són
  enllaços directes d'aquesta navegació; s'actualitzen si la creació o el
  reinici de l'espai genera rutes noves. La preferència de la sidebar
  s'emmagatzema a `localStorage` després de la hidratació i no s'envia al
  servidor. En escriptori i tauleta, la carcassa ocupa l'alçada visible: la
  capçalera i la navegació lateral no formen part del contenidor desplaçable i
  només el contingut principal té desplaçament vertical. Si no hi ha sessió,
  redirigeix a `/`.
  L'inicialitzador del layout arrel aplica també la preferència local de la
  sidebar al document abans del primer pintat, de manera que l'amplada es
  conserva sense salts visuals en navegar entre rutes.
  El peu forma part del flux del contenidor desplaçable: un layout flex
  l'empeny fins al límit inferior quan hi ha poc contingut i el situa després
  del contingut quan la vista és llarga.
- `/espais/[publicCode]/questionari` i
  `/espais/[publicCode]/resultats` conserven les URL dedicades i repeteixen la
  validació de sessió i propietat al servidor, però renderitzen el contingut
  dins la mateixa carcassa autenticada de `/crear`. La capçalera, la
  navegació responsive i el peu es mantenen visibles; la ruta activa queda
  marcada al menú. La navegació cap a fitxa o configuració torna a
  `/crear?view=profile` o `/crear?view=settings`, respectivament.
- `/q/[publicCode]` és l'entrada del professorat mitjançant l'enllaç específic
  compartit pel responsable. És una experiència pública independent de la
  gestió del centre: conserva només la capçalera comuna amb el logotip, el nom
  de l'aplicació i el selector de tema. No incorpora sidebar ni peu de pàgina.
  El formulari reutilitza els tokens, superfícies i estils de resposta de la
  resta de l'aplicació sense traslladar cap validació o enviament al layout.

## Decisions pendents

- Rate limiting i protecció anti-bots.
- Política de retenció i caducitat automàtica d'espais.
- Infraestructura definitiva de desplegament i còpies de seguretat.
- Revisió legal o DPO abans d'un ús institucional ampli.
