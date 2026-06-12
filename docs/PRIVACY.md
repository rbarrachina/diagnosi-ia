# Privacitat i anonimat

## Principi rector

Diagnosi IA ha de minimitzar dades. La resposta del professorat funciona sense identificar centres ni docents. Els creadors d'espais s'autentiquen amb compte XTEC per gestionar els espais propis. Els resultats només existeixen en conjunt.

## Dades prohibides

L'aplicació no ha de recollir ni desar del professorat participant:

- nom del centre
- codi oficial del centre
- nom o cognoms dels docents
- correus electrònics
- comptes d'usuari
- identificadors personals
- informació del dispositiu
- adreces IP a la base de dades de l'aplicació
- respostes obertes

Tambe queda prohibit crear una taula `centres`.

## Dades permeses

Només es preveuen:

- Identificador d'usuari autenticat del creador XTEC (`owner_user_id`).
- Identificador d'usuari autenticat dels administradors autoritzats.
- Codi públic anònim de l'espai.
- Hash o HMAC del token privat.
- Token privat xifrat per poder reconstruir l'enllaç compartit al creador autenticat.
- Versio del qüestionari.
- Estat actiu/inactiu de l'espai.
- Submissions anònimes amb identificador tècnic intern.
- Respostes tancades amb valors `0`, `1`, `2`.
- Timestamps tècnics agregables, no visibles al tauler ni al PDF.

Nota: els timestamps de `submissions` poden ser útils per integritat i manteniment, però no s'han de mostrar ni exportar. Si es considera que augmenten massa el risc de reidentificació en espais petits, es poden ometre o truncar en una revisió de privacitat.

## Administracio

Els administradors només poden gestionar l'estructura del qüestionari versionat
i altres administradors. La seva autoritzacio es basa en el seu identificador
de Supabase Auth i s'ha de mantenir separada de les submissions anònimes.

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
- mitjanes globals
- mitjanes per bloc
- mitjanes per pregunta
- distribucions per pregunta

La implementació actual retorna només aquest model de dades de conjunt a `POST /api/results`. El PDF es genera amb la mateixa capa de resultats de conjunt després de validar novament el token.

El recompte intern de respostes es fa a PostgreSQL amb una RPC server-only que retorna només totals per pregunta i valor de resposta. El servidor no necessita carregar totes les files individuals d'`answers` per calcular el tauler o el PDF.

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

## Bloqueig local de resposta repetida

Després d'un enviament correcte, el navegador desa una marca local amb el codi
públic anònim de l'espai (`diagnosi-ia:submitted:[publicCode]`). Aquesta marca
només viu al navegador de la persona participant i no s'envia a la base de dades.
Serveix per evitar enviaments repetits accidentals des del mateix navegador,
però no identifica la persona ni impedeix tècnicament respondre des d'un altre
navegador o dispositiu.

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
