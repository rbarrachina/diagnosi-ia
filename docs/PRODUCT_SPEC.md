# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai de diagnosi identificat amb un centre sobre
l'ús educatiu de la intel·ligència artificial. Una persona responsable
autenticada amb el compte XTEC del centre crea l'espai, comparteix un enllaç
públic amb el professorat i consulta resultats de conjunt amb OAuth o amb un
enllaç privat.

L'aplicació desa i mostra la identitat institucional del centre i del compte
responsable. Del docent no demana el nom ni persisteix el correu a MySQL: el
correu només es conserva temporalment a la sessió per revalidar el domini. La
participació es vincula a un identificador pseudònim perquè només el docent en
pugui recuperar els resultats.

`main` conté l'aplicació activa amb MySQL i aplica aquest model de
pseudonimització com a dada personal protegida.

## Objectius

- Crear un únic espai per centre amb autenticació OAuth del compte XTEC del
  centre.
- Recollir respostes pseudonimitzades d'un qüestionari fix i versionat, amb
  accés autenticat amb Google per validar el domini, evitar duplicats i
  recuperar exclusivament els resultats propis.
- Mostrar resultats de conjunt des de la primera resposta.
- Generar informes PDF de conjunt i un PDF individual només per al propietari.
- Separar estrictament la identitat del centre i del responsable de les
  respostes, i impedir l'accés institucional a participacions individuals.

## Fora d'abast

- Perfils, gestio o persistència de correus del professorat participant fora de
  la sessió mínima necessària per revalidar el domini.
- Perfils docents, cerca o seguiment individual per part del centre o administració.
- Respostes obertes.
- Exportacio de dades individuals per part del centre o administració.
- Comparatives públiques entre centres.

## Administracio del qüestionari

L'aplicació inclou una administracio global limitada al manteniment del
  qüestionari versionat i dels comptes administradors. Aquesta administracio no
  pot accedir a respostes individuals i no pot crear
filtres o exportacions que facilitin la reidentificacio de persones.

Funcionalitats previstes:

- consultar un resum inicial amb l'estat dels centres i del qüestionari actiu;
- gestionar dimensions, criteris i preguntes tancades;
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
vol començar amb un qüestionari en blanc o copiar una versió existent. Un
qüestionari en blanc comença sense dimensions, criteris ni preguntes; copiar-ne
un altre copia tota la jerarquia. L'administrador pot crear dimensions,
criteris dins de cada dimensió i preguntes dins de cada criteri. El títol
sempre és obligatori i ha de ser diferent dels títols existents. Cada versió
inclou els minuts estimats per respondre-la, configurables entre 1 i 120 minuts.
Les versions sense espais de diagnosi assignats poden desar-se com a esborrany
parcial durant l'edició. En afegir una dimensió es crea un criteri i una
pregunta inicial; en afegir un criteri es crea una pregunta inicial. Cada versió
pot tenir entre 1 i 10 dimensions, cada dimensió entre 1 i 10 criteris, cada
criteri entre 1 i 10 preguntes i cada versió fins a 100 preguntes totals.
L'activació exigeix almenys una dimensió, un criteri per dimensió i una pregunta
per criteri.

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

L'administracio inclou una pantalla de configuracio global. L'accés dels
centres té dos estats operatius:

- `closed`: mode de prellançament, actiu per defecte; els centres i el
  professorat no poden iniciar sessió ni usar el servei, però l'administració
  continua disponible i els administradors actius poden provar l'espai de centre;
- `open`: els responsables poden accedir segons la política XTEC configurada i
  el professorat pot accedir als qüestionaris i als resultats propis.

El canvi exigeix confirmació explícita i és efectiu immediatament, també per a
sessions de centre o docents existents en la petició següent. La portada no
inicia OAuth mentre el servei és tancat, però el bloqueig autoritatiu es
repeteix al callback, les pàgines i les operacions server-side.

La mateixa pantalla inclou l'opcio
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
no dona accés a respostes individuals ni canvia les garanties de separació.

La configuracio també inclou `admin_results_minimum_submissions`, un enter entre
0 i 10. En els resultats globals d'administracio, només es computen les
enquestes amb més respostes que aquest valor. Les enquestes amb un nombre de
respostes igual o inferior al llindar no s'inclouen en els totals, percentatges
ni PDF d'administracio. La pantalla de resultats mostra una frase inicial que
explica el llindar aplicat.

