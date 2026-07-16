# Contribuir a Diagnosi IA

## Principis

Qualsevol canvi ha de preservar l'anonimat definit a `AGENTS.md` i als cinc
documents normatius. Si el codi i la documentació entren en conflicte, cal
aturar el canvi funcional i proposar primer una actualització explícita.

## Flux de treball

1. Actualitza `main`.
2. Crea una branca curta:
   - `feat/nom-curt`
   - `fix/nom-curt`
   - `docs/nom-curt`
   - `chore/nom-curt`
   - `codex/nom-curt` per a canvis preparats amb Codex.
3. Fes canvis petits i revisables.
4. Executa totes les comprovacions.
5. Actualitza documentació i `CHANGELOG.md` quan canviï el comportament.
6. Obre una Pull Request i completa la checklist.
7. Fusiona amb squash quan la CI i la revisió siguin correctes.

No es fan commits directes a `main`.

## Commits

Fem servir Conventional Commits:

- `feat: afegeix ...`
- `fix: corregeix ...`
- `docs: documenta ...`
- `test: cobreix ...`
- `refactor: reorganitza ...`
- `chore: manté ...`
- `ci: configura ...`

El missatge ha de descriure un únic canvi i usar l'imperatiu.

## Comprovacions

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Abans de commitejar també cal:

- revisar el diff complet;
- comprovar que no hi hagi secrets;
- confirmar que no s'introdueixen dades identificatives;
- confirmar que els resultats continuen sent agregats;
- confirmar que cap endpoint retorna files individuals.

## Pull Requests

La PR ha d'explicar què canvia, per què, l'impacte per a l'usuari, les proves
executades, les migracions necessàries i l'impacte de privacitat.

Canvis de base de dades han d'incloure una migració versionada, una estratègia
de reversió i proves. No s'ha d'usar `db:push` en entorns compartits.

## Configuració recomanada de `main`

A GitHub, activa:

- requerir una Pull Request abans de fusionar;
- requerir la comprovació `quality`;
- requerir que la branca estigui actualitzada;
- bloquejar force pushes i eliminació;
- exigir com a mínim una aprovació quan hi hagi més d'una persona mantenidora;
- permetre squash merge com a estratègia principal.
