# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai de diagnosi identificat amb un centre sobre
l'ús educatiu de la intel·ligència artificial. Una persona responsable
autenticada amb el compte XTEC del centre crea l'espai, comparteix un enllaç
públic amb el professorat i consulta resultats de conjunt amb OAuth o amb un
enllaç privat.

L'aplicació desa i mostra la identitat institucional del centre i del compte
responsable, però no avalua ni identifica docents individualment.

`main` conté l'aplicació activa amb MySQL. Aquesta arquitectura no modifica
l'abast funcional ni les regles d'anonimat del producte.

## Objectius

- Crear un únic espai per centre amb autenticació OAuth del compte XTEC del
  centre.
- Recollir respostes anònimes d'un qüestionari fix i versionat, amb accés
  autenticat amb Google del professorat només per validar el domini admès i
  evitar respostes repetides.
- Mostrar resultats de conjunt des de la primera resposta.
- Generar un informe PDF de conjunt.
- Separar estrictament la identitat del centre i del responsable de les
  respostes anònimes.

## Fora d'abast

- Perfils, gestio o emmagatzematge de correus del professorat participant.
- Seguiment individual del professorat.
- Respostes obertes.
- Exportacio de dades individuals.
- Comparatives públiques entre centres.

## Administracio del qüestionari

L'aplicació inclou una administracio global limitada al manteniment del
  qüestionari versionat i dels comptes administradors. Aquesta administracio no
  pot accedir a respostes individuals i no pot crear
filtres o exportacions que facilitin la reidentificacio de persones.

Funcionalitats previstes:

- consultar un resum inicial amb l'estat dels centres i del qüestionari actiu;
- gestionar blocs de preguntes;
- gestionar preguntes tancades;
- crear noves versions del qüestionari;
- configurar els minuts estimats per respondre cada versio;
- activar una versio concreta;
- eliminar una versio no activa del qüestionari amb tots els espais i respostes
  associats després d'un avís explícit;
- aplicar correccions menors sobre una versio només quan encara no estigui
  assignada a cap espai de diagnosi;
- gestionar administradors;
- consultar i cercar els centres registrats, suspendre'n o reactivar-ne
  l'accés i executar reinicis o eliminacions confirmades;
- configurar si l'accés de responsables admet qualsevol compte `@xtec.cat` o
  només comptes de centre XTEC.
- configurar el comunicat global que els responsables poden obrir al correu web
  per compartir l'enllaç públic amb el professorat, sense preomplir
  destinataris.
- consultar resultats agregats per versio de qüestionari per a tots els centres
  o per a un centre identificat concret i descarregar el PDF corresponent.

La gestio d'administradors permet convidar un compte `@xtec.cat` per correu.
Les invitacions pendents es poden eliminar abans que la persona convidada les
accepti.
La invitacio queda limitada a l'administracio global i no es pot barrejar amb
respostes, espais ni professorat participant. Quan la persona convidada accedeix
amb Google OAuth, el servidor crea o reactiva el seu registre a `admin_users`
amb l'identificador opac derivat del compte Google, el correu i el nom visible
del compte. Els administradors no són anònims: qualsevol administrador actiu pot
veure el nom i correu dels altres administradors per gestionar l'accés. Aquesta
identificacio queda limitada a l'administracio i no es pot barrejar amb
respostes, espais ni professorat participant.

Eliminar un administrador només elimina el rol d'administracio de `admin_users`;
no elimina ni modifica el compte Google de la persona.

Les versions noves es creen des d'un únic formulari on l'administrador tria si
vol començar amb un qüestionari en blanc o copiar una versio existent. El títol
sempre és obligatori i ha de ser diferent dels títols existents. Cada versio
inclou els minuts estimats per respondre-la, configurables entre 1 i 120 minuts.
Les versions sense espais de diagnosi assignats poden desar-se com a esborrany parcial durant
l'edició: l'administrador pot afegir o eliminar blocs i pot afegir o eliminar
preguntes dins de cada bloc. En afegir un bloc nou, l'editor crea també una
pregunta inicial. Cada versio pot tenir entre 1 i 10 blocs, i cada bloc pot
tenir entre 1 i 10 preguntes. L'activació exigeix que tots els blocs tinguin
almenys una pregunta.

