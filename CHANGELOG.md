# Registre de canvis

Els canvis destacables d'aquest projecte es documenten en aquest fitxer.
El format segueix Keep a Changelog i les versions de l'aplicació segueixen
Semantic Versioning.

## [Unreleased]

- Mostra els noms complets de les dimensions sota les barres i al gràfic
  d'aranya, ajustats en diverses línies i amb més espai perquè no se superposin
  ni envaeixin les barres. Els noms queden separats de l'eix horitzontal.

- Reforça el color del fons degradat a la gràfica de percentatges per dimensió
  perquè s'aproximi a la intensitat de les distribucions docents.

- Oculta la versió al resultat web docent i conserva la data sota el títol.

- Afegeix al resultat web docent una caixa de CD docent en IA entre el títol
  i el PDF, amb l'etapa calculada per la mitjana de dimensions amb pes igual.
  Arrodoneix la caixa, la centra respecte del títol i subtítol i alinea el PDF a dalt.

- Amplia el títol del resultat docent i situa la data a sota,
  i la descàrrega del PDF just després del títol; quan no hi cap, el botó passa a sota.

- Elimina el botó duplicat de retorn a les diagnosis al resultat docent;
  la navegació queda al menú i la descàrrega del PDF continua a la dreta.

- Amplia el resultat docent i mostra quatre dimensions per fila en pantalles
  amples, dues en amplades mitjanes i una al mòbil, amb les barres alineades.
  La capçalera s'adapta a la mateixa amplada que la vista de resultats.
  Manté marges laterals a l'escriptori i situa el menú sota el logotip.

- Unifica la col·lació de `questions.criterion_id` amb la de la resta
  d'identificadors relacionats perquè les consultes de criteris funcionin a
  MySQL quan el valor per defecte de la base de dades és diferent.
- Organitza les noves versions del qüestionari per dimensions, criteris i
  preguntes, i permet començar en blanc o copiar una estructura existent.
- Accepta qualsevol text no buit com a títol i versió del qüestionari, amb un
  màxim de 20 caràcters per a la versió.
- Permet seleccionar una dimensió als resultats per ressaltar-la i veure els
  gràfics agregats dels seus criteris.
- Al resultat individual, permet seleccionar una dimensió per ressaltar-la i
  veure en una fila els gràfics dels criteris corresponents.
- Fa opac i llegible el tooltip de respostes al gràfic de resultats del centre.

- Substitueix el percentatge global de la targeta de resum per l'etapa de CD
  docent en IA, destacada en gran i amb el color corresponent.

- Afegeix al principi de cada bloc una distribució de les puntuacions docents
  en nou trams percentuals, tres per etapa, calculada i retornada exclusivament
  com a recomptes agregats.

- Actualitza els gràfics de resultats per mostrar els nivells bàsic, intermedi i
  avançat a l'eix vertical, amb línies fines que marquen els límits dels rangs i
  degradat de fons; el gràfic d'aranya conserva el degradat i amaga percentatges.

- Fa més estretes les barres del resum per blocs i les omple amb colors pastel
  semitransparents segons l'etapa, mantenint el contorn negre.

- Treu el text de les opcions de la taula de distribució per pregunta; conserva
  els recomptes i percentatges sota cada puntuació.

- Amaga els cercles dels controls de resposta i amplia l'espai disponible per
  al text, mantenint la selecció accessible amb teclat i lectors de pantalla.
  Reforça el contrast de l'opció triada en els temes clar i fosc.

- Amplia el formulari públic fins a l'amplada de la capçalera en pantalles
  grans, perquè les opcions de resposta llargues ocupin menys línies.

- Manté la posició de lectura en completar les respostes pendents d'un bloc,
  en lloc de saltar automàticament a l'inici de la pàgina.

- Evita que el focus automàtic a una pregunta pendent desplaci la pàgina.

- Simplifica la llista d'errors del qüestionari per mostrar només el número de
  cada pregunta pendent.

