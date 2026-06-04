# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai anonim de diagnosi sobre l'us educatiu de la intel.ligencia artificial. Una persona responsable crea l'espai, comparteix un enllac public amb el professorat i consulta resultats agregats amb un enllac privat.

L'aplicacio no desa ni mostra el nom del centre. Tampoc avalua docents individualment.

## Objectius

- Crear espais anonims sense autenticacio.
- Recollir respostes anonimes d'un questionari fix i versionat.
- Mostrar resultats agregats des de la primera resposta.
- Generar un informe PDF agregat.
- Evitar la recollida de dades personals o identificadors de centre.

## Fora d'abast

- Comptes d'usuari.
- Gestio de centres identificats.
- Seguiment individual del professorat.
- Respostes obertes.
- Exportacio de dades individuals.
- Comparatives publiques entre centres.
- Panell d'administracio global.

## Fluxos principals

### Creacio d'espai

Ruta: `/crear`

La persona responsable crea un espai anonim. El servidor genera:

- Codi public llegible amb format `C-7KX9-M2Q8`.
- Token privat llarg i criptograficament segur.

Resultat mostrat un sol cop:

- Enllac public: `/q/[publicCode]`
- Enllac privat: `/resultats/[publicCode]#token=[privateToken]`

El token privat nomes existeix en text pla en el moment de creacio i al navegador de la persona responsable si conserva l'enllac.

### Resposta del professorat

Ruta: `/q/[publicCode]`

El formulari ha de mostrar:

- Objectiu de la diagnosi.
- Respostes anonimes.
- No recollida de dades personals.
- Resultats nomes agregats.
- Indicacio que cal respondre una sola vegada.

El docent respon 20 preguntes obligatories amb escala:

- `0`: Encara no
- `1`: En part
- `2`: Si, de manera habitual

No hi ha camps oberts.

### Consulta de resultats

Ruta: `/resultats/[publicCode]#token=[privateToken]`

El navegador llegeix el fragment `#token=` i envia el token mitjancant `POST /api/results`. El token no s'envia en query params.

El servidor valida el token i retorna nomes dades agregades:

- Codi de l'espai.
- Versio del questionari.
- Nombre total de respostes.
- Mitjana global.
- Mitjana per bloc.
- Grafica de barres per bloc.
- Mitjana per pregunta.
- Distribucio per pregunta.
- Grafiques apilades amb les tres opcions.
- Text breu d'interpretacio.

Si hi ha poques respostes, el tauler mostra un avis de prudencia metodologica. No hi ha minim fix.

### Informe PDF

Accio: boto `Descarrega l'informe PDF`

Endpoint: `POST /api/reports/pdf`

El servidor valida novament el token i genera un PDF agregat amb:

- Titol de la diagnosi.
- Codi anonim de l'espai.
- Versio del questionari.
- Data de generacio.
- Nombre de respostes.
- Explicacio de l'escala.
- Grafica general dels blocs.
- Grafiques i resultats de cada pregunta.
- Resum de fortaleses.
- Ambits amb marge de millora.
- Nota metodologica.
- Avis que no es una avaluacio individual del professorat.

El PDF no inclou dades personals, token privat ni respostes individuals.

## Questionari v1

Versio: `2026.1`

Estructura:

- 5 blocs.
- 4 preguntes per bloc.
- 20 preguntes totals.
- Totes obligatories.
- Totes amb escala `0`, `1`, `2`.

Blocs:

1. Alfabetitzacio i us critic de la IA
2. Us de la IA en la practica docent
3. Us de la IA amb l'alumnat
4. Avaluacio i retroaccio
5. Dades, seguretat i criteris compartits

Les preguntes concretes s'han de carregar amb migracio o `seed.sql`. Una versio amb respostes no es pot editar; qualsevol canvi crea una nova versio.

## Textos funcionals recomanats

### Text introductori del formulari

"Aquesta diagnosi anonima ajuda a coneixer de manera agregada com s'esta utilitzant la intel.ligencia artificial en el context educatiu. No es recullen dades personals, no s'identifica cap docent i els resultats nomes es mostraran de forma agregada. Respon una sola vegada."

### Avis amb poques respostes

"El nombre de respostes encara es baix. Els resultats poden ser menys representatius i s'han d'interpretar amb prudencia."

### Avis metodologic del PDF

"Aquest informe presenta resultats agregats d'una diagnosi anonima. No permet avaluar individualment cap docent ni reconstruir respostes personals."

## Requisits no funcionals

- Validacio estricta al servidor.
- Cap secret al client.
- Cap dada individual al tauler o PDF.
- Accessibilitat basica: formularis etiquetats, contrast suficient i navegacio amb teclat.
- UI clara i institucional, sense aparenca de ranquing ni avaluacio personal.
