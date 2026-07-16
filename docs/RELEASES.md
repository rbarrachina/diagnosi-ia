# Versions i releases

## Dos versionats independents

La versió de l'aplicació usa Semantic Versioning, per exemple `v0.1.0`.
La versió del qüestionari usa el seu propi identificador, per exemple
`2026.2`. Una release de l'aplicació no obliga a crear una nova versió del
qüestionari.

## Semantic Versioning

Mentre l'aplicació sigui anterior a `1.0.0`:

- `0.MINOR.0`: funcionalitat nova o canvi rellevant;
- `0.MINOR.PATCH`: correcció compatible;
- `1.0.0`: primera versió estable aprovada.

Després d'`1.0.0`:

- MAJOR: canvi incompatible;
- MINOR: funcionalitat compatible;
- PATCH: correcció compatible.

## Preparar una release

1. Confirmar que `main` està neta i actualitzada.
2. Moure els canvis d'`Unreleased` a una secció amb versió i data.
3. Actualitzar `package.json` i `package-lock.json` amb la mateixa versió.
4. Executar lint, type check, proves i build.
5. Revisar privacitat, secrets i migracions.
6. Fusionar la PR de release.
7. Crear una etiqueta anotada sobre el commit de `main`:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

8. Crear la GitHub Release amb el resum del `CHANGELOG.md`.

No s'etiqueta una branca de treball. La primera etiqueta prevista és
`v0.1.0`, després de fusionar la PR que estableix aquest flux.

## Hotfix

Una correcció urgent també passa per branca, PR i CI. Després de fusionar-la,
s'incrementa PATCH i es publica una nova etiqueta.