- Mostra només el text de la resposta triada al resultat i al PDF individuals,
  sense etiqueta ni puntuació.

- Mostra al resultat docent les quatre opcions de cada pregunta i destaca la
  resposta triada; agrupa les preguntes en blocs plegables.

- Adapta el PDF individual perquè també mostri les quatre opcions i ressalti la
  resposta triada, sense etiqueta ni puntuació numèrica.

- Apropa les opcions a cada pregunta del PDF individual i separa més les
  preguntes entre si.

- Redueix l'interlineat del text de les preguntes al PDF individual.

- Treu l'escala numèrica del títol «Perfil per blocs» al PDF individual.

- Mou la nota de privacitat del PDF individual del peu repetit al final del
  document.


- Redueix l'amplada de la targeta per introduir el codi a «Nou qüestionari».

- Afegeix a «Nou qüestionari» una indicació breu que el centre facilita el codi
  d'accés.

- Organitza l'àrea docent en Inici, Nou qüestionari i Qüestionaris. La llista
  central i el submenú permeten obrir els resultats propis; el submenú només
  mostra els títols, sense detalls dels blocs.

- Comparteix el menú lateral plegable entre l'àrea docent i els resultats:
  conserva l'accés a totes les diagnosis pròpies. Inclou selector compacte al mòbil.

- Destaca el nom i la versió del qüestionari al resultat docent i deixa la data
  en un estil més discret.

- Presenta el resultat docent com un perfil de barres per blocs amb etapes
  bàsica, intermèdia i avançada, amb accés al detall de les respostes. El PDF
  individual segueix la mateixa estructura i deixa de destacar un percentatge
  global. El degradat reserva una franja més ampla al groc central. El nom
  institucional passa a la capçalera i les gràfiques queden més amunt.

- Evita que l'última lletra del títol amb degradat de la portada sembli
  retallada per l'espaiat ajustat entre lletres.

- L'enllaç de la portada per consultar participacions obre un diàleg d'accés
  docent amb el mateix estil que el del centre. Una sessió docent vigent entra
  directament a les participacions.

- Recupera el botó arrodonit `Les meves diagnosis` al resultat docent i situa
  la descàrrega del PDF a la seva dreta.

- Unifica la sortida docent amb la icona de centre a l'àrea, el resultat propi
  i el qüestionari autenticat, sense mostrar identitat docent.

- Situa el nom del responsable com a text no interactiu a l'esquerra de les
  icones de la capçalera i elimina el menú del compte.

- Corregeix el rebuig del formulari de sortida en navegadors que no envien
  `Origin` en un POST propi: el `Referer` només s'envia dins del mateix origen
  perquè el proxy pugui validar-lo sense divulgar rutes a webs externes.

- Mostra una icona de sortida sempre visible a la gestió del centre i a
  l'administració. La portada
  amb sessió de responsable ofereix `El meu espai` i sortida directa, també en
  mòbil, i les pantalles d'accés denegat mantenen la sortida a la capçalera.
  En mode local, sortir desactiva la sessió de prova fins a la següent entrada.

- Actualitza `mysql2`, `postcss` i les dependències indirectes `nanoid` i
  `baseline-browser-mapping` a versions corregides després de l'auditoria de
  seguretat de les dependències de producció.

- Afegeix `private, no-store, max-age=0` als resultats, PDF i respostes amb
  enllaços privats, inclosos els errors, per evitar-ne l'emmagatzematge en
  memòries cau HTTP. La descàrrega expressa dels PDF continua disponible.

- Rebutja peticions de mutació originades en altres webs, incloent altres
  subdominis, abans d'executar endpoints i accions. Exigeix `Origin` o,
  si és absent, `Referer` del mateix origen; conserva el callback OAuth.

- Activa la Content Security Policy amb un nonce nou per petició per autoritzar
  els scripts de Next.js i bloquejar scripts inline sense autorització. Manté
  els estils calculats dels gràfics i del qüestionari, sense telemetria nova.

