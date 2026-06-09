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
- Codi públic anònim de l'espai.
- Hash o HMAC del token privat.
- Token privat xifrat per poder reconstruir l'enllaç compartit al creador autenticat.
- Versio del qüestionari.
- Estat actiu/inactiu de l'espai.
- Submissions anònimes amb identificador tècnic intern.
- Respostes tancades amb valors `0`, `1`, `2`.
- Timestamps tècnics agregables, no visibles al tauler ni al PDF.

Nota: els timestamps de `submissions` poden ser útils per integritat i manteniment, però no s'han de mostrar ni exportar. Si es considera que augmenten massa el risc de reidentificació en espais petits, es poden ometre o truncar en una revisió de privacitat.

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

## Logs

No s'han de registrar:

- tokens privats
- cossos complets de pèticions amb respostes
- identificadors tècnics combinats amb dades que permetin perfilar una persona

Els errors han de ser genèrics per a l'usuari i tècnicament suficients per depurar sense dades sensibles.

## Exportacions

L'única exportació prevista és el PDF de conjunt. No s'ha d'afegir CSV ni JSON descarregable amb respostes individuals sense una nova revisió de privacitat.

## Reinici d'espai

El creador autenticat pot reiniciar el seu únic espai. El reinici elimina `submissions` i `answers` anònimes de l'espai, regenera el codi públic i regenera el token privat de resultats. No conserva un històric de respostes individuals i no modifica les preguntes versionades.

## Riscos pendents per a fase 2

- Rate limiting.
- Proteccio anti-bots.
- Deteccio d'enviaments massius automatitzats.
- Caducitat o tancament automatic d'espais.
- Revisio legal o DPO si l'eina s'usa en entorns institucionals.
- Politica de retenció i eliminacio de dades.
