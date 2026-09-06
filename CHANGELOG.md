# Registre de canvis

Els canvis destacables d'aquest projecte es documenten en aquest fitxer.
El format segueix Keep a Changelog i les versions de l'aplicació segueixen
Semantic Versioning.

## [Unreleased]

### Changed

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
