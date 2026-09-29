# Revisió de permisos entre comptes — 2026-09-29

## Abast i conclusió

Revisió del codi i proves automatitzades locals amb comptes ficticis. No s'han
utilitzat cookies, comptes OAuth ni dades reals de producció. No s'ha detectat
un accés entre comptes en els camins revisats. Aquest resultat no equival a una
prova completa amb dos comptes Google contra el desplegament real.

## Controls revisats

- Les pàgines de resultats i previsualització del centre obtenen l'usuari de
  la sessió responsable i comproven conjuntament propietari i codi d'espai.
- El PDF de centre deriva el propietari de la sessió; rebutja identificadors
  addicionals al payload i no genera el PDF quan el repositori denega l'accés.
- La consulta i llistat docents filtren per l'identificador pseudònim de la
  sessió. La lectura detallada aplica el mateix filtre al resum i les respostes.
- El PDF docent només admet un `publicCode`; no accepta propietaris ni
  identificadors d'enviament aportats pel client. Una participació absent
  per a aquella sessió retorna 404 abans de generar el PDF.
- Les cookies signades de docent i responsable es validen separadament.
  Una cookie d'un altre rol o una identitat modificada sense signatura vàlida
  no dona accés. Amb dues sessions obertes, el PDF docent usa la docent.
- La regeneració del token privat aplica propietari i codi a l'UPDATE i
  exigeix una única fila afectada. El reinici valida i bloqueja l'espai del
  propietari abans de qualsevol eliminació; si falla, fa rollback.
- Les rutes administratives exigeixen administració activa i treballen amb
  agregats. Aquest rol permet consultar centres diferents segons el producte,
  però no concedeix accés als resultats individuals dels docents.
- L'enllaç compartit és una autorització per token: una persona amb el token
  vàlid pot consultar els agregats corresponents sense ser propietària.
  Conèixer només el codi públic no concedeix aquest accés.

## Evidència automatitzada i límits

`tests/account-isolation-routes.test.ts` executa els Route Handlers de PDF amb
la validació real de cookies i les sessions reals. Substitueix els repositoris,
la política d'accés del portal i els renderitzadors de PDF per dobles de prova.
Comprova permisos i propagació de la identitat, no l'OAuth ni una base real.

Les proves de repositori de resultats, participants i espais comproven els
predicats SQL i els paràmetres de propietat amb MySQL simulat, i el rebuig abans
de llegir agregats, generar enllaços o eliminar respostes. No comproven
l'execució d'aquest SQL en un servidor MySQL real.

## Comprovació manual complementària

Fer-la amb espais i participacions de prova, dues sessions Google separades
i mode OAuth; el mode local configura una identitat fixa i no és adequat per
demostrar l'aïllament entre dos comptes.

1. El compte responsable A crea l'espai A i B crea l'espai B.
2. Amb B, obrir les URL de resultats i previsualització de l'espai A: no han
   de mostrar contingut ni l'enllaç privat d'A.
3. Dos docents responen al mateix qüestionari amb opcions diferents: cadascun
   ha de veure només les seves opcions al resultat i al PDF propis.
4. Un docent sense participació obre una URL de resultat coneguda: no ha de
   rebre resultats ni PDF d'una altra persona.
5. Una sessió només responsable no pot substituir una sessió docent per
   descarregar resultats individuals. Tancar la sessió retira aquest accés.

No provar reinicis ni rotacions de tokens d'espais reals: les negatives
automatitzades utilitzen exclusivament dobles de prova.
