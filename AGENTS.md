# AGENTS.md

## Objectiu del projecte

Aquest repositori conté una aplicació de diagnosi anònima sobre l'ús educatiu de la intel·ligència artificial.

L'aplicació treballa amb centres identificats i espais de diagnosi associats. La
prioritat tècnica principal és preservar l'anonimat del professorat participant
i evitar que la identificació del centre o del responsable es barregi amb les
respostes.

Els creadors d'espais s'autentiquen amb Google OAuth, limitat a comptes
`@xtec.cat`, només per crear i gestionar els espais propis. El professorat
s'autentica amb Google i el centre pot admetre `@xtec.cat`, un domini propi
exacte de Google Workspace o tots dos. En desenvolupament es pot usar el mode
local controlat per variables d'entorn.

## Regles de privacitat

- Es poden desar el codi, nom oficial, municipi, àrea territorial i servei
  educatiu del centre, separats de les respostes.
- Es poden desar el correu i el nom visible del compte Google responsable,
  separats de les respostes.
- El nom oficial del centre es pot mostrar a les pàgines, correus i informes
  vinculats exclusivament al seu espai.
- No recollir noms, cognoms, correus electrònics, identificadors personals, IPs ni informació del dispositiu del professorat participant.
- No crear comptes d'usuari per al professorat participant.
- No desar el correu del professorat: només es pot usar transitòriament per
  validar el domini i derivar el bloqueig HMAC contra repeticions.
- Els comptes OAuth de responsables només poden servir per propietat i gestio
  del centre i dels seus espais; no s'han de barrejar amb respostes individuals.
- No afegir respostes obertes.
- No mostrar ni exportar respostes individuals.
- No crear endpoints que retornin files individuals de `submissions` o `answers`.
- No permetre reconstruir el conjunt complet de respostes d'una mateixa persona des del tauler o el PDF.
- No donar accés directe del navegador a `diagnostic_spaces`, `submissions` ni `answers`.
- No incloure tokens privats en logs, URLs amb query string, PDFs o respostes d'error.
- Si cal recuperar un token compartit per al creador, s'ha de guardar xifrat amb una clau server-side i també com HMAC per validacio; mai en text pla.
- Tots els resultats s'han de presentar sempre en conjunt.
- No afegir filtres que puguin facilitar la identificacio indirecta de persones.
- Un centre només pot tenir un espai. Els administradors amb correu no
  corresponent a un centre poden mantenir un espai de prova amb una fitxa
  institucional basada en el seu compte Google. En mode `all_xtec`, qualsevol
  compte XTEC autoritzat com a responsable pot tenir aquesta mateixa fitxa de
  prova. En mode `centre_xtec`, l'excepció es limita als administradors actius.
  Les dades d'aquests responsables no s'han de relacionar amb les respostes.
- La consulta a Dades Obertes es fa per a tots els responsables autoritzats que
  accedeixen a crear un espai. Sempre es fa des del servidor.

## Arquitectura

- Next.js App Router.
- TypeScript en mode estricte.
- Tailwind CSS per a la UI.
- MySQL 8.4.
- Drizzle ORM amb `mysql2`.
- Route Handlers o server functions per a totes les operacions sensibles.
- El client MySQL i `DATABASE_URL` només poden existir en codi server-side.
- No es pot donar accés directe del navegador a cap taula de MySQL.
- Validacio d'entrada al servidor amb esquemes estrictes.
- Transaccions de base de dades per crear enviaments i respostes.

## Qüestionari

- El qüestionari és fix i versionat.
- La versió inicial és `2026.1`; la versió activa corregida és `2026.2`.
- Té 20 preguntes, 5 blocs i 4 opcions de resposta.
- Els valors vàlids són `0`, `1`, `2` i `3`.
- No editar preguntes d'una versió que ja tingui respostes.

## Documents normatius

Abans de modificar codi, comprova aquests documents:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/IMPLEMENTATION_PLAN.md`

Si hi ha conflicte entre codi i documentació, atura't i proposa una actualització explícita. No resolguis conflictes de privacitat per intuicio.

## Qualitat

Abans de considerar una tasca finalitzada:

- Executar el lint.
- Executar les proves.
- Executar el type check.
- Executar el build.
- Revisar el diff.
- Comprovar que no s'han exposat secrets.
- Comprovar que no s'han introduit dades identificatives.
- Comprovar que les dades identificatives noves pertanyen exclusivament al
  centre o al responsable i no es poden relacionar amb una resposta individual.

Quan el projecte estigui implementat, les comandes previstes són:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Criteris de revisió

En cada canvi comprova:

- Les dades noves són estrictament necessaries?
- Les dades del centre o responsable estan separades de les respostes?
- Poden identificar directament o indirectament un docent participant?
- El navegador pot accedir a dades que haurien de quedar només en format de conjunt?
- Hi ha validació equivalent al servidor?
- Els resultats retornen només dades de conjunt?
- Algun endpoint retorna files individuals de `submissions` o `answers`?
- Els informes PDF repeteixen la validació del token?
- Els tests cobreixen codis, tokens, validació de respostes i càlculs de conjunt?

## Forma de treballar

- Fer canvis petits i revisables.
- No afegir dependències de producció sense justificar-les.
- Actualitzar la documentació quan canviï el comportament.
- Explicar els riscos o decisions pendents.
- Prioritzar una solució senzilla i segura.
- Treballar en una branca curta i integrar els canvis mitjançant Pull Request.
- Seguir els tipus de Conventional Commits (`feat`, `fix`, `docs`, `test`,
  `refactor`, `chore`, `ci`).
- Mantenir `CHANGELOG.md` i la documentació de versions quan hi hagi canvis
  visibles o una nova versió.