La configuracio global d’idiomes permet ocultar o mostrar el selector a les
capçaleres de tota l’aplicacio i decidir quines llengües hi apareixen. El canvi
de llengua és sempre explícit: no es consulta l’idioma del navegador. La
preferència es conserva en una cookie funcional, les URL no incorporen cap
prefix de llengua i una preferència absent o no vàlida torna al català. El
català és l’idioma base i de reserva.

Les traduccions de la interfície es mantenen en fitxers tipats separats per
llengua i àmbit funcional. Si una clau no té traducció o el text és buit,
s'utilitza el text català d'aquella clau. Les preguntes i opcions de resposta
es conserven en l'idioma en què les ha escrit el centre, sense traduccions
automàtiques ni nous atributs d'idioma al formulari.

La portada, els espais de centre i docent, l'administració i els controls del
qüestionari i dels resultats consumeixen aquests catàlegs, inclosos els errors
d'accés, els missatges dels endpoints i les metadades de pàgina.
Les cadenes compartides, com les accions de copiar, desar, versions i
recomptes de respostes, es defineixen una sola vegada a l'àmbit comú.
Els catàlegs d'euskera, gallec i aranès són complets funcionalment però resten
marcats com a esborranys fins que una revisió lingüística professional en
validi la redacció definitiva.

La configuracio també inclou el comunicat global per compartir el qüestionari:
títol del correu i text del missatge. El títol i el text poden contenir la marca
`{NOM_CENTRE}`, que se substitueix pel nom institucional; si la marca no hi és,
el nom no s'afegeix. El text també pot contenir `{URL_QUESTIONARI}` i
`{CODI_QUESTIONARI}`, que se substitueixen per l'enllaç públic i el codi de
l'espai. Si falta alguna marca, l'aplicacio afegeix igualment la dada al final:
el comunicat sempre inclou tant l'enllaç com el codi per permetre accessos
posteriors. El botó de la gestio del creador mostra primer el compte emissor
previst i després permet obrir Gmail/Google Workspace en una pestanya nova amb
assumpte i cos preomplerts, però sense destinataris. La confirmacio recorda al
responsable que ha d'afegir manualment al camp `Per a` els correus dels docents
del centre abans d'enviar el missatge.

### Regla de correccions menors

Una versio del qüestionari sense espais assignats es pot corregir directament.

Quan una versio ja està assignada a un espai, l'editor la mostra bloquejada per
defecte. Un administrador pot prémer `Editar` i acceptar un avís explícit abans
de modificar-la. Si la versio està activa o ja té respostes, només es poden
corregir títols, preguntes i textos de resposta existents; no es poden eliminar
ni afegir dimensions, criteris, preguntes o opcions, canviar l'idioma ni activar o desactivar
l'ordre aleatori. Les versions inactives sense respostes poden modificar
estructura.

L'activacio d'una nova versio no modifica respostes existents, no reassigna
respostes a preguntes noves i no altera els resultats dels espais anteriors.

Eliminar una versio no activa és una accio destructiva d'administracio. Després
de confirmar l'avís, s'elimina la versio i totes les seves instàncies d'espai,
respostes, dimensions, criteris i preguntes. Les versions actives no mostren el botó
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
percentatges per dimensió, percentatges per pregunta i distribucions agregades. El
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

- reiniciar les respostes, eliminant `answers`, `submissions` i les vinculacions
  `participant_submissions`, però conservant l'espai i els enllaços;
- reiniciar completament l'espai, eliminant les respostes, assignant la versió
  activa i rotant el codi públic i els tokens;
- eliminar definitivament el centre, el compte responsable, l'espai i les
  dades pseudonimitzades associades, després d'escriure el codi oficial o el correu
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
pseudonimitzada del docent mitjançant un codi o l'enllaç rebut. La
informació de versió, autoria, llicència i repositori es mostra al peu de
pàgina.

El peu també permet consultar els avisos i textos originals de les llicències
dels components de tercers a `/THIRD_PARTY_NOTICES.txt`, amb etiqueta traduïda
a les cinc llengües. Apache 2.0 continua sent la llicència del projecte; cada
component conserva la pròpia. Els textos pendents es fan explícits i bloquegen
la comprovació de preparació d'una publicació completa.

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
preferència visual local del navegador. El selector d'idioma mostra la llengua
activa i permet canviar els textos de la interfície entre les llengües
habilitades a la configuració global.

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
de 20 preguntes repartides en cinc dimensions i cinc criteris generals de compatibilitat.