### Acces inicial d'administracio

El primer administrador és el primer usuari autenticat amb compte `@xtec.cat`
que accedeix a la pantalla d'administracio quan encara no existeix cap fila a
`admin_users`.

Un cop existeix almenys un administrador, cap altre usuari pot accedir a
l'administracio pel simple fet de tenir un compte XTEC. Els nous
administradors només poden ser convidats, afegits o reactivats per un
administrador actiu.

Aquest bootstrap inicial no s'ha de barrejar amb la creació d'espais de
diagnosi. Crear un qüestionari o un espai no concedeix permisos
d'administracio.

### Resum d'administració

La ruta `/admin` obre per defecte la secció `Resum`. La part superior mostra
sis indicadors agregats: centres actius, suspesos, pendents de configuració,
centres sense qüestionari, centres sense respostes i respostes computables
totals. Un centre actiu no està suspès i té confirmades la fitxa institucional
i la política de correus; un centre pendent no està suspès i encara no ha
completat algun d'aquests dos passos.

Les respostes computables només sumen els espais que superen estrictament el
llindar administratiu configurat. El resum no mostra recomptes per centre ni
cap fila individual. També presenta el títol, versió, data de creació, nombre
de centres associats i respostes computables del qüestionari actiu, amb accés
directe a la gestió de qüestionaris i als resultats globals.

Els sis indicadors són accionables. Els cinc indicadors de centres obren la
secció `Centres` amb el filtre corresponent i el total de respostes computables
obre els resultats globals del qüestionari actiu. La llista de centres conserva
el filtre mentre es cerca o se selecciona una fitxa i permet retirar-lo.

Sota els indicadors només apareix l'apartat `Requereixen atenció` quan hi ha
alguna incidència operativa: centres pendents de configuració, centres actius
sense qüestionari, centres amb qüestionari però sense respostes o absència de
qüestionari actiu. Cada avís enllaça directament amb la vista filtrada o l'acció
de gestió corresponent.

### Configuracio d'acces de responsables

L'administracio inclou una pantalla de configuracio global. Inclou l'opcio
`responsible_access_mode`, amb dos valors possibles:

- `all_xtec`: qualsevol compte acabat en `@xtec.cat` pot accedir com a
  responsable i disposa d'una fitxa institucional de prova completa si el
  correu no correspon a un centre oficial.
- `centre_xtec`: només els comptes de centre XTEC poden accedir com a
  responsables.

Els comptes de centre XTEC tenen el format: una lletra inicial `a`, `b`, `c`,
`d` o `e`, seguida de 7 digits i el domini `@xtec.cat`, per exemple
`a0000000@xtec.cat`.

Els administradors actius de l'aplicacio poden accedir com a responsables i
crear el seu qüestionari de prova en qualsevol dels dos modes. Aquesta excepcio
no dona accés a respostes individuals ni canvia les garanties d'anonimat.

La configuracio també inclou `admin_results_minimum_submissions`, un enter entre
0 i 10. En els resultats globals d'administracio, només es computen les
enquestes amb més respostes que aquest valor. Les enquestes amb un nombre de
respostes igual o inferior al llindar no s'inclouen en els totals, percentatges
ni PDF d'administracio. La pantalla de resultats mostra una frase inicial que
explica el llindar aplicat.

La configuracio global d’idiomes permet ocultar o mostrar el selector a les
capçaleres de tota l’aplicacio i decidir quines llengües previstes hi apareixen.
El català és obligatori mentre sigui l’única llengua funcional. Castellà,
euskera, gallec i aranès es poden mostrar o ocultar, però encara no canvien la
llengua del contingut.

