# Privacitat i anonimat

## Principi rector

Diagnosi IA ha de minimitzar dades. La resposta del professorat funciona sense identificar centres ni docents. Els creadors d'espais s'autentiquen amb compte XTEC autoritzat per gestionar els espais propis. Els resultats només existeixen en conjunt.

La branca `migration/mysql` no canvia aquest principi. La migracio de
Supabase/PostgreSQL a MySQL ha de preservar les mateixes garanties
d'anonimat, encara que canviïn els mecanismes tècnics.

## Dades prohibides

L'aplicació no ha de recollir ni desar del professorat participant:

- nom del centre
- codi oficial del centre
- nom o cognoms dels docents
- correus electrònics
- comptes o perfils de professorat dins la base de dades de diagnosi
- identificadors personals
- informació del dispositiu
- adreces IP a la base de dades de l'aplicació
- respostes obertes

Tambe queda prohibit crear una taula `centres`.

## Dades permeses

Només es preveuen:

- Identificador d'usuari autenticat del creador XTEC (`owner_user_id`).
- Identificador d'usuari autenticat dels administradors autoritzats.
- Configuracio global no personal per decidir si els responsables poden ser
  qualsevol compte `@xtec.cat` o només comptes de centre XTEC.
- Codi públic anònim de l'espai.
- Hash o HMAC del token privat.
- Token privat xifrat per poder reconstruir l'enllaç compartit al creador autenticat.
- Versio del qüestionari.
- Estat actiu/inactiu de l'espai.
- Submissions anònimes amb identificador tècnic intern.
- Respostes tancades amb valors `0`, `1`, `2`, `3`.
- Bloquejos pseudònims de resposta repetida a `submission_locks`, calculats com
  HMAC server-side a partir de l'usuari autenticat i el codi public de
  l'enquesta. No contenen correu, nom ni cap valor reversible i no s'han
  d'unir amb `submissions` ni `answers`.
- Timestamps tècnics agregables, no visibles al tauler ni al PDF.

Nota: els timestamps de `submissions` poden ser útils per integritat i manteniment, però no s'han de mostrar ni exportar. Si es considera que augmenten massa el risc de reidentificació en espais petits, es poden ometre o truncar en una revisió de privacitat.

## Administracio

Els administradors només poden gestionar l'estructura del qüestionari versionat
i altres administradors. La seva autoritzacio es basa en el seu identificador
de Supabase Auth i s'ha de mantenir separada de les submissions anònimes.

A `migration/mysql`, Supabase Auth queda substituit per una capa server-side
pròpia. La taula `admin_users` ha de continuar guardant nomes un identificador
opac d'usuari i metadades de rol. No ha de copiar nom, cognoms ni email.

La pantalla d'administracio pot mostrar nom, cognoms i correu dels comptes
administradors o candidats a administrador llegint-los server-side de Supabase
Auth. Aquesta visualitzacio és només per identificar a qui es concedeixen
permisos; l'aplicacio no ha de copiar aquests camps a `admin_users` ni
barrejar-los amb respostes.

L'administracio no pot:

- veure files individuals de `submissions` o `answers`;
- exportar respostes individuals;
- filtrar resultats per atributs que identifiquin centres o persones;
- crear respostes obertes;
- afegir camps de centre, persona, email, IP, dispositiu o user agent.

L'administracio pot consultar resultats globals per versio de qüestionari només
amb consultes agregades. Aquesta vista pot sumar totes les respostes d'una
versio, però no pot segmentar per centre, espai, creador, docent, data, compte
o cap altre atribut que faciliti la reidentificacio. El PDF d'administracio ha
de contenir el mateix model agregat i no pot incloure codis publics d'espais ni
tokens.

La configuracio global només desa valors no personals: el mode d'acces de
responsables i el llindar agregat de respostes mínimes per computar resultats
d'administracio. No desa el nom del centre, codis oficials, correus, dominis
derivats ni cap llista de comptes de centre. La comprovacio del format de
compte de centre es fa sobre el correu autenticat de la sessio i no es copia a
les taules de l'aplicacio.

