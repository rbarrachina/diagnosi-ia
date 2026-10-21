# Preparació OAuth de producció

Origen definitiu: `https://diagnosia.edigital.cat`.

## Google Auth Platform

Fer els canvis al projecte independent `Diagnosi IA`:

| Camp | Valor |
| --- | --- |
| Nom | Diagnosi IA |
| Correu de suport i contacte | `rbarrach@xtec.cat` |
| Pàgina principal | `https://diagnosia.edigital.cat/` |
| Política de privacitat | `https://diagnosia.edigital.cat/privacitat` |
| Condicions del servei | `https://diagnosia.edigital.cat/condicions` |
| Domini autoritzat | `edigital.cat` |
| Tipus de públic | External |
| Client OAuth web: redirecció | `https://diagnosia.edigital.cat/auth/callback` |
| Permisos utilitzats | `openid`, `email`, `profile` |

El docent només demana `openid email`; el perfil nominal es reserva al
responsable. No afegir permisos de Gmail, Drive ni altres API.
El flux és server-side; no necessita afegir orígens JavaScript per a un SDK
de Google al navegador. Revisar els orígens i redireccions antics i retirar
els túnels temporals de Cloudflare del client de producció quan no s'utilitzin.
Mantenir proves i desenvolupament en un projecte separat; localhost no és
l'origen del client de producció.

Els dominis autoritzats aquí són els del servei web, no els correus docents.
No afegir els dominis de les escoles a aquesta llista. La política exacta de
correu i el claim Workspace `hd` es validen al servidor de Diagnosi IA.
External és necessari per admetre altres organitzacions Workspace; els
responsables continuen subjectes a la política XTEC de l'aplicació.

Verificar la propietat de `edigital.cat` amb Google Search Console amb un
compte amb permisos al projecte quan ho requereixi Google. Revisar el Centre
de verificació per a la marca. Els permisos bàsics no exigeixen la verificació
de permisos sensibles o restringits; això no equival a una aprovació de marca.
Els administradors Workspace dels centres poden bloquejar el client o
requerir-ne l'autorització independentment de la verificació de Google.

## Configuració del servidor

Al fitxer d'entorn privat del servidor, abans de compilar:

```dotenv
NEXT_PUBLIC_APP_URL=https://diagnosia.edigital.cat
AUTH_MODE=google
LOCAL_AUTH_ALLOW_PRODUCTION=false
```

Configurar també `DATABASE_URL`, les credencials Google del client de producció
i els secrets existents segons `.env.example`. No copiar secrets a aquesta guia,
a Git, captures, URLs ni logs. No canviar `AUTH_USER_ID_SECRET` ni
`SUBMISSION_LOCK_HMAC_SECRET` en un desplegament ordinari: determinen les
vinculacions pseudònimes i la recuperació de participacions existents.
El canvi d'audiència Internal → External no exigeix per si sol canviar el
Client ID ni el Client Secret.

## Pendent abans d'obrir l'ús real

Les rutes legals són públiques i enllaçades des del peu compartit, però
continuen marcades com a esborrany. No donar-les per aprovades ni activar
l'accés real fins a completar:

- Identitat del prestador i responsable del tractament; papers dels centres
  i eventuals encarregats. El contacte proporcionat no determina aquests rols.
- Base jurídica per finalitat i informació als participants.
- Proveïdors d'allotjament, ubicació, contractes i eventuals transferències.
- Retenció, durada i purga de les còpies i procediment de drets que verifiqui
  la titularitat sense revelar respostes al centre ni registrar correus docents.
- Minimització als logs d'Apache, proxy, proveïdor i còpies: no conservar IP,
  user agents, correus, tokens ni dades individuals del professorat.
- Revisió dels riscos de `docs/PRIVACY.md`, inclòs el límit d'intents en memòria
  si es desplega més d'una instància, i validació legal per a ús institucional.

Un cop confirmats, actualitzar els textos i retirar l'avís d'esborrany.
No prometre una purga immediata de les còpies ni una retenció encara no definida.
La versió inicial dels textos és en català, amb `lang="ca"` explícit;
els enllaços del peu estan traduïts als cinc idiomes de la interfície.

## Publicació i verificació funcional

1. Integrar la PR, executar els controls de `docs/RELEASES.md`, compilar i
   reiniciar el servei amb l'entorn anterior i HTTPS.
2. Comprovar sense sessió que `/`, `/privacitat` i `/condicions` responen 200,
   també amb l'accés dels centres tancat. Les pàgines no requereixen OAuth.
3. Emplenar Marca amb les URL anteriors quan el contingut definitiu sigui públic.
4. Revisar les indicacions de Google i passar a `En producción` a Públic
   quan s'hagin resolt els pendents; no confondre el mode Prueba amb publicació.
5. Provar responsable XTEC i docent XTEC, docent de domini propi Workspace
   exacte, rebuig de domini incorrecte i consulta/PDF exclusivament propis.
   Verificar que centre i administració només reben agregats.

Amb només `openid`, `email`, `profile`, Google documenta una excepció a la
llista d'usuaris de prova; no confiar en aquesta llista com a control
d'autorització. L'aplicació manté les comprovacions de domini i prellançament.

## Fonts oficials

- [Polítiques OAuth](https://developers.google.com/identity/protocols/oauth2/policies).
- [Estats, permisos bàsics i controls Workspace](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).
- [Verificació de marca](https://developers.google.com/identity/verification/authentication-verification).
- [Dret d'informació](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).