- Bloqueja les redireccions externes amb barres inverses o caràcters de control
  a login, callback i logout. El callback revalida també les destinacions de
  l'estat OAuth signat i el logout continua amb GET mitjançant una resposta
  `303`, sense reenviar el POST.

- Afegeix l'enllaç traduït «Llicències de tercers» al peu compartit i genera
  `THIRD_PARTY_NOTICES.txt` des de la compilació de producció, amb textos
  originals i identificació separada de React i React DOM incorporats a Next.js.
  La comprovació de publicació valida els recursos distribuïts pel servei web,
  inclosos webpack, Tailwind/Preflight, polyfills i la icona GitHub amb origen
  verificat. Els textos pendents del servidor es comproven separadament abans
  de distribuir-ne binaris; es documenten a `docs/THIRD_PARTY_LICENSES.md`.
  El servidor de desenvolupament selecciona Turbopack explícitament per
  conviure amb el hook webpack de producció.

- Resumeix la introducció del qüestionari i agrupa la informació essencial
  en dos blocs de privacitat i resultats, amb la participació destacada.

- Manté sempre visible el camp de domini propi i selecciona aquesta opció
  automàticament en enfocar-lo o escriure-hi.

- Redissenya la configuració d'accés docent amb dues targetes seleccionables,
  un estat actiu destacat i el camp de domini integrat en l'opció pròpia.

- Mostra el codi del qüestionari a la part superior de la gestió del centre,
  sota el títol i la versió, perquè es pugui consultar directament.

- L'avís d'accés mostra el domini requerit quan un docent autenticat introdueix
  un codi actiu amb un compte no autoritzat. Revalida la política al servidor
  i manté el límit d'intents; documenta l'excepció de divulgació del domini.

- Els errors de codi o domini amb sessió docent oberta tornen a «Les meves
  diagnosis», mostren l'avís al costat del formulari i conserven la sessió.

- L'accés a un altre qüestionari des de l'àrea docent reutilitza la sessió
  oberta i valida el codi i el domini al servidor sense repetir Google OAuth.

- Aclareix l'error d'accés docent: demana comprovar el codi i el compte Google
  autoritzat pel centre, mantenint un missatge genèric en totes les llengües.

- Corregeix la disposició del camp i el botó d'accés docent: retira l'ajuda
  visual redundant del format del codi i mostra els errors sota els controls.

- Centralitza i tradueix els textos comuns de la web, l'administració, l'àrea
  docent, els controls del qüestionari i els errors dels endpoints. Cada clau
  absent o buida recupera el text català; les preguntes i opcions del centre
  es conserven sense canvis.

- Millora els errors de formulari: identifica i enfoca les preguntes pendents,
  associa l'error al control i explica el format del codi sense revelar si
  existeix.

- Avisa abans d'abandonar un qüestionari amb respostes pendents. Si la sessió
  docent caduca en enviar, permet autenticar-se en una pestanya nova i reprendre
  l'enviament des de la pàgina original sense desar cap esborrany al navegador.

- Substitueix la consulta de depuració `tokeninfo` per la verificació local de
  signatura i claims dels tokens Google, i exigeix que el domini del correu i
  el claim Workspace `hd` coincideixin amb la política del centre.

- Cada pregunta disposa ara de quatre textos de resposta administrables amb
  puntuacions fixes `0–3`, opció d'ordre aleatori i colors neutres quan es
  barregen.
- El navegador envia l'identificador de l'opció seleccionada i el servidor en
  deriva la puntuació; la migració conserva les opcions i respostes existents.
- Cada versió fixa un idioma entre català, castellà, euskera, gallec i aranès;
  els PDF usen aquest idioma i els resultats ordenen sempre les opcions de 0 a 3.

- Converteix el selector d'idioma en una selecció funcional, persistent i
  explícita, sense detecció de l'idioma del navegador, amb català de reserva i
  catàlegs tipats separats per llengua.