Les correccions menors del qüestionari es poden aplicar directament sobre una
versio assignada només després d'un avís explícit a l'administrador. Quan una
versio està activa o ja té respostes, les correccions directes només poden
canviar títols i textos existents; no poden eliminar ni afegir preguntes perquè
això podria alterar el formulari vigent o el significat de respostes ja
recollides. Els canvis estructurals han de crear una nova versio.

L'eliminacio d'una versio no activa de qüestionari pot eliminar també espais i
respostes anònimes associades, però no ha de mostrar, exportar ni retornar files
individuals abans d'esborrar-les. Les versions actives no es poden eliminar.

## Token privat

Requisits:

- Minim 32 bytes aleatoris.
- Generat amb font criptograficament segura.
- No desat en text pla.
- Desat com HMAC o hash amb secret del servidor per validar-lo.
- Desat xifrat amb clau server-side per poder recuperar l'enllaç compartit des de la gestio del creador.
- No inclos en query params.
- No escrit en logs.
- No inclos en PDF.

Format d'enllaç privat:

```text
/resultats/compartit/[publicCode]#token=[privateToken]
```

El fragment `#token=` no s'envia automaticament al servidor pel navegador. La pagina de resultats l'ha de llegir i enviar per `POST`.

## Agregacio

El tauler i el PDF poden mostrar:

- nombre total de respostes
- percentatges globals normalitzats a partir de l'escala 0-3
- percentatges per bloc
- percentatges per pregunta
- distribucions per pregunta
- en administracio, el mateix model agregat acumulat per versio de qüestionari
  sobre totes les enquestes d'aquella versio
- en administracio, el nombre agregat de centres/espais d'una versio, sense
  noms, codis publics ni cap llistat d'espais
- en administracio, l'aplicacio pot excloure del còmput global les enquestes
  amb un nombre de respostes igual o inferior al llindar configurat, sempre amb
  consultes agregades i sense mostrar quins espais han quedat exclosos

La implementació actual retorna només aquest model de dades de conjunt a `POST /api/results`. El PDF es genera amb la mateixa capa de resultats de conjunt després de validar novament el token.

El recompte intern de respostes es fa a PostgreSQL amb una RPC server-only que retorna només totals per pregunta i valor de resposta. El servidor no necessita carregar totes les files individuals d'`answers` per calcular el tauler o el PDF.

A `migration/mysql`, aquest recompte s'ha de fer amb consultes agregades MySQL
server-side. La consulta ha de retornar nomes totals per pregunta i valor de
resposta, sense `submission_id`, timestamps individuals ni combinacions de
respostes d'una mateixa persona.

El límit de 300 respostes per espai es valida comptant submissions de l'espai en
la mateixa RPC server-only d'enviament. Aquest recompte és agregat i no afegeix
cap identificador de docent.

No poden mostrar:

- files individuals
- identificadors de submissions
- dates o hores de cada resposta
- combinacions de respostes d'una mateixa persona
- token privat

## Risc amb poques respostes

No hi ha mínim fix per consultar resultats. Això és una decisió de producte, però implica més risc interpretatiu quan el volum és baix.

Mitigacio obligatoria:

- Mostrar un avís de prudència quan hi hagi poques respostes.
- Evitar qualsevol visualitzacio que combini respostes per persona.
- No mostrar timestamps individuals.

Llindar recomanat per a l'avís: menys de 5 respostes. Aquest llindar no bloqueja l'accés.

## Supabase i RLS

Aquest apartat aplica a `main` amb Supabase/PostgreSQL.

Cal activar Row Level Security a totes les taules exposades.

No s'han de crear polítiques públiques de lectura per a:

- `diagnostic_spaces`
- `submissions`
- `answers`

El client públic de Supabase, si existeix, no ha de poder llegir ni escriure directament aquestes taules. Les operacions es fan amb endpoints server-side.

