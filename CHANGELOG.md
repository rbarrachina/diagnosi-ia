# Registre de canvis

Els canvis destacables d'aquest projecte es documenten en aquest fitxer.
El format segueix Keep a Changelog i les versions de l'aplicació segueixen
Semantic Versioning.

## [Unreleased]

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

[Unreleased]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rbarrachina/diagnosi-ia/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rbarrachina/diagnosi-ia/releases/tag/v0.1.0