La configuracio també inclou el comunicat global per compartir el qüestionari:
títol del correu i text del missatge. El text pot contenir la marca
`{URL_QUESTIONARI}`, que se substitueix a la pantalla del responsable per
l'enllaç públic específic del seu espai. Si la marca no hi és, l'aplicacio
afegeix l'enllaç al final del missatge. El botó de la gestio del creador mostra
primer el compte emissor previst i després permet obrir Gmail/Google Workspace
en una pestanya nova amb assumpte i cos preomplerts, però sense destinataris.
La confirmacio recorda al responsable que ha d'afegir manualment al camp `Per a`
els correus dels docents del centre abans d'enviar el missatge.

### Regla de correccions menors

Una versio del qüestionari sense espais assignats es pot corregir directament.

Quan una versio ja està assignada a un espai, l'editor la mostra bloquejada per
defecte. Un administrador pot prémer `Editar` i acceptar un avís explícit abans
de modificar-la. Si la versio està activa o ja té respostes, només es poden
corregir títols i textos existents; no es poden eliminar ni afegir blocs o
preguntes. Les versions inactives sense respostes poden modificar estructura.

L'activacio d'una nova versio no modifica respostes existents, no reassigna
respostes a preguntes noves i no altera els resultats dels espais anteriors.

Eliminar una versio no activa és una accio destructiva d'administracio. Després
de confirmar l'avís, s'elimina la versio i totes les seves instàncies d'espai,
respostes, blocs i preguntes. Les versions actives no mostren el botó
d'eliminacio i la base de dades també rebutja eliminar-les. Aquesta accio no ha
de retornar ni exportar files individuals abans d'eliminar-les.

### Resultats d'administracio

L'administracio inclou una vista `Resultats`. Inicialment no hi ha cap versio
seleccionada i no es calculen resultats fins que l'administrador tria una
versio del qüestionari. L'àmbit inicial és `Tots els centres`; l'administrador
també pot triar `Un centre concret` i seleccionar-lo pel nom institucional, el
codi oficial o el municipi. Els selectors de centre i qüestionari estan
vinculats: en triar un qüestionari només s'ofereixen els centres que tenen
resultats elegibles d'aquella versio, i en triar un centre només s'ofereixen
les versions que aquell centre ha respost. Els centres sense cap combinacio que
superi el llindar administratiu no apareixen al selector. Els centres no són
anònims davant l'administracio.

La vista només mostra dades de conjunt: nombre agregat de centres/espais quan
l'àmbit és global, nombre total de respostes computades, percentatges globals,
percentatges per bloc, percentatges per pregunta i distribucions agregades. El
llindar administratiu s'aplica sempre. En l'àmbit global només s'inclouen els
centres que el superen; en l'àmbit d'un centre concret no es mostra cap dada de
resultats si aquell centre no el supera.

La seleccio d'un centre no permet veure l'espai, el responsable, docents,
timestamps individuals, `submission_id`, `answer_id` ni combinacions de
respostes d'una mateixa persona. Tampoc es permet combinar el centre amb
filtres de data, compte o característiques personals. El PDF d'administracio
repeteix la mateixa agregacio i validacio de l'àmbit i no inclou tokens ni codis
publics d'espais.

### Gestió administrativa de centres

La secció `Centres` mostra exclusivament identitat institucional, dades del
compte responsable, política de dominis, estat de l'espai i recomptes
agregats. Permet cercar per nom, codi oficial, municipi o correu del
responsable. Mai no mostra correus, accessos ni respostes del professorat.

El darrer accés correspon només al compte responsable. El recompte exacte de
respostes només es mostra quan supera el llindar administratiu; en cas contrari
la interfície indica únicament que és igual o inferior al llindar.

Un administrador pot suspendre o reactivar un centre. La suspensió impedeix
l'accés del responsable, desactiva el qüestionari públic i bloqueja nous
enviaments, però conserva les dades per permetre una reactivació posterior.

També pot executar tres accions destructives, sempre al servidor i dins una
transacció:

- reiniciar les respostes, eliminant `answers`, `submissions` i
  `submission_locks`, però conservant l'espai i els enllaços;
- reiniciar completament l'espai, eliminant les respostes, assignant la versió
  activa i rotant el codi públic i els tokens;
