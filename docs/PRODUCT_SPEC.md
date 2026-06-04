# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai anònim de diagnosi sobre l'ús educatiu de la intel·ligència artificial. Una persona responsable crea l'espai, comparteix un enllaç públic amb el professorat i consulta resultats de conjunt amb un enllaç privat.

L'aplicació no desa ni mostra el nom del centre. Tampoc avalua docents individualment.

## Objectius

- Crear espais anònims sense autenticació.
- Recollir respostes anònimes d'un qüestionari fix i versionat.
- Mostrar resultats de conjunt des de la primera resposta.
- Generar un informe PDF de conjunt.
- Evitar la recollida de dades personals o identificadors de centre.

## Fora d'abast

- Comptes d'usuari.
- Gestio de centres identificats.
- Seguiment individual del professorat.
- Respostes obertes.
- Exportacio de dades individuals.
- Comparatives públiques entre centres.
- Panell d'administracio global.

## Fluxos principals

### Creacio d'espai

Ruta: `/crear`

La persona responsable crea un espai anònim. El servidor genera:

- Codi públic llegible amb format `C-7KX9-M2Q8`.
- Token privat llarg i criptograficament segur.

Resultat mostrat un sol cop:

- Enllaç públic: `/q/[publicCode]`
- Enllaç privat: `/resultats/[publicCode]#token=[privateToken]`

El token privat només existeix en text pla en el moment de creació i al navegador de la persona responsable si conserva l'enllaç.

### Resposta del professorat

Ruta: `/q/[publicCode]`

El formulari ha de mostrar:

- Objectiu de la diagnosi.
- Respostes anònimes.
- No recollida de dades personals.
- Resultats només de conjunt.
- Indicacio que cal respondre una sola vegada.

El docent respon 20 preguntes obligatories amb escala:

- `0`: Encara no
- `1`: Parcialment
- `2`: Sí, de manera habitual

No hi ha camps oberts.

### Consulta de resultats

Ruta: `/resultats/[publicCode]#token=[privateToken]`

El navegador llegeix el fragment `#token=` i envia el token mitjançant `POST /api/results`. El token no s'envia en query params.

El servidor valida el token i retorna només dades de conjunt:

- Codi de l'espai.
- Versio del qüestionari.
- Nombre total de respostes.
- Mitjana global.
- Mitjana per bloc.
- Grafica de barres per bloc.
- Mitjana per pregunta.
- Distribucio per pregunta.
- Grafiques apilades amb les tres opcions.
- Text breu d'interpretació.

Si hi ha poques respostes, el tauler mostra un avís de prudència metodològica. No hi ha mínim fix.

### Informe PDF

Accio: boto `Descarrega l'informe PDF`

Endpoint: `POST /api/reports/pdf`

El servidor valida novament el token i genera un PDF de conjunt amb:

- Titol de la diagnosi.
- Codi anònim de l'espai.
- Versio del qüestionari.
- Data de generació.
- Nombre de respostes.
- Explicacio de l'escala.
- Grafica general dels blocs.
- Grafiques i resultats de cada pregunta.
- Resum de fortaleses.
- Àmbits amb marge de millora.
- Nota metodològica.
- Avis que no és una avaluació individual del professorat.

El PDF no inclou dades personals, token privat ni respostes individuals.

## Qüestionari v1

Versió inicial: `2026.1`

Versió activa corregida: `2026.2`

Estructura:

- 5 blocs.
- 4 preguntes per bloc.
- 20 preguntes totals.
- Totes obligatories.
- Totes amb escala `0`, `1`, `2`.

Blocs:

1. Alfabetització i ús crític de la IA
2. Us de la IA en la pràctica docent
3. Us de la IA amb l'alumnat
4. Avaluacio i retroacció
5. Dades, seguretat i criteris compartits

Les preguntes concretes s'han de carregar amb migració o `seed.sql`. Una versió amb respostes no es pot editar; qualsevol canvi crea una nova versió.

## Textos funcionals recomanats

### Text introductori del formulari

"Aquesta diagnosi anònima ajuda a conèixer amb una visió de conjunt com s'està utilitzant la intel·ligència artificial en el context educatiu. No es recullen dades personals, no s'identifica cap docent i els resultats només es mostraran en conjunt. Respon una sola vegada."

### Avis amb poques respostes

"Poques respostes: interpreta els resultats amb prudència."

### Avis metodologic del PDF

"Aquest informe presenta resultats de conjunt d'una diagnosi anònima. No permet avaluar individualment cap docent ni reconstruir respostes personals."

## Requisits no funcionals

- Validacio estricta al servidor.
- Cap secret al client.
- Cap dada individual al tauler o PDF.
- Accessibilitat bàsica: formularis etiquetats, contrast suficient i navegació amb teclat.
- UI clara i institucional, sense aparenca de ranquing ni avaluació personal.