La inserció de respostes es fa amb una RPC server-only. Els rols `anon` i `authenticated` no tenen permís d'execució sobre aquesta funció; només el servidor amb `service_role` pot cridar-la.

La gestio d'espais del creador es fa també amb rutes server-side. Tot i que existeixi Supabase Auth, el navegador no ha de llegir directament `diagnostic_spaces`, perquè aquesta taula conté hash i token xifrat.

La gestio d'administracio també s'ha de fer amb rutes server-side o funcions de
servidor. Les polítiques RLS per a administradors només poden habilitar
metadades necessaries del qüestionari i de la taula d'administradors; no han de
donar lectura directa a `diagnostic_spaces`, `submissions` ni `answers` des del
navegador.

## MySQL i control server-side

A `migration/mysql`, MySQL no ofereix RLS equivalent a Supabase. Les garanties
de privacitat passen a dependre de la capa d'aplicacio:

- El client MySQL nomes pot existir en codi server-side.
- Les lectures i mutacions sensibles han de passar per Route Handlers, server
  actions o funcions server-side.
- Els repositoris no han d'exposar files individuals de `submissions` o
  `answers` a components client.
- Les submissions i answers s'han d'inserir en una transaccio.
- El limit de 300 submissions s'ha de validar dins la transaccio, amb bloqueig
  suficient per evitar superar el limit en concurrencia.
- Els resultats i el PDF s'han de construir nomes amb dades agregades.

Els modes d'autenticacio de `migration/mysql` nomes poden servir per a
creadors i administradors. No poden crear comptes de professorat participant ni
afegir identificadors personals a submissions o answers. El mode Google desa a
MySQL nomes un UUID opac derivat amb HMAC del subject de Google; l'email només
viu a la sessio server-side/browser `httpOnly` i no es copia a les taules de
l'aplicacio.

## Bloqueig de resposta repetida

Per respondre, el professorat ha d'iniciar sessio amb compte `@xtec.cat`.
L'aplicacio no desa el correu ni cap perfil docent. Abans de crear una
submission, el servidor calcula un HMAC amb secret server-side a partir de
l'identificador opac autenticat i el codi public de l'enquesta. Aquest valor es
desa a `submission_locks` amb una restriccio unica per espai i impedeix una
segona resposta al mateix enllaç.

`submission_locks` no pot contenir `submission_id`, respostes, email, IP ni
user agent. Les consultes de resultats no han de llegir aquesta taula. Quan es
reinicia un espai, els bloquejos anteriors s'eliminen juntament amb
`submissions` i `answers`.

Després d'un enviament correcte, el navegador també desa una marca local amb el
codi públic anònim de l'espai (`diagnosi-ia:submitted:[publicCode]`). Aquesta
marca només viu al navegador i serveix com a ajuda d'interficie.

## Logs

No s'han de registrar:

- tokens privats
- cossos complets de pèticions amb respostes
- identificadors tècnics combinats amb dades que permetin perfilar una persona

Els errors han de ser genèrics per a l'usuari i tècnicament suficients per depurar sense dades sensibles.

## Exportacions

L'única exportació prevista és el PDF de conjunt. No s'ha d'afegir CSV ni JSON descarregable amb respostes individuals sense una nova revisió de privacitat.

## Reinici d'espai

El creador autenticat pot reiniciar el seu únic espai. El reinici elimina
`submissions` i `answers` anònimes de l'espai, reassigna l'espai a la versio
activa del qüestionari, regenera el codi públic i regenera el token privat de
resultats. No conserva un històric de respostes individuals i no modifica les
preguntes versionades.

## Riscos pendents per a fase 2

- Rate limiting.
- Proteccio anti-bots.
- Deteccio d'enviaments massius automatitzats.
- Caducitat o tancament automatic d'espais.
- Revisio legal o DPO si l'eina s'usa en entorns institucionals.
- Politica de retenció i eliminacio de dades.
