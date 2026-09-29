# Arquitectura

## Stack actiu

- Next.js amb App Router i runtime Node.js.
- TypeScript en mode estricte.
- Tailwind CSS.
- MySQL 8.4.
- Drizzle ORM amb `mysql2`.
- Google OAuth amb sessió server-side pròpia.
- En mode local, `Surt` posa una cookie funcional `HttpOnly` sense identitat que
  desactiva l'usuari local fins al següent `/auth/login`; no afecta Google OAuth.
- Recharts per a les gràfiques web.
- `@react-pdf/renderer` per als informes PDF.

La compilació webpack registra els mòduls de producció i regenera els avisos
de tercers a `public/THIRD_PARTY_NOTICES.txt`. El peu compartit hi enllaça en
totes les llengües. Els avisos públics cobreixen els recursos del servei web;
les traces del servidor es revisen amb una comprovació separada abans de
distribuir-ne binaris. L'abast, les fonts originals i els pendents es documenten a `docs/THIRD_PARTY_LICENSES.md`.

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
- Els resultats de centre, administració i enllaç privat es construeixen exclusivament amb dades agregades.
- Les dades individuals només es carreguen per a l'àrea docent després de validar
  al servidor que `participant_user_id` coincideix amb l'identificador de sessió.
- Cap endpoint de centre o administració retorna files individuals.
- Els tokens privats es desen com HMAC per validar-los i xifrats per
  recuperar-los; mai en text pla.
- Els tokens no apareixen en query strings, logs, errors o PDFs.

### Defensa HTTP

Els endpoints de resultats JSON i PDF de centre, compartits, docents i
administració envien `Cache-Control: private, no-store, max-age=0`. També
s'aplica a les respostes de creació i reinici d'espais i regeneració del token,
que poden incloure enllaços privats, i als errors retornats per aquests
handlers. La política s'estableix a la resposta del handler, sense dependre
d'Apache ni de la configuració de memòria cau de pàgines de Next.js.
No retira fitxers PDF descarregats expressament ni purga còpies anteriors,
historial o estat React de pestanyes obertes. La sessió, el rol i la propietat
es continuen validant a cada petició segons les regles existents.

El proxy rebutja amb 403 les peticions de mutació (POST, PUT, PATCH i DELETE)
que no acrediten el mateix origen exacte, incloent esquema, host i port.
Compara `Origin` amb l'origen públic resolt mitjançant `NEXT_PUBLIC_APP_URL`;
si no hi ha `Origin`, només admet un `Referer` del mateix origen. Un `Origin`
explícit estranger o `null` no pot usar aquest fallback. Sense tots dos
encapçalaments es rebutja la petició. No es confia en `X-Forwarded-Host` aportat
pel client ni s'autoritzen altres subdominis. En local es compara l'origen de
la petició segons les regles existents de resolució de l'URL de l'aplicació.
La política `Referrer-Policy: same-origin` permet que els formularis del mateix
origen aportin el `Referer` quan el navegador omet `Origin`, sense enviar el
camí ni els paràmetres de la pàgina a webs externes.
La comprovació passa abans d'executar endpoints o Server Actions i complementa
la sessió i les comprovacions d'origen de Next.js. GET, HEAD i OPTIONS no
canvien; el callback GET de Google conserva la validació de l'estat OAuth.
No es registren els encapçalaments ni es creen dades de participants.

`proxy.ts` aplica `Content-Security-Policy` a les rutes dinàmiques, inclosos
els errors i les peticions de prefetch. Genera un nonce criptogràfic nou de
32 bytes per petició, substitueix qualsevol CSP o nonce aportat pel client i
transmet la mateixa política al renderitzador i a la resposta. Next.js aplica
el nonce als seus scripts; `script-src` usa `strict-dynamic` i no permet
`unsafe-inline` ni `unsafe-eval` en producció. El layout arrel manté
`force-dynamic`: no es pot servir HTML amb un nonce des d'una memòria cau
compartida ni convertir aquestes pàgines en estàtiques.

Les connexions del navegador es limiten al mateix origen. Els estils inline
continuen permesos per als valors calculats del qüestionari i de Recharts;
aquesta excepció no autoritza scripts inline. Només en desenvolupament es
permet `unsafe-eval` i WebSocket per a la depuració i el hot reload. Els
recursos estàtics de Next.js i les icones conegudes no passen pel proxy;
una extensió d'imatge en una URL desconeguda no evita la CSP de l'error HTML.
No s'afegeixen
serveis de telemetria ni endpoints que recullin informes CSP, dades de
participants o tokens. Abans del desplegament cal comprovar els fluxos
representatius amb la compilació de producció segons `docs/RELEASES.md`.

