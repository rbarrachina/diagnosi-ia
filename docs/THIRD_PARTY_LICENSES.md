# Avisos de tercers

Diagnosi IA conserva Apache 2.0 a `LICENSE`. Els components de tercers
conserven les llicències pròpies. El peu compartit enllaça
`/THIRD_PARTY_NOTICES.txt`, amb etiqueta en català, castellà, euskera, gallec i
aranès. El fitxer conserva els textos originals sense traduir-los.

## Generació i abast

`npm run build` neteja l'inventari anterior, compila amb webpack i executa
`npm run notices:generate`. El plugin de `next.config.ts` només s'executa en
producció i registra els recursos
dels mòduls presents als chunks de producció, inclosos els mòduls concatenats,
separant navegador i servidor. La distribució prevista és un servei web: els
usuaris reben JavaScript, CSS i recursos, sense un paquet executable de servidor.
El fitxer públic inclou els components del navegador, els polyfills copiats per
Next.js, el runtime generat per webpack, el CSS de Tailwind/Preflight i la icona
GitHub. No incorpora paquets només perquè apareguin en una traça del servidor.

`npm run notices:audit:server` genera un inventari ampliat separat a
`.next/third-party/SERVER_NOTICES.txt`, incorporant les traces `.nft.json` i els
source maps dels runtimes precompilats de Next.js. Aquestes traces són
conservadores i poden incorporar variants o biblioteques natives no executades.
`npm run notices:check:server` bloqueja la distribució d'aquest codi si hi falten
textos. No és la comprovació de publicació del servei web.

`npm run dev` selecciona Turbopack explícitament per evitar el conflicte de
Next.js amb la configuració webpack de producció.

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

El chunk `polyfills-*.js` s'emet com a còpia fora del graf de mòduls. La font
`@next/polyfill-nomodule` de Next.js 16.3.6 fixa core-js 3.38.1, whatwg-fetch
3.0.0 i object-assign 4.1.1. `scripts/licenses/bundled.json` conserva aquestes
versions, la procedència i els hashes dels textos i del bundle revisat. La
generació exigeix que el chunk emès sigui idèntic al bundle instal·lat i que
aquest coincideixi amb el hash revisat. Qualsevol canvi de Next.js o d'aquest
chunk exigeix una revisió dels components, encara que el lockfile no els
enumeri. Les fonts de la compilació es conserven a `scripts/licenses/polyfills/`.

Els textos omesos al paquet npm però disponibles a la font original es
conserven a `scripts/licenses/`, amb versió, procedència i SHA-256 a
`sources.json`. Per als paquets React PDF s'ha utilitzat el commit `gitHead`
publicat al registre npm de cada versió. Drizzle i Yoga usen les etiquetes de
la versió publicada; `@edge-runtime/cookies` usa l'etiqueta pròpia del paquet.
`@next/env` comparteix repositori, versió i llicència amb el paquet Next.js
instal·lat. `data-uri-to-buffer` inclou el text complet al README instal·lat.
La generació no requereix xarxa ni cap dependència nova. Un canvi de versió o
de hash d'un text complementari exigeix revisió explícita.

La revisió dels recursos no ha trobat fonts web, imatges externes, plantilles ni
fitxers multimèdia a `public/`. La marca i la icona d'accessibilitat són formes
SVG geomètriques al codi del projecte; la seva procedència històrica externa no
està documentada. La icona GitHub anterior tampoc tenia procedència acreditada:
s'ha substituït per l'SVG original de Bootstrap Icons 1.13.1, conservat a
`scripts/licenses/bootstrap-icons/` amb el copyright i el text MIT original.
`scripts/licenses/resources.json` fixa els recursos revisats i els seus hashes.
Cal revisar aquest manifest quan s'afegeixin recursos externs; el generador no
pot inferir-ne automàticament la procedència.

Tailwind CSS 3.4.19 distribueix Preflight al CSS generat. El commit original
`154d99054bffdf42473f8873148a7cdc30b5c2a9` documenta la integració de
modern-normalize 1.1.0 i la derivació anterior de SUIT CSS Base. Es conserven
separadament els textos originals de Tailwind Labs, Nicolas Gallagher, Jonathan
Neal i Sindre Sorhus. La revisió exacta original de SUIT CSS Base no consta en
la font de Tailwind: s'identifica l'artefacte que incorpora aquesta adaptació,
sense afirmar que s'ha distribuït la versió 1.0.0 consultada per obtenir el text.
Els hashes de Preflight i la versió de Tailwind exigeixen revisió si canvien.
El runtime de webpack, generat fora de `module.resource`, conserva també el
copyright de JS Foundation i el seu text MIT del paquet incorporat a Next.js;
la versió 5.98.0 s'extreu de l'API del mateix bundle.

Els informes usen Helvetica estàndard de PDF, sense registrar fonts externes.
La comprovació dels PDF generats verifica que no incorporen fitxers de font.
Les dades de centres i serveis educatius es consulten des del servidor i
conserven les atribucions existents a la fitxa i a `docs/ARCHITECTURE.md`; aquest
inventari de programari no és una auditoria de drets dels datasets externs.

## Comprovació obligatòria de publicació

Després d'una compilació amb totes les dependències de la plataforma de destí:

```bash
npm run notices:check
```

Aquesta comprovació compara el fitxer amb la compilació de producció i falla
si falta un text del navegador, si el fitxer públic és desactualitzat o si han
canviat les versions o els recursos fixats per una revisió. La CI l'executa
després del build. Cal incloure `public/THIRD_PARTY_NOTICES.txt` al desplegament;
un empaquetat standalone ha de copiar `public/` explícitament.

Abans de distribuir una imatge Docker o un paquet de servidor, cal resoldre els
pendents següents i executar `npm run notices:audit:server` i
`npm run notices:check:server` sobre la plataforma de destí. Els binaris de les
traces difereixen entre macOS i Linux. Aquesta implementació no acredita el
compliment complet d'aquesta distribució futura ni substitueix una auditoria
jurídica o la revisió dels recursos nous.

## Pendents de la distribució de servidor

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

L'auditoria ampliada enumera els pendents reals de cada compilació; aquesta llista
documentada no substitueix la comprovació. Cal obtenir els textos originals
verificables dels publicadors o revisar/substituir els components abans de
donar per acabada una publicació amb tot aquest codi. No s'inventen copyrights
ni s'afegeix un text MIT genèric per fer passar el control.