El responsable inicia l'accés XTEC des de la portada i, un cop autenticat,
arriba a `/crear` per crear o gestionar el seu espai. El professorat accedeix
al qüestionari des de l'enllaç específic rebut. Un accés directe a `/crear`
sense sessió redirigeix a la portada. Abans de sortir cap a Google OAuth,
qualsevol accés de responsable de la portada obre un diàleg amb el logotip de
l'aplicació i la pàgina desenfocada. El diàleg informa que només s'hi admet el
compte institucional `@xtec.cat` assignat al centre; no substitueix la
validació de servidor ni modifica el flux d'autenticació.
L'enllaç de la portada per consultar participacions obre un diàleg equivalent
quan no hi ha sessió docent. Indica que cal fer servir el mateix compte Google
amb què es va participar i continua cap a l'OAuth docent. Amb una sessió docent
vigent, l'enllaç obre directament `/docent`.

Amb una sessió de responsable autoritzada, la portada substitueix els accessos
de centre pel vincle `El meu espai` cap a `/crear` i mostra una icona de sortida
sempre visible a la capçalera. Si la sessió de responsable és denegada, la
portada conserva l'accés inicial i mostra una sortida visible per canviar de
compte. El professorat continua tenint un flux d'accés separat.

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
`AUTH_MODE=google` verifica la signatura de l'`id_token` amb `google-auth-library`
i les claus públiques rotatives de Google, i comprova emissor, destinatari,
caducitat i `nonce`. Per als responsables demana `openid email profile` i
exigeix email `@xtec.cat`; per al professorat demana només `openid email` i
exigeix que tant el domini exacte del correu com el claim signat `hd` coincideixin
amb la política del centre. El paràmetre OAuth `hd` només orienta el selector i
no substitueix la comprovació del token.

Per als responsables desa a MySQL l'identificador opac, el correu i el nom
visible del compte, separats de les respostes. Per als participants no demana
el nom i només persisteix a MySQL un identificador opac derivat amb HMAC. El
correu es conserva a la cookie docent `HttpOnly`, signada però no xifrada,
durant un màxim de vuit hores per revalidar el domini; no s'insereix a cap
taula. El claim `hd` verificat també s'hi conserva temporalment per revalidar
la pertinença a Google Workspace. Les sessions docent i responsable tenen
cookies i esquemes separats. El mode
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
de Google Workspace
mitjançant dues targetes seleccionables, apilades en pantalles estretes i en
dues columnes en escriptori. La selecció destaca amb vora i fons, i el camp
del domini propi queda sempre visible dins de la seva targeta. En enfocar el
camp o escriure-hi, se selecciona automàticament l'opció de domini propi.
`@xtec.cat` és l'opció inicial, recomanada i
activada per defecte. El domini propi es normalitza a minúscules i només
coincideix exactament: autoritzar `escola.cat` no autoritza
`subdomini.escola.cat`.

Les dues opcions són excloents i no es poden activar alhora. La configuració es
pot modificar després des de la vista central `Configuració`.

Resultat mostrat després de crear l'espai i recuperable des de la gestio del creador:

- Enllaç públic: `/q/[publicCode]`
- Botó per obrir el correu web amb el comunicat global, l'enllaç públic i el
  codi específic de l'espai.
- Enllaç privat compartit: `/resultats/compartit/[publicCode]#token=[privateToken]`
- Enllaç de resultats del creador: `/espais/[publicCode]/resultats`
- Previsualització del qüestionari en mode lectura:
  `/espais/[publicCode]/questionari`

El token privat es desa com HMAC per validar-lo i xifrat per poder reconstruir l'enllaç per al creador autenticat. No es desa mai en text pla.

Si l'usuari ja té un espai creat, no pot crear-ne un segon. La mateixa pantalla `/crear` mostra els enllaços, el nombre agregat de respostes, l'accés als resultats, la regeneració de l'enllaç privat i el reinici del qüestionari.