El cos JSON de les peticions es consumeix en streaming i es
cancel·la quan supera el límit de cada endpoint; `Content-Length` és només una
comprovació anticipada. El proxy o proveïdor d'allotjament també ha d'aplicar
un límit de mida de petició. Aquest repositori no fixa el proveïdor ni en pot
confirmar les proteccions actives.

## Límits de confiança

### Navegador

El navegador pot rebre el qüestionari després de l'autorització, resultats
agregats per als rols institucionals i les respostes pròpies per al docent
autenticat. Conserva l'identificador pseudònim, el correu i el claim `hd` només
dins la cookie docent `HttpOnly`, inaccessible al JavaScript de l'aplicació. No
pot importar el client de base de dades ni rebre aquests valors en payloads,
identificadors interns de la base de dades o secrets.

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
- `lib/participants/`: autorització, limitació d'intents i models de resultats propis.
- `lib/i18n/`: llengües disponibles, lectura de la cookie funcional i catàlegs
  tipats per llengua. No es detecta l'idioma del navegador; el català és el
  valor per defecte i de reserva per a cada clau absent o buida. Els catàlegs
  compartits `interface-*.ts` alimenten el traductor de servidor i el component
  `InterfaceText` del client. La interpolació substitueix els paràmetres sense
  modificar els textos versionats del qüestionari.
- `lib/admin/`: administració autoritzada.
- `lib/crypto/`: codis, HMAC i xifrat.
- `lib/pdf/`: renderització server-side de l'informe.
- `lib/validation/`: esquemes estrictes.

## Autenticació i autorització

Les destinacions `next` de login, callback i logout només admeten rutes
internes. `lib/http/redirect.ts` rebutja URL absolutes, referències amb host,
barres inverses i caràcters de control, normalitza el camí amb el parser URL
i comprova que no canviï l'origen. El callback torna a validar la destinació
de l'estat OAuth signat abans d'intercanviar el codi, també per als estats
creats abans d'una correcció. Una destinació invàlida al login o logout usa
la ruta de reserva; un estat invàlid al callback torna a l'error d'accés sense
crear sessió. El logout respon amb `303` perquè el navegador continuï amb GET
i no reenviï el POST a la destinació.

`AUTH_MODE=google` inicia el flux OAuth i verifica el `id_token` al servidor
amb `google-auth-library`, que valida la signatura amb les claus públiques de
Google i en gestiona la rotació. Després es comproven explícitament `iss`, `aud`,
`exp` i el `nonce` de la petició. El paràmetre OAuth `hd` només orienta el
selector de comptes; no prova l'afiliació. Per al professorat, tant el domini
exacte del correu com el claim signat `hd` han de coincidir amb la política del
centre.

Les sessions de responsable i participant tenen cookies i esquemes diferents,
totes dues `HttpOnly`, `SameSite=Lax`, signades i amb una durada màxima de vuit
hores, configurable només a la baixa. La cookie responsable conté
l'identificador opac, el correu, el nom visible, el domini allotjat i la
caducitat. La cookie docent no està xifrada i només conté el rol,
l'identificador pseudònim, el correu i el claim `hd` necessari per revalidar el
domini; no conté el nom. Els
responsables han de tenir correu `@xtec.cat`. El professorat ha de coincidir
exactament amb l'única opció triada pel centre: `@xtec.cat` o el domini propi
de Google Workspace configurat.

L'OAuth de responsables demana `openid email profile`; el del professorat
demana només `openid email`. Les rutes institucionals només accepten la cookie
responsable i les rutes docents només accepten la cookie participant.

L'identificador desat per a responsables i participants és un UUID opac derivat
del `sub` de Google amb HMAC. El correu i nom del responsable es desen a
`centre_accounts`; del participant només es persisteix l'identificador opac a
`participant_submissions`. El correu docent queda limitat a la sessió temporal
i mai no es desa a MySQL; el nom o perfil docent no es demana ni es conserva.

`AUTH_MODE=local` és exclusiu de desenvolupament. En producció queda
desactivat, tret d'una habilitació explícita destinada només a verificacions
locals.

`responsible_portal_status` controla el prellançament global des de
`app_settings` i és `closed` per defecte. El bloqueig no depèn de la visibilitat
dels botons: es valida a les sessions, als callbacks OAuth i a totes les pàgines
i API de centre o docents. `/admin` queda fora del bloqueig i els administradors
actius poden provar `/crear` abans de l'obertura.

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
   versió, les preguntes, la pertinença de cada `optionId`, els duplicats i el
   límit de 300 respostes. La puntuació `0–3` es deriva exclusivament de
   `question_options`; no s'accepta cap puntuació aportada pel navegador.
5. Inserir `submission`, la vinculació única `participant_submissions` i
   `answers` dins la mateixa transacció.
6. Usar la restricció única `(diagnostic_space_id, participant_user_id)` com a
   única font de veritat contra repeticions.