- eliminar definitivament el centre, el compte responsable, l'espai i les
  dades anònimes associades, després d'escriure el codi oficial o el correu
  institucional com a confirmació.

Les actuacions deixen un registre administratiu mínim amb l'administrador,
l'acció, el centre, la data i el nombre de respostes afectades. Aquest registre
no conté identificadors ni contingut de respostes i es conserva quan s'elimina
el centre. El mateix compte XTEC podria crear una fitxa nova després d'una
eliminació; per impedir l'accés cal usar la suspensió en lloc de l'eliminació.

## Fluxos principals

### Portada i accés

Ruta: `/`

La portada és l'única pantalla inicial. Reuneix l'objectiu de l'eina,
l'indicador OIA-12 i tres targetes equilibrades: el fonament en la documentació
de competència digital docent i les orientacions d'IA per als centres; la
creació, compartició i consulta de resultats per part del centre; i la resposta
anònima del docent mitjançant l'enllaç rebut, sense crear cap compte. La
informació de versió, autoria, llicència i repositori es mostra al peu de
pàgina.

La portada presenta primer una capçalera fixa amb accés XTEC, selector de tema
clar o fosc i selector d'idioma, seguida d'un bloc principal a pantalla
completa amb una única acció destacada per accedir amb el compte de centre. La
capçalera és
transparent a l'inici i passa suaument a una superfície translúcida amb
desenfocament després d'un marge inicial de desplaçament sense efecte. La
intensitat augmenta progressivament i el límit inferior es dissol amb un
degradat perquè el contingut no quedi tallat de manera sobtada. L'accés
`Descobreix-ne més` desplaça suaument la finestra fins a la secció informativa
inferior perquè se'n percebi la continuïtat vertical. La capçalera
guanya opacitat i desenfocament de manera accelerada al tram central i arriba a
un estat final amb el contingut de sota fortament difuminat. Una màscara
vertical manté transparent la vora inferior, fa translúcid el centre i aplica
una opacitat reforçada al centre i el màxim difuminat a la part superior. La informació
metodològica, l'indicador i l'explicació dels rols queden a continuació i no
apareixen en el primer viewport. El tema triat es conserva només com a
preferència visual local del navegador. El selector d'idioma és informatiu:
mostra només `CA` en repòs i desplega el català i la resta de llengües
previstes, però no modifica l'idioma de la pàgina.

Al final de la segona pantalla, una icona de desplaçament sense text enllaça
amb transició suau a la mostra del qüestionari. L'enllaç conserva una etiqueta
accessible encara que visualment només mostri la icona.

Després de l'explicació dels rols, la portada mostra una previsualització
estàtica de la primera pregunta de la versió `2026.2` i de les seves quatre
opcions de resposta. Aquesta mostra és una còpia editorial fixa, no consulta la
base de dades, no conté controls de formulari i no pot enviar ni desar cap
resposta. En monitors, l'espaiat i la mida de la mostra s'adapten perquè tota
la tercera pantalla quedi visible sota la capçalera; en dispositius estrets es
manté el recorregut vertical llegible. També resumeix que el qüestionari consta
de 20 preguntes repartides en cinc blocs.

El responsable inicia l'accés XTEC des de la portada i, un cop autenticat,
arriba a `/crear` per crear o gestionar el seu espai. El professorat accedeix
al qüestionari des de l'enllaç específic rebut. Un accés directe a `/crear`
sense sessió redirigeix a la portada. Abans de sortir cap a Google OAuth,
qualsevol accés de responsable de la portada obre un diàleg amb el logotip de
l'aplicació i la pàgina desenfocada. El diàleg informa que només s'hi admet el
compte institucional `@xtec.cat` assignat al centre; no substitueix la
validació de servidor ni modifica el flux d'autenticació.

### Creacio d'espai

Ruta: `/crear`

