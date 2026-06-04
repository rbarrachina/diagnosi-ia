# AGENTS.md

## Objectiu del projecte

Aquest repositori conté una aplicació de diagnosi anònima sobre l'ús educatiu de la intel·ligència artificial.

L'aplicació treballa amb espais de diagnosi anònims, no amb centres identificats. La prioritat tècnica principal és preservar l'anonimat i evitar que la implementació introdueixi identificadors directes o indirectes.

## Regles de privacitat

- No crear cap taula anomenada `centres`.
- No afegir mai camps per desar el nom del centre.
- No desar ni mostrar el nom del centre.
- No recollir noms, cognoms, correus electrònics, identificadors personals, IPs ni informació del dispositiu.
- No crear comptes d'usuari.
- No afegir respostes obertes.
- No mostrar ni exportar respostes individuals.
- No crear endpoints que retornin files individuals de `submissions` o `answers`.
- No permetre reconstruir el conjunt complet de respostes d'una mateixa persona des del tauler o el PDF.
- No donar accés directe del navegador a `diagnostic_spaces`, `submissions` ni `answers`.
- No incloure tokens privats en logs, URLs amb query string, PDFs o respostes d'error.
- Tots els resultats s'han de presentar sempre en conjunt.
- No afegir filtres que puguin facilitar la identificacio indirecta de persones.

## Arquitectura

- Next.js App Router.
- TypeScript en mode estricte.
- Tailwind CSS per a la UI.
- PostgreSQL a Supabase.
- Desplegament a Vercel.
- Route Handlers o server functions per a totes les operacions sensibles.
- La clau secreta de Supabase no es pot exposar al navegador.
- Row Level Security activat a les taules exposades.
- No hi ha d'haver polítiques públiques de lectura sobre respostes.
- No hi ha d'haver polítiques públiques de lectura sobre `diagnostic_spaces`, `submissions` ni `answers`.
- Validacio d'entrada al servidor amb esquemes estrictes.
- Transaccions de base de dades per crear enviaments i respostes.

## Qüestionari

- El qüestionari és fix i versionat.
- La versió inicial és `2026.1`; la versió activa corregida és `2026.2`.
- Te 20 preguntes, 5 blocs i 3 opcions de resposta.
- Els valors valids són `0`, `1` i `2`.
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
- Poden identificar directament o indirectament un centre o una persona?
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