- Tradueix l'espai de creació i gestió dels centres reutilitzant les cadenes
  comunes dels catàlegs d'idioma.
- Completa els catàlegs d'euskera, gallec i aranès, elimina els blocs heretats
  d'altres llengües i valida automàticament claus i placeholders; aquests tres
  catàlegs resten pendents de revisió lingüística professional.

### Added

- Afegit el mode de prellançament administrable, tancat per defecte, que
  bloqueja al servidor l'accés dels centres i del professorat i permet als
  administradors actius provar l'espai de centre abans de l'obertura pública.
- Afegida la vinculació pseudònima `participant_submissions`, l'àrea docent,
  la recuperació de respostes i puntuacions pròpies i el PDF individual sota demanda.
- Afegit l'accés docent per codi amb comprovació posterior a OAuth, errors
  genèrics i limitació progressiva d'intents en memòria per a desenvolupament.

### Security

- Actualitzats Next.js i `eslint-config-next` a la versió exacta `16.3.6`
  per corregir vulnerabilitats conegudes del framework, inclosa la denegació
  de servei en Server Actions (S01).
- Separades les cookies de sessió docent i responsable. L'OAuth docent ja no
  demana el perfil nominal i la seva cookie no conté el nom; conserva només
  l'identificador pseudònim, el correu necessari per revalidar el domini i la
  caducitat. La cookie compartida anterior s'elimina en la petició següent.
- El centre i l'administració continuen rebent exclusivament resultats agregats;
  les consultes individuals deriven el propietari de la sessió i no accepten
  identificadors de participant o submission del navegador.
- La migració de canvi de model elimina les respostes i bloquejos de prova abans
  de crear la vinculació pseudònima. Cal fer una còpia de seguretat abans d'aplicar-la.

### Fixed

- Eliminat el `<script>` inline del layout que React 19 advertia que no
  executaria durant la navegació client; les preferències visuals s'inicialitzen
  ara des d'un component client compartit, fora de qualsevol etiqueta `script`.
- Reforçada l’accessibilitat amb salt al contingut, focus visible, contrast de
  les accions, progrés programàtic i anuncis per als lectors de pantalla.
- Corregits els rols dels desplegables informatius i afegida semàntica tabular
  com a alternativa als gràfics de resultats.
- Afegit al peu de pàgina un accés compacte amb icona a la referència oficial
  WCAG 2.2.
- Corregida la col·lació de `admin_centre_actions.actor_user_id` perquè sigui
  compatible amb `admin_users.user_id` en consultar l'activitat dels centres.

### Changed

- Traslladada la compartició de l’enllaç privat a la pantalla `Resultats` i
  simplificada la navegació lateral del centre eliminant-ne el separador
  `Accessos`.
- Millorada la gestió del centre amb una previsualització més explícita, un
  comptador de respostes enllaçat, l’estat actiu visible, confirmacions de còpia
  reforçades i el reinici replegat dins d’opcions avançades.
- Reforçada a la portada la visibilitat de l’accés docent a les participacions
  pròpies amb dues targetes diferenciades per a l’accés amb codi i la recuperació
  de participacions anteriors.
- Ajustades les quatre seccions principals de la portada perquè ocupin com a
  mínim una pantalla completa i mantinguin el contingut centrat.
- Corregida la posició dels salts interns de la portada perquè les seccions no
  quedin desplaçades cap avall sota la capçalera fixa.
- Compactada la segona pantalla de la portada perquè el subtítol ocupi una sola
  línia en escriptori i l’accés a la pantalla següent continuï visible.
- Intercanviat l’ordre de les dues últimes pantalles de la portada: la mostra
  del qüestionari precedeix ara l’accés docent.
- Afegit a la mostra del qüestionari l’indicador inferior per avançar fins a
  l’accés docent.
- Unificada l’escala tipogràfica dels títols principals de les pantalles 2, 3
  i 4 de la portada.
- Integrat el peu de pàgina dins l’alçada de la quarta pantalla i reduït l’espai
  inferior de les targetes perquè el peu sigui visible en arribar-hi.