La persona responsable ja ha iniciat sessió des de la portada amb un compte
XTEC autoritzat. A `main` això es fa amb Google OAuth directe o amb mode local
provisional de desenvolupament. Només s'accepten comptes amb correu acabat en
`@xtec.cat`;
segons la configuracio global, l'accés de responsables pot quedar limitat als
comptes de centre XTEC. Els administradors actius poden crear i gestionar el
seu espai en qualsevol dels dos modes.
Cada centre autenticat pot tenir un únic espai. Quan el mode `all_xtec` està
actiu, els responsables XTEC amb correu no corresponent a un centre també poden
crear un únic espai de prova amb una fitxa institucional pròpia. Els
administradors actius disposen d'aquest espai de prova en qualsevol dels dos
modes. També s'intenta consultar Dades Obertes amb el correu; si no hi ha
coincidència, la fitxa mostra el nom i correu Google i l'estat de centre no
trobat. El servidor genera:

- Codi públic llegible amb format `C-7KX9-M2Q8`.
- Token privat llarg i criptograficament segur.

La capa d'autenticació és server-side. El mode
`AUTH_MODE=google` valida el `id_token` amb Google. Per als responsables exigeix
email `@xtec.cat`; per al professorat exigeix el domini exacte configurat pel
centre.
Per als responsables desa a MySQL l'identificador opac, el correu i el nom
visible del compte, separats de les respostes. Per als participants només usa
un identificador opac derivat amb HMAC. El mode
`AUTH_MODE=local` queda com a ajuda de desenvolupament.

Per a qualsevol responsable autoritzat que accedeix a crear un espai, el
servidor crea o recupera primer una fitxa institucional i consulta per correu
el dataset `kvmv-ahh4` de Dades Obertes. Si el correu correspon a un centre,
desa codi, nom oficial, municipi i àrea territorial. El servei educatiu es
resol amb la font pública versionada al repositori. Si la consulta falla o no
troba el centre, es conserva l'accés, s'indica que no hi ha dades i s'ofereix
un botó de recàrrega. La fitxa mostra la data del darrer intent i de la darrera
actualització correcta. Els espais previs del mateix responsable que encara no
tinguin centre associat es vinculen automàticament a aquesta fitxa.

El nom de capçalera és el nom oficial de Dades Obertes, el nom visible del
compte Google o, com a últim recurs, el correu del centre. Apareix només a les
pàgines, correus i informes vinculats al centre.

Abans de crear o gestionar el qüestionari, el responsable confirma la fitxa i
configura el domini docent. Ha de triar entre `@xtec.cat` o un únic domini propi
de Google Workspace. `@xtec.cat` és l'opció inicial, recomanada i
activada per defecte. El domini propi es normalitza a minúscules i només
coincideix exactament: autoritzar `escola.cat` no autoritza
`subdomini.escola.cat`.

Les dues opcions són excloents i no es poden activar alhora. La configuració es
pot modificar després des de la vista central `Configuració`.

Resultat mostrat després de crear l'espai i recuperable des de la gestio del creador:

- Enllaç públic: `/q/[publicCode]`
- Botó per obrir el correu web amb el comunicat global i l'enllaç públic
  específic de l'espai.
- Enllaç privat compartit: `/resultats/compartit/[publicCode]#token=[privateToken]`
- Enllaç de resultats del creador: `/espais/[publicCode]/resultats`
- Previsualització del qüestionari en mode lectura:
  `/espais/[publicCode]/questionari`

El token privat es desa com HMAC per validar-lo i xifrat per poder reconstruir l'enllaç per al creador autenticat. No es desa mai en text pla.

Si l'usuari ja té un espai creat, no pot crear-ne un segon. La mateixa pantalla `/crear` mostra els enllaços, el nombre agregat de respostes, l'accés als resultats, la regeneració de l'enllaç privat i el reinici del qüestionari.

