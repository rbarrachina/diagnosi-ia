# Avisos de tercers

Diagnosi IA conserva Apache 2.0 a `LICENSE`. Els components de tercers
conserven les llicències pròpies. El peu compartit enllaça
`/THIRD_PARTY_NOTICES.txt`, amb etiqueta en català, castellà, euskera, gallec i
aranès. El fitxer conserva els textos originals sense traduir-los.

## Generació i abast

`npm run build` neteja l'inventari anterior, compila amb webpack i executa
`npm run notices:generate`. El plugin de `next.config.ts` registra els recursos
dels mòduls presents als chunks de producció, inclosos els mòduls concatenats,
separant navegador i servidor. El generador incorpora també els paquets de les
traces `.nft.json` i els components identificats als source maps dels runtimes
precompilats de Next.js. Les traces són conservadores: poden incorporar codi
opcional, variants experimentals i biblioteques natives no executades per cap
ruta actual. No es presenta aquest inventari com una mesura de codi executat.

Es conserva cada fitxer LICENSE, COPYING, NOTICE i LEGAL aplicable del paquet,
incloses atribucions de subcomponents. Els subpaquets amb `package.json` propi
es tracten com a components separats. No es dedueix un copyright a partir del
camp `author` ni s'intercanvien llicències amb el mateix identificador.
Al fitxer públic només es normalitzen els finals de línia i els espais finals;
les còpies complementàries es conserven íntegres i es comproven amb SHA-256.

React i React DOM declarats al projecte i les còpies incorporades per Next.js
s'identifiquen separadament. Les còpies estables incorporades a Next.js 16.3.6
són `19.3.0-canary-cbb046ab-20260731`; les versions s'extreuen dels fitxers
de producció, dels peer dependencies incorporats per React Server DOM i de la
dependència incorporada de Scheduler. Per a altres còpies precompilades que no
publiquen versió upstream, es declara explícitament la versió del contenidor
Next.js. No s'hi assigna la versió del paquet homònim al lockfile.

Els textos omesos al paquet npm però disponibles a la font original es
conserven a `scripts/licenses/`, amb versió, procedència i SHA-256 a
`sources.json`. Per als paquets React PDF s'ha utilitzat el commit `gitHead`
publicat al registre npm de cada versió. Drizzle i Yoga usen les etiquetes de
la versió publicada; `@edge-runtime/cookies` usa l'etiqueta pròpia del paquet.
`@next/env` comparteix repositori, versió i llicència amb el paquet Next.js
instal·lat. `data-uri-to-buffer` inclou el text complet al README instal·lat.
La generació no requereix xarxa ni cap dependència nova. Un canvi de versió o
de hash d'un text complementari exigeix revisió explícita.

La revisió dels recursos del repositori no ha trobat fonts web, imatges
externes, plantilles ni fitxers multimèdia distribuïts a `public/`. La marca i
les icones existents són SVG/JSX al codi; no s'ha verificat documentalment la
procedència històrica de totes les icones, inclosa la marca GitHub del peu.
Els informes usen Helvetica estàndard de PDF, sense registrar fonts externes.
Les dades de centres i serveis educatius es consulten des del servidor i
conserven les atribucions existents a la fitxa i a `docs/ARCHITECTURE.md`; aquest
inventari de programari no és una auditoria de drets dels datasets externs.

## Comprovació obligatòria de publicació

Després d'una compilació amb totes les dependències de la plataforma de destí:

```bash
npm run notices:check
```

Aquesta comprovació compara el fitxer amb l'inventari de la compilació i falla
si queda algun text complet pendent. Una llicència absent d'un component del
navegador fa fallar també la generació. Per a un component només de servidor,
es permet generar la previsualització amb l'avís explícit al principi del
fitxer, però la comprovació de publicació falla. La CI executa aquesta
comprovació després del build, de manera que els pendents bloquegen la
integració. No s'ha d'ometre la comprovació per preparar una release.

El resultat depèn de la plataforma: les traces macOS i Linux poden incloure
binaris diferents. La versió que es publica ha de generar i validar els avisos
amb la mateixa instal·lació i compilació que es distribueix. Cal incloure
`public/THIRD_PARTY_NOTICES.txt` al paquet de desplegament; un empaquetat
standalone ha de copiar `public/` explícitament.

## Pendents que bloquegen una publicació completa

La revisió actual cobreix els textos dels components empaquetats al navegador,
però no acredita compliment complet dels components del servidor. La
compilació local macOS detecta aquests textos pendents:

- `@img/sharp-libvips-darwin-arm64` 1.3.3: inclou un binari libvips amb múltiples
  biblioteques; el README enumera les llicències però no n'aporta els textos
  complets ni tots els copyrights. Cal revisar les fonts i avisos de totes les
  biblioteques del binari de la plataforma de destí i les obligacions LGPL.
- `abs-svg-path` 0.1.1, `brotli` 1.3.3, `dfa` 1.2.0, `fontkit` 2.0.4,
  `hsl-to-hex` 1.0.0, `hsl-to-rgb-for-reals` 1.1.1 i `media-engine` 1.0.3:
  no s'ha localitzat text complet a la distribució ni a la font de la versió
  consultada. A més, Brotli conté capçaleres originals Apache 2.0 de Google que
  s'han de conservar juntament amb qualsevol llicència aplicable al port.
  `hsl-to-hex` declara MIT al manifest i ISC al README: no es resol aquest
  conflicte per intuïció.
- `client-only` 0.0.1 i `server-only` 0.0.1: els marcadors declaren MIT però
  no distribueixen el text complet ni un copyright original verificat.
- `string-hash` incorporat a Next.js 16.3.6: declara CC0-1.0 però no aporta el
  text complet al paquet precompilat ni publica la versió upstream exacta.

La generació enumera els pendents reals de cada compilació; aquesta llista
documentada no substitueix la comprovació. Cal obtenir els textos originals
verificables dels publicadors o revisar/substituir els components abans de
donar per acabada una publicació amb tot aquest codi. No s'inventen copyrights
ni s'afegeix un text MIT genèric per fer passar el control.