- El comunicat al professorat inclou sempre l'enllaç directe i el codi del
  qüestionari, també quan la plantilla administrativa omet alguna de les dues
  marques.
- El model deixa de presentar-se com a completament anònim: no desa el nom ni
  el correu docent, però tracta l'identificador opac com a dada personal pseudonimitzada.

- El comunicat només incorpora el nom del centre quan l’administració escriu
  explícitament la marca `{NOM_CENTRE}` al títol o al cos.
- Reorganitzada la gestió del qüestionari del centre en passos diferenciats per
  compartir el formulari i els resultats, amb una jerarquia d’accions més clara
  i el reinici separat en una zona de perill.
- Adoptat WCAG 2.2 AA com a objectiu d’accessibilitat i documentada la matriu
  de verificació manual necessària abans d’una declaració formal.
- La configuració d'accés del professorat obliga a triar exclusivament entre
  `@xtec.cat` i un domini propi, sense permetre activar les dues opcions alhora.
- Reestructurats els tres blocs informatius de la segona pantalla per explicar
  el fonament pedagògic, la gestió del centre i la participació docent anònima.
- Substituït l'accés redundant de la targeta del centre per l'aclariment que
  cada centre disposa d'un únic espai de diagnosi.
- Convertit l'accés XTEC de la capçalera de la portada en un botó circular blau
  amb la mateixa icona d'accés; les pantalles internes no canvien.
- Afegit el desplaçament vertical suau des de `Descobreix-ne més` fins a la
  informació inferior de la portada, respectant la reducció de moviment.
- Afegida una icona de desplaçament al final de la segona pantalla per accedir
  suaument a la mostra del qüestionari, sense text visible.
- Compactada la tercera pantalla en monitors perquè la introducció i la mostra
  completa del qüestionari càpiguen dins del viewport.
- Afegida la secció inicial `Resum` a l'administració, amb sis indicadors
  agregats i la informació principal del qüestionari actiu; les respostes
  computables respecten el llindar de privacitat configurat.
- Convertits els indicadors del resum en accessos directes amb filtres i afegit
  un apartat d'avisos accionables que només apareix quan cal atenció.
- Compactada la graella d'indicadors del resum i integrada visualment amb el
  fons de l'administració mitjançant separadors lleugers.
- Afegida la secció administrativa `Centres`, amb cerca, fitxa institucional,
  responsable, dominis, estat del qüestionari i recompte agregat subjecte al
  llindar de privacitat.
- Afegides la suspensió reversible, el reinici de respostes, el reinici complet
  i l'eliminació confirmada de centres, amb transaccions i auditoria mínima.
- Afegida una configuració global per mostrar o ocultar el selector d’idioma i
  triar les llengües previstes visibles a totes les capçaleres; el català es
  manté com a única llengua funcional.
- Integrada la gestió d'usuaris dins la pàgina d'administració, amb un formulari
  d'invitació més compacte i l'opció d'eliminar invitacions pendents.
- Integrats el selector de versió i el tauler de resultats dins la pàgina
  d'administració, sense modificar-ne els càlculs ni les accions.
- Afegida la selecció de resultats administratius per a tots els centres o per
  a un centre identificat concret, amb el mateix llindar, agregació i PDF.
- Vinculats els selectors de centre i qüestionari perquè només mostrin
  combinacions amb resultats elegibles, i eliminat el text introductori
  redundant de la vista.
- Integrades les opcions de configuració al fons de la pàgina, amb apartats
  visualment diferenciats i opcions relacionades més compactes, sense panells
  superposats ni canvis de comportament.
- Eliminat de totes les capçaleres el control desplegable de privacitat i
  anonimat, juntament amb el seu contingut.
- Completat el flux dels responsables XTEC no oficials en mode `all_xtec`: ara
  reben una fitxa institucional de prova, poden configurar i publicar el
  qüestionari i recuperen automàticament els espais previs sense `centre_id`.
