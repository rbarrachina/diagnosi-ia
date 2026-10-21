# Preparació OAuth per a ús intern

Origen definitiu: `https://diagnosia.edigital.cat`.

## Google Auth Platform

Fer els canvis al projecte independent `Diagnosi IA`:

| Camp | Valor |
| --- | --- |
| Nom | Diagnosi IA |
| Correu de suport i contacte | Compte institucional vàlid; `XXXXXX` és només un marcador documental |
| Pàgina principal | `https://diagnosia.edigital.cat/` |
| Política de privacitat | `https://diagnosia.edigital.cat/privacitat` |
| Normes internes (URL si es publica) | `https://diagnosia.edigital.cat/privacitat#normes-dus` |
| Domini autoritzat | `edigital.cat` |
| Tipus de públic | Internal |
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
Aquest desplegament es configura com a Internal: només admet comptes de la
mateixa organització Google Workspace o Cloud Identity que el projecte.
Cal comprovar que el projecte pertany a l'organització XTEC abans de donar
per fet que tots els comptes XTEC hi podran accedir. No n'hi ha prou amb el
correu de suport o el nom del projecte.

Els comptes de dominis propis d'altres organitzacions Workspace quedaran
bloquejats per Google. Administració → Configuració → Accés amb Google ha d’estar en Intern.
Aquest mode oculta el domini propi als centres i aplica XTEC al servidor.
El mode Extern resta disponible per a futurs desplegaments, però requereix
canviar també l’audiència a Google Cloud.

L'ús intern queda exempt de la verificació OAuth pública corresponent.
Revisar igualment els avisos de la consola. Els administradors Workspace poden
bloquejar el client o requerir-ne l'autorització. La informació de privacitat
continua sent necessària encara que el servei sigui intern.

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
El canvi d'audiència External → Internal no exigeix per si sol canviar el
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
2. Comprovar sense sessió que `/`, `/privacitat` i `/llicencies` responen 200,
   també amb l’accés dels centres tancat. Les pàgines no requereixen OAuth.
   `/condicions` ha de redirigir a `/privacitat#normes-dus`.
3. Emplenar Marca amb la portada i la política quan el contingut definitiu sigui
   accessible. Les normes d’ús són un document informatiu breu; afegir-ne la URL
   al camp de condicions només si es decideix publicar-les com a tals.
4. A Públic, seleccionar Internal i comprovar l’organització propietària.
   Als camps obligatoris de correu cal una adreça real: no introduir `XXXXXX`.
5. Provar responsable i docent de l’organització autoritzada, rebuig d’un
   compte d’una altra organització i consulta/PDF exclusivament propis.
   Verificar que centre i administració només reben agregats.

## Fonts oficials

- [Polítiques OAuth](https://developers.google.com/identity/protocols/oauth2/policies).
- [Estats, permisos bàsics i controls Workspace](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).
- [Verificació de marca](https://developers.google.com/identity/verification/authentication-verification).
- [Dret d'informació](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).
