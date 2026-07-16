# Revisió de seguretat i privacitat

Data de revisió: 2026-07-16.

## Abast

- Rutes públiques i privades.
- Validació estricta de payloads.
- Autenticació, sessions i autorització.
- Client i repositoris MySQL server-only.
- Tokens privats.
- Submissions transaccionals.
- Resultats agregats i PDF.
- Administració.
- Secrets i logs.

## Resultat

- No hi ha endpoints que retornin files individuals de `submissions` o
  `answers`.
- El navegador no importa el client MySQL.
- Les submissions i answers s'insereixen dins una transacció.
- Els resultats consulten recomptes agrupats i no combinacions individuals.
- El PDF revalida la propietat o el token i reutilitza el model agregat.
- Els tokens es validen amb HMAC i no s'inclouen en query strings o logs.
- Les dades dels administradors estan separades de les respostes.
- No s'han afegit noms o codis de centre, dades de participants, IPs o
  informació de dispositiu.

## Controls que s'han de repetir a cada PR

- Executar lint, type check, proves i build.
- Revisar el diff complet.
- Cercar secrets i variables públiques indegudes.
- Confirmar que cap endpoint retorna dades individuals.
- Confirmar que cap canvi permet reconstruir respostes personals.
- Revisar qualsevol nova dada, filtre, exportació o log.

## Pendents

- Rate limiting sense persistir identificadors prohibits.
- Política de retenció i còpies de seguretat.
- Revisió legal o DPO.