- Impedida des del codi la creació de nous espais de diagnosi sense una fitxa
  institucional associada, sense modificar l'esquema de la base de dades.
- Validada també al servidor la configuració inicial abans de crear l'espai;
  la gestió ja no es mostra sense fitxa i l'OAuth de participants no registra
  fitxes de responsables.
- Revisats lingüísticament els textos de la portada i els seus microtextos.
- Reformulats els tres reclams principals per resumir la participació anònima,
  els resultats col·lectius i l'orientació al claustre.
- Eliminat l'estat `Beta` dels peus de pàgina i canviada l'etiqueta d'autoria
  per `Autor`.

## [0.4.0] - 2026-08-30

### Changed

- Redissenyada la portada amb un hero a pantalla completa, jerarquia visual
  actualitzada, capçalera fixa translúcida i contingut metodològic sota el
  primer viewport.
- Afegit un selector persistent de tema clar o fosc a la capçalera de la
  portada.
- La capçalera passa de transparent a translúcida amb una transició suau en
  desplaçar la pàgina, amb retard inicial i degradat inferior perquè el text no
  es talli sobtadament; el tram central guanya intensitat i l'estat final és més
  opac i desenfocat. Una màscara vertical manté transparent la vora d'entrada i
  reforça progressivament la zona central i superior.
- Afegit un selector informatiu i minimalista amb les llengües oficials i
  cooficials previstes, cadascuna presentada amb el seu autònim.
- Simplificada la capçalera: el selector mostra només `CA` sense fletxa i la
  informació de versió, llicència i codi font passa al peu de pàgina.
- Simplificada l'acció principal a un únic accés amb el compte de centre.
- Afegit un diàleg previ a l'autenticació, amb el logotip de Diagnosi IA i el
  fons de la portada desenfocat, que informa que l'accés de gestió requereix el
  compte institucional `@xtec.cat` del centre abans de continuar amb Google.
- Afegit el símbol blau de Diagnosi IA com a favicon.
- Simplificat el diàleg d'accés per mostrar només el compte institucional
  requerit i l'acció de Google, sense repetir explicacions sobre l'accés o la
  separació de les respostes, i incorpora un halo de marca subtil.
- Revisats lingüísticament els textos de la portada per millorar-ne la
  naturalitat, la precisió terminològica i la coherència dels microtextos.
- Afegida al final de la portada una previsualització estàtica de la primera
  pregunta del qüestionari actiu i de les quatre opcions de resposta.
- Redissenyada la pantalla autenticada del centre perquè comparteixi la
  capçalera, el tema i el llenguatge visual de la portada. El nom del compte
  substitueix l'accés i desplega la identificació de la sessió i l'acció de
  sortir.
- Substituïda la navegació horitzontal de l'espai del centre per una sidebar
  plegable a escriptori, un rail d'icones a tauleta i una navegació inferior
  fixa en mòbil per accedir a `Qüestionari`, `Fitxa` i `Configuració`.
  Els accessos `Veure qüestionari` i `Ves als resultats` també passen a
  aquesta navegació i desapareixen del contingut central.
- Integrades les rutes autenticades de previsualització i resultats dins la
  mateixa carcassa de l'espai del centre, amb capçalera, navegació persistent,
  peu de pàgina i paleta blava compatible amb els temes clar i fosc.
- Traslladat el control de plegat a la part superior de la barra lateral amb
  una icona compacta inspirada en Codex. La barra queda fixa sota la capçalera
  i només es desplaça verticalment el contingut principal.
- Aplicat el tema desat abans del primer pintat per evitar el flaix blanc en
  navegar entre pantalles amb el mode fosc.
- Situat el peu de pàgina al final del flux de totes les vistes de l'espai del
  centre: queda al peu en continguts curts i després del contingut en pàgines
  llargues.
- Aplicat l'estat plegat o desplegat de la barra lateral abans del primer
  pintat per evitar que canviï d'amplada durant la navegació entre rutes.