Després de confirmar la fitxa i configurar els correus, `/crear` conserva la
capçalera visual de la portada. El botó d'accés se substitueix pel nom visible
del compte com a text no interactiu, a l'esquerra del selector d'idioma, del
selector de tema i de la icona `Surt`. La icona té etiqueta accessible i és
visible en tot moment, també en mòbil, a les pantalles de gestió i administració.
Quan l'accés del responsable
és denegat o el centre està suspès, la sortida també és visible a la capçalera.
En pantalles d'escriptori, la navegació de `Qüestionari`, `Fitxa` i `Configuració`
es presenta en una barra lateral que es pot plegar fins a un rail d'icones. En
tauleta el rail és la presentació predeterminada i en mòbil se substitueix per
una navegació inferior fixa amb respecte per la zona segura del dispositiu. La
mateixa navegació incorpora els enllaços `Veure qüestionari` i `Ves als
resultats`; aquests accessos no es repeteixen a la zona central. La
preferència expandida o plegada es conserva localment al navegador. La zona
central mostra inicialment la gestió del qüestionari, sense contenidors de
targeta superposats. La part superior mostra el codi públic del qüestionari
amb la seva etiqueta, sota el títol i la versió. Canviar de vista no reinicialitza l'estat local de la
gestió ni elimina cap funcionalitat. El control de plegat és una única icona a
la part superior de la barra, abans del nom del centre. La capçalera i la barra
lateral es mantenen fixes a la pantalla; el desplaçament vertical queda limitat
al contingut principal. El peu de pàgina no és flotant ni fix: queda al final
del contingut i només apareix d'entrada quan la vista és prou curta. El tema
desat s'aplica des de la instrumentació client abans de la hidratació, fora de
l'arbre React, per evitar errors en recàrregues i navegacions en mode fosc.

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

- elimina totes les `submissions`, `answers` i vinculacions pseudònimes de l'espai;
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
selector clar o fosc. Amb sessió docent, mostra també la mateixa icona `Surt`
que l'espai del centre, sense mostrar la identitat del participant. No mostra
navegació lateral ni peu de pàgina, perquè el docent només ha de seguir el flux
del qüestionari. La paleta, les superfícies,
els botons i les opcions de resposta comparteixen el sistema visual de la resta
de l'aplicació.

El formulari ha de mostrar:

- Objectiu de la diagnosi.
- Informació clara sobre la vinculació pseudònima i la recuperació de resultats.
- Identificació del centre promotor, però no recollida de noms, IP, dispositiu
  ni respostes obertes del professorat, ni persistència del correu fora de la
  sessió mínima.
- Resultats propis per al docent i només de conjunt per al centre i l'administració.
- Indicacio que cal respondre una sola vegada.
- Emoji de rellotge amb els minuts estimats necessaris per respondre el
  qüestionari.
- Versio i temps estimat com a metadades informatives, sense aparença de botó.
- Avís amb emoji quan l'usuari ja ha respost, diferenciat visualment de les
  accions.

Per obrir el formulari, el docent ha d'iniciar sessio amb un compte Google del
domini admès. Aquesta sessió no demana el perfil nominal ni crea un perfil
docent. El correu es conserva només a la cookie docent temporal per revalidar
el domini i, amb el claim `hd` verificat, confirmar que el compte és de Google
Workspace; cap dels dos valors no s'insereix a MySQL. El servidor deriva del
`sub` un identificador opac amb HMAC i el vincula a la submission a
`participant_submissions`. La restricció única per espai i participant
impedeix una segona resposta.

El docent respon totes les preguntes obligatories de la versio assignada a
l'espai. Cada pregunta té exactament quatre respostes, redactades per
l'administrador en l'idioma propi del qüestionari. Les puntuacions són fixes:

- `0`: Gens / No ho faig
- `1`: Una mica / Ocasionalment
- `2`: Bastant / Habitualment
- `3`: Molt / Soc un referent al centre

No hi ha camps oberts.

Les opcions de resposta ocupen tota l'amplada de la targeta; els controls de
selecció no es mostren visualment, però es mantenen accessibles amb teclat i
lectors de pantalla. L'opció triada destaca amb més contrast de vora i fons en
tema clar i fosc, tant amb colors graduats com amb un sol color.

La introducció resumeix l'objectiu i el nombre de preguntes obligatòries amb
una única participació per docent. Dos blocs breus expliquen la privacitat
(sense nom i correu només durant la sessió) i els resultats (recuperació pròpia
amb vinculació pseudònima i accés institucional exclusivament de conjunt).
En pantalles amples, el formulari públic comparteix l'amplada màxima i els
marges horitzontals de la capçalera, perquè les opcions llargues ocupin menys
línies.