7. Confirmar o revertir la transacció.

### Resultats i PDF

1. Validar de nou la propietat o el token privat.
2. Consultar únicament recomptes agrupats per pregunta i valor, i carregar els
   textos de `question_options` ordenats per puntuació.
3. Construir el model agregat.
4. Retornar el tauler o generar el PDF sense dades individuals. El PDF usa
   `questionnaires.language_code`, no la preferència d'interfície de l'usuari.

### Accés i resultats docents

El comunicat generat per al claustre rep explícitament `publicUrl` i
`publicCode`. El renderitzador substitueix `{URL_QUESTIONARI}` i
`{CODI_QUESTIONARI}` i afegeix qualsevol de les dues dades que falti a la
plantilla, de manera que el correu sempre permet l'accés inicial i posterior.

1. La portada només valida al navegador el format del codi i inicia OAuth amb
   el codi dins l'estat signat; no comprova públicament si existeix.
2. Després del callback, el servidor aplica el límit d'intents i comprova de
   manera conjunta codi, estat, domini o participació prèvia. Els errors del callback són genèrics.
   Amb sessió docent vigent, la pàgina del qüestionari torna a `/docent` en
   cas d'error. Per a codis actius amb domini incompatible, el servidor de
   l'àrea docent revalida codi, política i límit d'intents abans de mostrar
   exclusivament el domini requerit. Els altres errors continuen sent genèrics.
3. Una participació existent es pot consultar encara que l'espai estigui tancat.
4. Les consultes i el PDF reben el codi públic, però deriven sempre el propietari
   de la sessió. No accepten `participant_user_id` ni `submission_id` del navegador.
5. El PDF individual es genera sota demanda, amb `Cache-Control: private, no-store`,
   i no es desa permanentment.

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

Els errors visibles són genèrics, amb l'excepció autenticada del domini requerit
documentada a `docs/PRIVACY.md`. No es registren tokens, payloads complets de
respostes, correus de participants, IPs ni informació de dispositiu.

## Accessibilitat

La interfície té com a objectiu WCAG 2.2 AA. La capçalera compartida incorpora
el salt al contingut; els tokens defineixen focus i contrast per als temes clar
i fosc; i els estats dinàmics del qüestionari gestionen focus i anuncis per a
tecnologies d’assistència. Les gràfiques mantenen una alternativa tabular i no
formen part de l’arbre d’accessibilitat quan dupliquen aquestes dades. La matriu
de verificació manual i els límits de l’auditoria es documenten a
`docs/ACCESSIBILITY.md`.

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
  selector d'idioma mostra la llengua activa i actualitza els textos de la
  interfície amb una preferència explícita en cookie. El layout arrel carrega la configuració
  global que en controla la visibilitat i les llengües previstes a totes les
  capçaleres compartides, inclosa la del qüestionari públic. La mostra de
  pregunta situada al final
  de la portada és JSX estàtic: copia la primera pregunta i les opcions de la
  versió `2026.2`, no carrega dades de MySQL i no renderitza cap control que
  pugui enviar una resposta. Els accessos de responsable obren un diàleg
  client nadiu que explica el requisit de compte institucional de centre abans
  de continuar cap a la mateixa ruta de Google OAuth. El diàleg no valida ni
  desa dades: la validació efectiva es manté exclusivament al servidor.
- `VisualPreferencesInitializer` executa un inicialitzador client mínim de tema després de
  la hidratació i fora de l'arbre React. Llegeix la mateixa preferència local
  del selector i aplica `data-theme` i `color-scheme` sense renderitzar scripts
  des del layout.
- `/crear` és la pantalla autenticada de creació i gestió de l'espai. Reutilitza
  la capçalera fixa de la portada i substitueix l'accés pel menú del compte,
  amb la identitat de la sessió; una icona de sortida independent queda visible
  a la capçalera. La portada amb sessió autoritzada mostra `El meu espai` i la
  mateixa sortida. Les pantalles de responsable amb accés denegat mantenen una
  sortida visible per poder canviar de compte. Un contenidor client manté
  muntades les vistes centrals de qüestionari, fitxa i configuració de correus per preservar-ne
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
  L'inicialitzador client aplica també la preferència local de la
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
- `/docent` mostra només les participacions del compte actual i permet iniciar
  un altre accés per codi. `/docent/resultats/[publicCode]` mostra les respostes
  pròpies sense exposar identificadors interns.

## Decisions pendents

- Substituir el rate limiting local en memòria per un magatzem compartit abans
  d'un desplegament amb múltiples instàncies.
- Política de retenció i caducitat automàtica d'espais.
- Infraestructura definitiva de desplegament i còpies de seguretat.
- Revisió legal o DPO abans d'un ús institucional ampli.
