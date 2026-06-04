# AGENTS.md

## Objectiu del projecte

Aquest repositori conte una aplicacio de diagnosi anonima sobre l'us educatiu de la intel.ligencia artificial.

L'aplicacio treballa amb espais de diagnosi anonims, no amb centres identificats. La prioritat tecnica principal es preservar l'anonimat i evitar que la implementacio introdueixi identificadors directes o indirectes.

## Regles de privacitat

- No crear cap taula anomenada `centres`.
- No afegir mai camps per desar el nom del centre.
- No desar ni mostrar el nom del centre.
- No recollir noms, cognoms, correus electronics, identificadors personals, IPs ni informacio del dispositiu.
- No crear comptes d'usuari.
- No afegir respostes obertes.
- No mostrar ni exportar respostes individuals.
- No crear endpoints que retornin files individuals de `submissions` o `answers`.
- No permetre reconstruir el conjunt complet de respostes d'una mateixa persona des del tauler o el PDF.
- No donar acces directe del navegador a `diagnostic_spaces`, `submissions` ni `answers`.
- No incloure tokens privats en logs, URLs amb query string, PDFs o respostes d'error.
- Tots els resultats han de ser agregats.
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
- No hi ha d'haver politiques publiques de lectura sobre respostes.
- No hi ha d'haver politiques publiques de lectura sobre `diagnostic_spaces`, `submissions` ni `answers`.
- Validacio d'entrada al servidor amb esquemes estrictes.
- Transaccions de base de dades per crear enviaments i respostes.

## Questionari

- El questionari es fix i versionat.
- La versio inicial es `2026.1`.
- Te 20 preguntes, 5 blocs i 3 opcions de resposta.
- Els valors valids son `0`, `1` i `2`.
- No editar preguntes d'una versio que ja tingui respostes.

## Documents normatius

Abans de modificar codi, comprova aquests documents:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/IMPLEMENTATION_PLAN.md`

Si hi ha conflicte entre codi i documentacio, atura't i proposa una actualitzacio explicita. No resolguis conflictes de privacitat per intuicio.

## Qualitat

Abans de considerar una tasca finalitzada:

- Executar el lint.
- Executar les proves.
- Executar el type check.
- Executar el build.
- Revisar el diff.
- Comprovar que no s'han exposat secrets.
- Comprovar que no s'han introduit dades identificatives.

Quan el projecte estigui implementat, les comandes previstes son:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Criteris de revisio

En cada canvi comprova:

- Les dades noves son estrictament necessaries?
- Poden identificar directament o indirectament un centre o una persona?
- El navegador pot accedir a dades que haurien de quedar agregades?
- Hi ha validacio equivalent al servidor?
- Els resultats retornen nomes agregats?
- Algun endpoint retorna files individuals de `submissions` o `answers`?
- Els informes PDF repeteixen la validacio del token?
- Els tests cobreixen codis, tokens, validacio de respostes i agregacions?

## Forma de treballar

- Fer canvis petits i revisables.
- No afegir dependencies de produccio sense justificar-les.
- Actualitzar la documentacio quan canvii el comportament.
- Explicar els riscos o decisions pendents.
- Prioritzar una solucio senzilla i segura.