- Reordenada la navegació de l'espai del centre perquè mostri primer `Fitxa`,
  després `Configuració` i finalment `Qüestionari`.
- Refactoritzat el sistema visual sense canvis funcionals: la portada i les
  rutes autenticades comparteixen capçalera, logotip i carcassa; els estils
  globals s'han separat en tokens, shell, portada, qüestionari i workspace.
- Unificada la paleta de Tailwind amb variables semàntiques compatibles amb els
  temes clar i fosc, i eliminats els overrides de classes basats en
  `.workspace-integrated`.
- Reduïda la capçalera interna de `/crear` perquè el contingut funcional
  comenci just sota el header i es mantingui l'estat de les tres vistes.
- Integrada l'administració en la mateixa carcassa visual de l'aplicació, amb
  capçalera compartida, menú lateral plegable identificat com a
  `Administració`, navegació inferior mòbil, tema clar o fosc i peu de pàgina,
  sense alterar permisos, formularis ni accions existents.
- Redissenyat l'enllaç públic del qüestionari amb la capçalera mínima de
  `Diagnosi IA`, selector de tema i el mateix sistema visual de preguntes i
  respostes; aquesta ruta no mostra menú lateral ni peu de pàgina. A cada
  pregunta, el descriptor anterior als dos punts es mostra en petit i
  l'enunciat principal apareix a sota amb més jerarquia. La marca de la
  capçalera obre la portada en una pestanya nova per no interrompre el
  qüestionari en curs.

## [0.3.0] - 2026-07-17

### Added

- Centres identificats amb fitxa territorial sincronitzable des de Dades
  Obertes i una font versionada de serveis educatius.
- Registre separat del correu i el nom visible dels comptes responsables.
- Nom del centre a les pàgines, comunicats i informes específics del centre.
- Alta guiada per confirmar la fitxa i configurar els dominis docents.
- Política per centre que admet `@xtec.cat`, un domini propi exacte de Google
  Workspace o tots dos.

### Changed

- Un únic espai de diagnosi per centre, amb espais de prova conservats per als
  administradors.
- La fitxa del centre queda plegada en un botó de la barra de sessió quan
  l'espai ja té un qüestionari creat.
- Els administradors que creen un espai de prova disposen també de fitxa i
  intent de consulta a Dades Obertes.
- Política de privacitat actualitzada per identificar el centre sense
  identificar el professorat participant.
- L'accés docent passa a Google OAuth amb el domini configurat pel centre i es
  torna a validar abans de desar cada resposta, sense persistir el correu.
- El botó de la fitxa es diu `Fitxa` i s'afegeix `Correu` per modificar la
  configuració.
- La fitxa i la configuració de correu comencen plegades a la pantalla de
  gestió, també abans de crear el qüestionari.

### Removed

- Centres, espais i respostes locals anteriors a la nova alta de la versió
  0.3.0.

## [0.2.1] - 2026-07-16

### Changed

- Aclarida la jerarquia visual de la introducció del qüestionari perquè només
  l'acció principal tingui aparença de botó.

## [0.2.0] - 2026-07-16

### Changed

- Unificades la portada i la selecció de rol en una única pantalla inicial.
- Afegits a la portada controls accessibles per consultar les garanties de
  privacitat i la informació de versió, estat beta, llicència i repositori.
- Adoptada la llicència Apache 2.0.
- Els panells informatius de la portada es tanquen en clicar fora.

## [0.1.0] - 2026-07-16

### Added

- Flux de treball amb branques, Pull Requests i Conventional Commits.
- Validació automàtica de lint, tipus, proves i build.
- Política de versions i releases.
- Plantilla de Pull Request amb controls de privacitat.

### Changed

- Documentació alineada amb l'arquitectura activa de MySQL.

### Removed

- Artefactes i proves de la infraestructura històrica que ja no forma part de
  l'aplicació.

[Unreleased]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rbarrachina/diagnosi-ia/releases/tag/v0.1.0