Cada pregunta pot activar un ordre aleatori independent. En aquest cas les
quatre opcions es barregen en obrir el qüestionari i mantenen aquell ordre
durant la sessió; es mostren amb colors neutres per no revelar la puntuació.
Quan l'ordre és fix es poden conservar els colors graduats. El navegador envia
només l'identificador de l'opció i el servidor n'obté la puntuació. Els
resultats i informes ordenen sempre les opcions de `0` a `3`.

El formulari docent presenta cada criteri en una pàgina independent. La part
superior de cada pàgina mostra `Dimensió N` i el títol de la dimensió en una
mateixa línia i mida, amb un blau més intens per destacar-ne la importància. A
sota apareix el criteri en blau i una mica més gran que el text de les preguntes;
cada pregunta mostra el número i el text junts, amb la mateixa mida i color. La
navegació exigeix respondre totes les preguntes del criteri abans de continuar.

Quan falten respostes, el formulari identifica les preguntes pendents, les
associa als controls corresponents i porta el focus a la primera sense moure
la pàgina. La llista d'errors permet saltar directament a qualsevol pregunta
pendent. El formulari conserva la posició de lectura quan es completa
l'última resposta pendent; el desplaçament automàtic a l'inici només es fa en
canviar de criteri. El formulari
d'accés per codi mostra el format requerit al placeholder, conserva l'ajuda per
als lectors de pantalla i associa l'error de format al camp, sota els controls.
La comprovació pública només valida el format; els errors posteriors que podrien
revelar si un codi existeix continuen sent genèrics, tret de l'ajuda de domini
per a una sessió docent vàlida descrita a continuació.
L'error d'accés docent demana comprovar que el codi està ben escrit i que
s'utilitza el compte Google autoritzat pel centre, sense identificar la causa.
Des de l'àrea docent autenticada, introduir un altre codi reutilitza la sessió
vigent. La pàgina del qüestionari valida de nou al servidor el codi, l'estat i
el domini autoritzat; no cal repetir OAuth mentre la sessió sigui vàlida.
Si aquesta validació falla, es torna a `/docent` amb un avís genèric sobre el
formulari de codi, mantenint la sessió oberta per permetre un altre intent.
Quan el codi existeix, el qüestionari està actiu i el compte no compleix la
política de domini, l'avís indica únicament el domini requerit i demana canviar
de compte Google. Aquesta excepció confirma l'existència del codi a un docent
autenticat, està subjecta al límit d'intents i es revalida al servidor. Codis
inexistents, espais inactius, polítiques no configurades i intents bloquejats
mantenen el missatge genèric; no es mostra cap nom del centre ni dada docent.

Cada espai de diagnosi admet un màxim de 300 respostes completes. Quan s'arriba
a aquest límit, el formulari ja no accepta nous enviaments i informa que el
qüestionari ha arribat al màxim de respostes.

Quan el servidor accepta l'enviament, redirigeix al resultat propi. La base de
dades és l'única font de veritat; no es manté cap bloqueig paral·lel al navegador.

Les respostes encara no enviades només es mantenen a la memòria de la pàgina:
no es desen a localStorage, sessionStorage, cookies ni al servidor. Si hi ha
respostes pendents, el navegador avisa abans de recarregar, tancar o abandonar
la pàgina. Si la sessió docent caduca en enviar, el formulari conserva les
respostes a la pàgina oberta i ofereix tornar a autenticar-se en una pestanya
nova; després d'autenticar-se, el docent pot enviar-les des de la pàgina
original. Recarregar-la o tancar-la encara esborra les respostes pendents.

### Àrea i resultats docents

Rutes: `/docent` i `/docent/resultats/[publicCode]`

