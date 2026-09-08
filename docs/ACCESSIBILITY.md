# Accessibilitat

## Objectiu de conformitat

La interfície web té com a objectiu complir WCAG 2.2 nivell AA i els requisits
web aplicables d’EN 301 549. Aquest objectiu inclou la portada, el qüestionari
del professorat, l’espai de gestió dels centres i l’administració global.

La conformitat no es pot certificar només amb proves automàtiques. Abans d’una
declaració formal cal completar una revisió manual de totes les rutes i estats,
incloent almenys:

- navegació completa només amb teclat;
- ordre, visibilitat i no-obstrucció del focus;
- lectura amb VoiceOver + Safari i NVDA + Firefox o Chrome;
- zoom al 200 % i redistribució a 320 píxels CSS;
- contrast en els temes clar i fosc;
- errors, validació, càrrega i confirmacions anunciats sense dependre del color;
- revisió dels PDF descarregables si han de formar part de la declaració.

## Garanties implementades

- L’idioma principal del document és català i les pàgines principals tenen un
  títol específic.
- La capçalera compartida ofereix un enllaç per saltar al contingut principal.
- El peu de pàgina enllaça la referència oficial WCAG 2.2 amb una icona, sense
  text visible, i un nom accessible que també informa que s’obre una pestanya
  nova.
- Tots els controls nadius conserven un indicador de focus visible comú.
- Els formularis del qüestionari agrupen cada pregunta amb `fieldset` i
  `legend`; les opcions són controls de ràdio nadius amb etiquetes.
- Cada canvi de bloc del qüestionari mou el focus al títol nou.
- El progrés s’exposa programàticament amb nom, valor mínim, màxim i actual.
- Els errors i els estats de càrrega rellevants s’anuncien com a alertes o
  missatges d’estat.
- Els gràfics de resultats tenen una alternativa textual en taules amb títol i
  capçaleres de columna; els SVG redundants s’oculten a tecnologies d’assistència.
- Els desplegables informatius no utilitzen rols de menú interactiu incorrectes.
- Les animacions i el desplaçament suau es redueixen quan el sistema indica
  `prefers-reduced-motion`.

## Revisió i regressions

Qualsevol canvi de components, contingut o estils ha de conservar el nivell AA.
Les comprovacions automatitzades de lint, tipus i components formen part de la
CI, però no substitueixen les comprovacions manuals anteriors. Cal repetir la
matriu manual abans de cada declaració d’accessibilitat o canvi important de la
interfície.

Si l’aplicació queda dins l’àmbit del Reial decret 1112/2018, també cal publicar
una declaració d’accessibilitat accessible des de totes les pàgines i habilitar
el mecanisme de comunicació corresponent. El contingut i el contacte d’aquesta
declaració depenen de l’organisme titular i no s’han inventat al repositori.