Després de confirmar la fitxa i configurar els correus, `/crear` conserva la
capçalera visual de la portada. El botó d'accés se substitueix pel nom visible
del compte i obre un menú amb la identificació de la sessió i `Surt`. En
pantalles d'escriptori, la navegació de `Qüestionari`, `Fitxa` i `Configuració`
es presenta en una barra lateral que es pot plegar fins a un rail d'icones. En
tauleta el rail és la presentació predeterminada i en mòbil se substitueix per
una navegació inferior fixa amb respecte per la zona segura del dispositiu. La
mateixa navegació incorpora els enllaços `Veure qüestionari` i `Ves als
resultats`; aquests accessos no es repeteixen a la zona central. La
preferència expandida o plegada es conserva localment al navegador. La zona
central mostra inicialment la gestió del qüestionari, sense contenidors de
targeta superposats. Canviar de vista no reinicialitza l'estat local de la
gestió ni elimina cap funcionalitat. El control de plegat és una única icona a
la part superior de la barra, abans del nom del centre. La capçalera i la barra
lateral es mantenen fixes a la pantalla; el desplaçament vertical queda limitat
al contingut principal. El peu de pàgina no és flotant ni fix: queda al final
del contingut i només apareix d'entrada quan la vista és prou curta. El tema
desat s'aplica abans del primer pintat per evitar un flaix clar quan es navega
entre rutes en mode fosc.

La gestió del creador també ofereix al menú un accés per veure el qüestionari
assignat a l'espai en mode lectura. Aquesta previsualització exigeix sessió XTEC i
propietat de l'espai, mostra un avís clar que no es pot respondre i no inclou
cap botó d'enviament.

La previsualització i els resultats del propietari mantenen les seves URL
dedicades per permetre recàrrega, navegació enrere i enllaç directe. Totes dues
pantalles formen part visualment de l'espai del centre: conserven capçalera,
menú responsive i peu de pàgina, indiquen l'accés actiu i respecten la paleta
blava dels temes clar i fosc. Canviar l'aparença no redueix les validacions de
sessió, propietat o agregació de resultats.

La regeneració de l'enllaç privat es mostra al costat de l'enllaç privat compartit i demana confirmació abans d'invalidar l'enllaç anterior.

### Reinici de qüestionari

Ruta de gestio: `/crear`

El creador autenticat pot reiniciar el seu qüestionari. Aquesta accio:

- elimina totes les `submissions` i `answers` anònimes de l'espai;
- conserva el mateix `diagnostic_spaces.id` i el mateix `owner_user_id`;
- assigna l'espai a la versio de qüestionari que estigui activa en aquell
  moment;
- genera un nou codi públic;
- genera un nou token privat de resultats;
- invalida l'enllaç públic i l'enllaç privat antics.

No s'eliminen ni es modifiquen les preguntes del qüestionari versionat.

### Resposta del professorat

Ruta: `/q/[publicCode]`

La ruta pública presenta una capçalera mínima amb la marca `Diagnosi IA` i el
selector clar o fosc. No mostra navegació lateral ni peu de pàgina, perquè el
docent només ha de seguir el flux del qüestionari. La paleta, les superfícies,
els botons i les opcions de resposta comparteixen el sistema visual de la resta
de l'aplicació.

El formulari ha de mostrar:

- Objectiu de la diagnosi.
- Respostes anònimes.
- Identificació del centre promotor, però no recollida de noms, correus, IP,
  dispositiu ni respostes obertes del professorat.
- Resultats només de conjunt.
- Indicacio que cal respondre una sola vegada.
- Emoji de rellotge amb els minuts estimats necessaris per respondre el
  qüestionari.
- Versio i temps estimat com a metadades informatives, sense aparença de botó.
- Avís amb emoji quan l'usuari ja ha respost, diferenciat visualment de les
  accions.

Per obrir el formulari, el docent ha d'iniciar sessio amb un compte
`@xtec.cat`. Aquesta sessio no crea un compte de professorat a la base de dades
de l'aplicacio i no es copia el correu a les taules de diagnosi. El servidor
calcula un HMAC server-side per al codi public de l'enquesta i l'usuari
autenticat, i el desa a `submission_locks` per impedir una segona resposta al
mateix enllaç. Aquest HMAC no es desa a `submissions` ni a `answers`.

El docent respon totes les preguntes obligatories de la versio assignada a
l'espai, amb escala:

- `0`: Gens / No ho faig
- `1`: Una mica / Ocasionalment
- `2`: Bastant / Habitualment
- `3`: Molt / Soc un referent al centre