L'àrea docent exigeix sessió Google i mostra només centre, qüestionari i data
de les participacions vinculades a l'identificador opac de la sessió.
L'àrea i el resultat propi mostren la mateixa icona `Surt` de la capçalera del
centre quan la sessió docent és activa.
L'àrea docent i els resultats propis comparteixen una barra lateral plegable,
inicialment reduïda a icones. Té tres opcions: `Inici`, amb un recompte dels
qüestionaris fets i l'últim qüestionari; `Nou qüestionari`, que indica que el
centre facilita el codi i mostra l'accés per codi; i `Qüestionaris`, que mostra
al centre tots els qüestionaris fets. Aquesta darrera opció desplega un submenú
amb només els títols dels qüestionaris propis, cadascun amb accés al seu
resultat. La llista central també permet obrir cadascun dels resultats. Dins
d'un resultat, el menú conserva aquestes tres opcions i el submenú, sense
enllaços addicionals al resum ni a les respostes per dimensions.
La targeta per introduir el codi de `Nou qüestionari` té una amplada moderada
en pantalles grans i ocupa l'espai disponible en pantalles petites.
L'estat plegat es conserva entre les pàgines docents. Al mòbil, els mateixos
accessos apareixen en un selector flotant compacte. La barra lateral no redueix
el nombre de gràfiques per fila en pantalles amples.
La capçalera del resultat propi comparteix l'amplada adaptable de la vista,
fins a 1536 px, amb marges laterals també a l'escriptori i el menú lateral
situat sota el logotip.
El resultat propi mostra el nom institucional a la capçalera de l'aplicació,
just abans de les icones. El retorn a la llista de qüestionaris es fa des del
menú docent, sense un botó duplicat al contingut. La descàrrega del PDF queda
després de la caixa CD al costat del títol, amb un petit espai; quan no hi cap, passa
a la línia següent. Només la data es mostra sota el títol; la versió no es
mostra al resultat web docent. La caixa de CD té les vores arrodonides com les targetes
de dimensions i queda centrada verticalment respecte del bloc de títol i
subtítol; el botó PDF queda alineat a dalt.
El títol `Resultat individual`
només és accessible als lectors de pantalla. El títol del qüestionari
apareix al principi amb una mida més gran, amb la data just a sota en un estil més discret,
seguits del resum gràfic amb una barra de 0 a
100 per cada dimensió, sense títol ni text introductori addicionals, amb un
indicador de la posició obtinguda i els tres terços `Bàsica`, `Intermèdia` i
`Avançada`. Les barres es disposen en una columna al mòbil, dues en amplades
mitjanes i quatre a partir de 1280 px; la vista de resultats aprofita l'amplada
disponible fins a 1536 px, inclosa la barra lateral. Dins de cada fila, les barres queden
alineades encara que els títols tinguin longituds diferents. El valor és la
suma de les respostes de la dimensió dividida pel màxim possible, reescalada a 0–100.
Els límits són exactament un terç i dos terços, sense arrodonir abans de
classificar. Un valor 0 queda a l'extrem esquerre de l'etapa bàsica. L'etiqueta
del terç corresponent queda destacada; el lector de pantalla també rep la
posició numèrica. No es repeteixen el nivell ni la puntuació al costat del
títol, ni els extrems 0 i 100 sota les barres. Cada barra porta al detall de les
preguntes i respostes de la dimensió. La capçalera web presenta una caixa
`CD docent en IA` entre el títol i el botó PDF, amb l'etapa global del docent.
La puntuació global és la mitjana aritmètica de les puntuacions normalitzades
de les dimensions, amb el mateix pes per dimensió encara que tinguin nombres
de preguntes diferents. Es calcula des de les respostes pròpies sense arrodonir
les dimensions abans de fer la mitjana ni classificar pels mateixos terços.
Només es mostra l'etapa, sense percentatge global; sense dimensions completes,
la caixa mostra `Sense dades`. És exclusiva del docent propietari.

Les targetes de dimensió són seleccionables. En seleccionar-ne una, queda
ressaltada amb un fons blau i, a sota, es mostren en una fila els gràfics de
les puntuacions dels criteris d'aquella dimensió, amb la mateixa escala visual.
La puntuació de cada criteri es calcula només a partir de les respostes de la
participació pròpia.

