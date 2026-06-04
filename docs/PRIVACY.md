# Privacitat i anonimat

## Principi rector

Diagnosi IA ha de minimitzar dades. La diagnosi funciona sense identificar centres, docents o persones responsables. Els resultats nomes existeixen en forma agregada.

## Dades prohibides

L'aplicacio no ha de recollir ni desar:

- nom del centre
- codi oficial del centre
- nom o cognoms dels docents
- correus electronics
- comptes d'usuari
- identificadors personals
- informacio del dispositiu
- adreces IP a la base de dades de l'aplicacio
- respostes obertes

Tambe queda prohibit crear una taula `centres`.

## Dades permeses

Nomes es preveuen:

- Codi public anonim de l'espai.
- Hash o HMAC del token privat.
- Versio del questionari.
- Estat actiu/inactiu de l'espai.
- Submissions anonimes amb identificador tecnic intern.
- Respostes tancades amb valors `0`, `1`, `2`.
- Timestamps tecnics agregables, no visibles al tauler ni al PDF.

Nota: els timestamps de `submissions` poden ser utils per integritat i manteniment, pero no s'han de mostrar ni exportar. Si es considera que augmenten massa el risc de reidentificacio en espais petits, es poden ometre o truncar en una revisio de privacitat.

## Token privat

Requisits:

- Minim 32 bytes aleatoris.
- Generat amb font criptograficament segura.
- No desat en text pla.
- Desat com HMAC o hash amb secret del servidor.
- No inclos en query params.
- No escrit en logs.
- No inclos en PDF.

Format d'enllac privat:

```text
/resultats/[publicCode]#token=[privateToken]
```

El fragment `#token=` no s'envia automaticament al servidor pel navegador. La pagina de resultats l'ha de llegir i enviar per `POST`.

## Agregacio

El tauler i el PDF poden mostrar:

- nombre total de respostes
- mitjanes globals
- mitjanes per bloc
- mitjanes per pregunta
- distribucions per pregunta

No poden mostrar:

- files individuals
- identificadors de submissions
- dates o hores de cada resposta
- combinacions de respostes d'una mateixa persona
- token privat

## Risc amb poques respostes

No hi ha minim fix per consultar resultats. Aixo es una decisio de producte, pero implica mes risc interpretatiu quan el volum es baix.

Mitigacio obligatoria:

- Mostrar un avis de prudencia quan hi hagi poques respostes.
- Evitar qualsevol visualitzacio que combini respostes per persona.
- No mostrar timestamps individuals.

Llindar recomanat per a l'avis: menys de 5 respostes. Aquest llindar no bloqueja l'acces.

## Supabase i RLS

Cal activar Row Level Security a totes les taules exposades.

No s'han de crear politiques publiques de lectura per a:

- `diagnostic_spaces`
- `submissions`
- `answers`

El client public de Supabase, si existeix, no ha de poder llegir ni escriure directament aquestes taules. Les operacions es fan amb endpoints server-side.

## Logs

No s'han de registrar:

- tokens privats
- cossos complets de peticions amb respostes
- identificadors tecnics combinats amb dades que permetin perfilar una persona

Els errors han de ser generics per a l'usuari i tecnicament suficients per depurar sense dades sensibles.

## Exportacions

L'unica exportacio prevista es el PDF agregat. No s'ha d'afegir CSV ni JSON descarregable amb respostes individuals sense una nova revisio de privacitat.

## Riscos pendents per a fase 2

- Rate limiting.
- Proteccio anti-bots.
- Deteccio d'enviaments massius automatitzats.
- Caducitat o tancament automatic d'espais.
- Revisio legal o DPO si l'eina s'usa en entorns institucionals.
- Politica de retencio i eliminacio de dades.