No hi ha camps oberts.

Cada espai de diagnosi admet un màxim de 300 respostes completes. Quan s'arriba
a aquest límit, el formulari ja no accepta nous enviaments i informa que el
qüestionari ha arribat al màxim de respostes.

Quan el servidor accepta l'enviament, també es desa una marca local al navegador
per millorar l'experiencia si la persona torna a obrir el mateix enllaç.

### Consulta de resultats

Ruta compartida: `/resultats/compartit/[publicCode]#token=[privateToken]`

Ruta del creador: `/espais/[publicCode]/resultats`

El navegador llegeix el fragment `#token=` i envia el token mitjançant `POST /api/results`. El token no s'envia en query params.

El creador autenticat pot consultar els resultats dels espais propis si `owner_user_id` coincideix amb el seu usuari autenticat.

La vista de resultats del creador mostra l'accio de descarregar el PDF i un boto per tornar a la gestio de l'espai. La gestio de l'enllaç privat compartit es fa des de `/crear`.

El servidor valida el token i retorna només dades de conjunt:

- Codi de l'espai.
- Versio del qüestionari.
- Nombre total de respostes.
- Percentatge global normalitzat a partir de l'escala 0-3.
- Percentatge per bloc.
- Grafica d'aranya i grafica de barres per bloc.
- Percentatge per pregunta.
- Distribucio per pregunta.
- Grafiques apilades amb les quatre opcions.
- Text breu d'interpretació.

Si hi ha poques respostes, el tauler mostra un avís de prudència metodològica. No hi ha mínim fix.

### Informe PDF

Accio: boto `Descarrega l'informe PDF`

Endpoint: `POST /api/reports/pdf`

El servidor valida novament el token i genera un PDF de conjunt amb:

- Titol de la diagnosi.
- Nom del centre i codi tècnic de l'espai.
- Versio del qüestionari.
- Data de generació.
- Nombre de respostes.
- Explicacio de l'escala.
- Grafica general dels blocs.
- Grafiques i resultats de cada pregunta.
- Resum de fortaleses.
- Àmbits amb marge de millora.
- Nota metodològica.
- Avis que no és una avaluació individual del professorat.

El PDF no inclou dades personals, token privat ni respostes individuals.

## Qüestionari v1

Versió inicial: `2026.1`

Versió activa corregida: `2026.2`

Estructura inicial:

- 5 blocs.
- 4 preguntes per bloc.
- 20 preguntes totals.
- Totes obligatories.
- Totes amb escala `0`, `1`, `2`, `3`.

Blocs:

1. Alfabetització i ús crític de la IA
2. Us de la IA en la pràctica docent
3. Us de la IA amb l'alumnat
4. Avaluacio i retroacció
5. Dades, seguretat i criteris compartits

Les preguntes concretes s'han de carregar amb migració o `seed.sql`. Una versió
activa o amb respostes només admet correccions de títols i textos existents
després d'acceptar l'avís d'edició quan correspongui; qualsevol canvi
d'estructura crea una nova versió.

## Textos funcionals recomanats

### Text introductori del formulari

"Aquesta diagnosi anònima ajuda a conèixer amb una visió de conjunt com s'està utilitzant la intel·ligència artificial en el context educatiu. No es recullen dades personals, no s'identifica cap docent i els resultats només es mostraran en conjunt. Respon una sola vegada."

### Avis amb poques respostes

"Poques respostes: interpreta els resultats amb prudència."

### Avis metodologic del PDF

"Aquest informe presenta resultats de conjunt d'una diagnosi anònima. No permet avaluar individualment cap docent ni reconstruir respostes personals."

## Requisits no funcionals

- Validacio estricta al servidor.
- Cap secret al client.
- Cap dada individual al tauler o PDF.
- Objectiu d’accessibilitat WCAG 2.2 AA: semàntica compatible amb lectors de
  pantalla, formularis etiquetats, contrast suficient, focus visible, navegació
  completa amb teclat i reducció del moviment segons la preferència del sistema.
- UI clara i institucional, sense aparenca de ranquing ni avaluació personal.