El resultat propi presenta cada dimensió en un desplegable i agrupa les
preguntes sota el criteri corresponent. En obrir-lo, mostra les preguntes i les
quatre opcions de resposta amb el mateix disseny del qüestionari;
la resposta triada queda destacada. Les preguntes amb ordre aleatori conserven
els colors neutres i mostren les opcions en ordre de puntuació, perquè l'ordre
aleatori de la sessió no es desa. El PDF individual mostra igualment les
quatre opcions de cada pregunta i destaca la resposta triada, sense etiqueta ni
puntuació numèrica; les preguntes s'agrupen sota els títols de dimensió i
criteri. Manté l'estructura de resum per dimensions i detall de respostes. La data i l'hora de realització es
mostren en la zona horària `Europe/Madrid`, independentment de la zona del
servidor. Es pot consultar també quan l'espai està tancat. No mostra la
identitat docent, identificadors interns, resultats del centre, comparacions o
dades d'altres participants. Les dimensions i els criteris definits a cada
versió formen part de la visualització del qüestionari i del resultat propi.

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
- A la targeta resum, el percentatge global es representa com l'etapa agregada
  `Bàsica`, `Intermèdia` o `Avançada`, sota el títol `CD docent en IA` i amb
  el color corresponent; si no hi ha dades, es mostra `Sense dades`.
- Percentatge per dimensió.
- Distribució agregada de les puntuacions docents de cada dimensió en nou trams
  percentuals; només es retornen recomptes, sense puntuacions ni identificadors
  individuals.
- Gràfica de barres per dimensió amb l'eix vertical etiquetat com a nivell bàsic,
  intermedi i avançat. Dues línies fines marquen els límits dels rangs; el fons
  té un degradat de vermell a verd amb opacitat reforçada per igualar les
  gràfiques de distribució docent. Les barres són estretes, amb farcit semitransparent
  pastel segons l'etapa i contorn negre.
- Les etiquetes de les gràfiques de barres i d'aranya mostren els noms complets
  a la llegenda de quatre columnes sota les gràfiques i al gràfic d'aranya.
  Els noms complets apareixen sota les barres, en diverses línies per evitar
  superposicions; cap línia no envaeix la zona del gràfic. L'eix horitzontal
  hi reserva prou alçada.
- Gràfica d'aranya per dimensió sense etiquetes numèriques de percentatge i amb un
  degradat de color de valors baixos a alts.
- En seleccionar una dimensió al gràfic de barres, la dimensió queda ressaltada
  amb fons blau i apareixen a sota, en una fila desplaçable, els gràfics de
  percentatge dels seus criteris. Els percentatges de criteri es calculen només
  a partir de recomptes de respostes agregats.
- Percentatge per pregunta.
- Distribució per pregunta amb recomptes i percentatges per puntuació, sense
  repetir el text de cada opció a la taula.
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
- Gràfica general de les dimensions.
- Grafiques i resultats de cada pregunta.
- Resum de fortaleses.
- Àmbits amb marge de millora.
- Nota metodològica.
- Avis que no és una avaluació individual del professorat.

El PDF no inclou dades personals, token privat ni respostes individuals.
La llengua del PDF és la llengua obligatòria de la versió del qüestionari
(`ca`, `es`, `eu`, `gl` o `oc`), independentment de la llengua d'interfície
triada per l'usuari. Les preguntes i respostes no es tradueixen automàticament.

## Qüestionari v1

Versió inicial: `2026.1`

Versió activa corregida: `2026.2`

Estructura inicial:

- 5 dimensions històriques.
- 1 criteri general per dimensió a la migració de compatibilitat.
- 4 preguntes per criteri.
- 20 preguntes totals.
- Totes obligatories.
- Totes amb quatre respostes pròpies i puntuacions fixes `0`, `1`, `2`, `3`.
- Idioma `ca` i ordre aleatori desactivat en les versions migrades.

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

"No demanem el teu nom. El correu es conserva només durant la sessió per validar el domini i no es desa a la base de dades ni es vincula a les respostes. La participació queda vinculada a un identificador pseudònim perquè puguis recuperar les respostes i resultats amb el mateix compte. El centre i l'administració només veuen dades agregades. Respon una sola vegada."

### Avis amb poques respostes

"Poques respostes: interpreta els resultats amb prudència."

### Avis metodologic del PDF

"Aquest informe de centre presenta resultats de conjunt i no permet consultar ni reconstruir participacions individuals."

## Requisits no funcionals

- Validacio estricta al servidor.
- Cap secret al client.
- Cap dada individual als taulers o PDF institucionals; el resultat i PDF
  docents només contenen la participació pròpia validada amb sessió.
- Objectiu d’accessibilitat WCAG 2.2 AA: semàntica compatible amb lectors de
  pantalla, formularis etiquetats, contrast suficient, focus visible, navegació
  completa amb teclat i reducció del moviment segons la preferència del sistema.
- UI clara i institucional, sense aparenca de ranquing ni avaluació personal.
