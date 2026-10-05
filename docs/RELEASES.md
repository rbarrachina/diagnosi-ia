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

La disposició adaptable de quatre dimensions per fila i la capçalera ampla al resultat docent
s'inclou a `Unreleased`; és un canvi visual sense migracions ni configuració nova.
També s'elimina el botó de retorn duplicat: la llista de diagnosis s'obre des
del menú docent.
La caixa global de CD docent en IA usa la mitjana de dimensions amb pes igual,
només per al docent propietari, sense migracions ni noves dades persistides.
La caixa arrodonida queda centrada respecte del títol i subtítol, amb el PDF a dalt.
El fons de la gràfica per dimensió guanya intensitat per igualar la distribució docent.
Les gràfiques de percentatge mostren els noms complets de les dimensions i els ajusten en diverses línies.
Els noms complets apareixen sota les barres en línies curtes, amb més espai
horitzontal per evitar superposicions i sense entrar a la zona del gràfic.
També queden una mica més avall, amb separació respecte de l'eix.
El clic a una barra selecciona la dimensió correcta fins i tot si una altra val zero.
El títol ampliat encapçala el resultat, amb el PDF després de la caixa CD i només
la data a sota; la versió s'oculta al resultat web docent.

1. Confirmar que `main` està neta i actualitzada.
2. Moure els canvis d'`Unreleased` a una secció amb versió i data.
3. Actualitzar `package.json` i `package-lock.json` amb la mateixa versió.
4. Executar lint, type check, proves i build. El build regenera
   `public/THIRD_PARTY_NOTICES.txt`; revisar i incorporar el resultat al commit.
   Executar `npm run notices:check` amb la mateixa instal·lació i plataforma
   de destí. Si falten textos originals del navegador, la release queda bloquejada.
   Abans de distribuir binaris del servidor, executar també l'auditoria i la
   comprovació `notices:check:server`, que mantenen pendents explícits. Vegeu
   `THIRD_PARTY_LICENSES.md` per a l'abast i els pendents actuals.
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

La correcció pendent de redireccions internes s'inclou a `Unreleased`.
Després de desplegar-la, una petició POST a
`/auth/logout?next=%2F%5Cexample.invalid`, amb `Origin` del mateix domini,
ha de retornar `303` cap a la
portada del mateix domini. Els fluxos OAuth iniciats abans del desplegament
amb una destinació insegura tornen a l'error d'accés i s'han de reiniciar.
La correcció no exigeix migracions ni rotació de claus o sessions existents.

## Desplegament d'actualitzacions de dependències

L'actualització de dependències de seguretat no canvia l'esquema de MySQL ni
la configuració d'Apache. En desplegar-la, cal executar `npm ci` després de
`git pull`, després `npm run build` i finalment reiniciar `diagnosia` amb
systemd. No executar `npm audit fix --force` al servidor: les versions revisades
queden fixades a `package-lock.json`. Les eines de desenvolupament tenen avisos
separats de l'auditoria `--omit=dev` i requereixen una revisió pròpia.

## Desplegament de la protecció de memòria cau

La protecció de resultats, PDF i respostes amb enllaços privats s'inclou a
`Unreleased`. No exigeix migracions, variables noves ni canvis d'Apache.
Després de compilar i reiniciar el servei de Diagnosia, comprovar a la pestanya
Network del navegador que aquestes respostes porten
`Cache-Control: private, no-store, max-age=0`, tant en cas d'èxit com d'error.
Comprovar que els PDF continuen descarregant-se i que els permisos entre comptes
es mantenen. Per a proves POST amb curl, incloure l'`Origin` exacte de l'aplicació.
No cal enviar dades ni tokens reals per verificar les respostes d'error.

Aquesta política impedeix l'emmagatzematge en memòries cau HTTP conformes,
però no elimina PDF descarregats expressament ni còpies anteriors, historial
o estat React de pestanyes obertes.

## Desplegament de la validació d'origen

La protecció CSRF s'inclou a `Unreleased`. No exigeix migracions ni dependències.
L'URL pública de producció `NEXT_PUBLIC_APP_URL` ha de correspondre a l'origen
HTTPS de Diagnosia perquè la comprovació funcioni també darrere d'Apache.
No afegir dominis externs ni altres subdominis com a excepció.

Abans de desplegar, provar en local que una petició POST a `/auth/logout` amb
`Origin` d'una altra web retorna 403 i una amb l'origen local correcte retorna
303. Usar `http://localhost:3000` per a la prova local i no barrejar noms
o ports d'accés. La mateixa negativa s'ha de mantenir quan manca `Origin` i no hi ha un
`Referer` vàlid. Les comprovacions no necessiten cookies ni dades reals.
Comprovar després login amb Google, logout, idioma, enviaments i PDF, i una
acció administrativa sobre dades de prova.

Els clients de terminal que facin mutacions han d'incloure `Origin` amb
l'origen exacte de l'aplicació. Això acredita l'origen, no substitueix la
sessió, el rol ni els tokens d'autorització. Els navegadors el transmeten en
les peticions habituals del mateix origen. La protecció no requereix desar
un token CSRF o dades noves a cookies, logs o MySQL.

## Desplegament de la CSP

La CSP amb nonce s'inclou a `Unreleased` i substitueix el mode d'observació.
No exigeix migracions, variables noves ni canvis d'Apache. Només afecta aquesta
aplicació. Cal compilar i reiniciar el servei habitual de Diagnosia.

Abans d'integrar-la, provar la compilació amb `npm run build` i `npm start`:

- La resposta HTML ha de portar `Content-Security-Policy`, sense la variant
  `Report-Only`, i un nonce diferent en dues recàrregues.
- Els scripts de l'HTML han de portar el nonce de la mateixa resposta. En
  producció `script-src` no ha de contenir `unsafe-inline` ni `unsafe-eval`.
- Comprovar portada, diàleg d'accés, canvi d'idioma i tema, OAuth de responsable
  i docent, qüestionari, enviament, navegació entre pantalles, resultats i PDF.
  Incloure el resultat compartit per fragment i els resultats d'administració.
- Revisar la consola del navegador: cap recurs necessari ha de quedar
  bloquejat per CSP. Una prova local amb un script inline sense nonce ha de
  confirmar que el navegador el bloqueja.

Les pàgines continuen sent dinàmiques. No habilitar memòria cau compartida
d'HTML, generació estàtica ni Partial Prerendering sense redissenyar la CSP.
Conservar l'HSTS del VirtualHost HTTPS, que té una funció independent.
