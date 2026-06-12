# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai anònim de diagnosi sobre l'ús educatiu de la intel·ligència artificial. Una persona responsable autenticada amb compte XTEC crea l'espai, comparteix un enllaç públic amb el professorat i consulta resultats de conjunt amb OAuth o amb un enllaç privat.

L'aplicació no desa ni mostra el nom del centre. Tampoc avalua docents individualment.

## Objectius

- Crear espais anònims amb autenticació OAuth per al creador XTEC.
- Recollir respostes anònimes d'un qüestionari fix i versionat.
- Mostrar resultats de conjunt des de la primera resposta.
- Generar un informe PDF de conjunt.
- Evitar la recollida de dades personals o identificadors de centre.

## Fora d'abast

- Comptes d'usuari per al professorat participant.
- Gestio de centres identificats.
- Seguiment individual del professorat.
- Respostes obertes.
- Exportacio de dades individuals.
- Comparatives públiques entre centres.

## Administracio del qüestionari

L'aplicació inclou una administracio global limitada al manteniment del
qüestionari versionat i dels comptes administradors. Aquesta administracio no
pot accedir a respostes individuals, no pot identificar centres i no pot crear
filtres o exportacions que facilitin la reidentificacio de persones.

Funcionalitats previstes:

- gestionar blocs de preguntes;
- gestionar preguntes tancades;
- crear noves versions del qüestionari;
- activar una versio concreta;
- eliminar una versio no activa del qüestionari amb tots els espais i respostes
  associats després d'un avís explícit;
- aplicar correccions menors sobre una versio només quan encara no estigui
  assignada a cap espai de diagnosi;
- gestionar administradors.

La gestio d'administradors permet cercar comptes XTEC existents per nom,
cognoms o correu i seleccionar quin usuari rep permisos. La pantalla pot
mostrar nom, cognoms i correu llegits server-side de Supabase Auth per facilitar
la identificacio de l'administrador, però aquestes dades no es copien a
`admin_users`.

Eliminar un administrador només elimina el rol d'administracio de `admin_users`;
no elimina ni modifica el compte de Supabase Auth de la persona.

Les versions noves es creen des d'un únic formulari on l'administrador tria si
vol començar amb un qüestionari en blanc o copiar una versio existent. El títol
sempre és obligatori i ha de ser diferent dels títols existents. Les versions
sense espais de diagnosi assignats poden desar-se com a esborrany parcial durant
l'edició: l'administrador pot afegir o eliminar blocs i pot afegir o eliminar
preguntes dins de cada bloc. En afegir un bloc nou, l'editor crea també una
pregunta inicial. Cada versio pot tenir entre 1 i 10 blocs, i cada bloc pot
tenir entre 1 i 10 preguntes. L'activació exigeix que tots els blocs tinguin
almenys una pregunta.

### Acces inicial d'administracio

El primer administrador és el primer usuari autenticat amb compte `@xtec.cat`
que accedeix a la pantalla d'administracio quan encara no existeix cap fila a
`admin_users`.

Un cop existeix almenys un administrador, cap altre usuari pot accedir a
l'administracio pel simple fet de tenir un compte XTEC. Els nous
administradors només poden ser afegits o reactivats per un administrador actiu.

Aquest bootstrap inicial no s'ha de barrejar amb la creació d'espais de
diagnosi. Crear un qüestionari o un espai no concedeix permisos
d'administracio.

### Regla de correccions menors

Una versio del qüestionari sense espais assignats es pot corregir directament.

Quan una versio ja està assignada a un espai, l'editor la mostra bloquejada per
defecte. Un administrador pot prémer `Editar` i acceptar un avís explícit abans
de modificar-la. Si la versio està activa o ja té respostes, només es poden
corregir títols i textos existents; no es poden eliminar ni afegir blocs o
preguntes. Les versions inactives sense respostes poden modificar estructura.

L'activacio d'una nova versio no modifica respostes existents, no reassigna
respostes a preguntes noves i no altera els resultats dels espais anteriors.

Eliminar una versio no activa és una accio destructiva d'administracio. Després
de confirmar l'avís, s'elimina la versio i totes les seves instàncies d'espai,
respostes, blocs i preguntes. Les versions actives no mostren el botó
d'eliminacio i la base de dades també rebutja eliminar-les. Aquesta accio no ha
de retornar ni exportar files individuals abans d'eliminar-les.

## Fluxos principals

### Creacio d'espai

Ruta: `/crear`

La persona responsable inicia sessió amb Google OAuth mitjançant Supabase Auth. Només s'accepten comptes amb correu acabat en `@xtec.cat`. Cada usuari autenticat pot tenir un únic espai anònim. El servidor genera:

- Codi públic llegible amb format `C-7KX9-M2Q8`.
- Token privat llarg i criptograficament segur.

Resultat mostrat després de crear l'espai i recuperable des de la gestio del creador:

- Enllaç públic: `/q/[publicCode]`
- Enllaç privat compartit: `/resultats/compartit/[publicCode]#token=[privateToken]`
- Enllaç de resultats del creador: `/espais/[publicCode]/resultats`
- Previsualització del qüestionari en mode lectura:
  `/espais/[publicCode]/questionari`

El token privat es desa com HMAC per validar-lo i xifrat per poder reconstruir l'enllaç per al creador autenticat. No es desa mai en text pla.

Si l'usuari ja té un espai creat, no pot crear-ne un segon. La mateixa pantalla `/crear` mostra els enllaços, el nombre agregat de respostes, l'accés als resultats, la regeneració de l'enllaç privat i el reinici del qüestionari.

La gestio del creador també ofereix un botó per veure el qüestionari assignat a
l'espai en mode lectura. Aquesta previsualització exigeix sessió XTEC i
propietat de l'espai, mostra un avís clar que no es pot respondre i no inclou
cap botó d'enviament.

La regeneració de l'enllaç privat es mostra al costat de l'enllaç privat compartit i demana confirmació abans d'invalidar l'enllaç anterior.

### Reinici de qüestionari

Ruta de gestio: `/crear`

El creador autenticat pot reiniciar el seu qüestionari. Aquesta accio:

- elimina totes les `submissions` i `answers` anònimes de l'espai;
- conserva el mateix `diagnostic_spaces.id` i el mateix `owner_user_id`;
- assigna l'espai a la versio de qüestionari que estigui activa en aquell
  moment;
- genera un nou codi públic;
- genera un nou token privat de resultats;
- invalida l'enllaç públic i l'enllaç privat antics.

No s'eliminen ni es modifiquen les preguntes del qüestionari versionat.

### Resposta del professorat

Ruta: `/q/[publicCode]`

El formulari ha de mostrar:

- Objectiu de la diagnosi.
- Respostes anònimes.
- No recollida de dades personals.
- Resultats només de conjunt.
- Indicacio que cal respondre una sola vegada.

El docent respon totes les preguntes obligatories de la versio assignada a
l'espai, amb escala:

- `0`: Encara no
- `1`: Parcialment
- `2`: Sí, de manera habitual

No hi ha camps oberts.

Cada espai de diagnosi admet un màxim de 300 respostes completes. Quan s'arriba
a aquest límit, el formulari ja no accepta nous enviaments i informa que el
qüestionari ha arribat al màxim de respostes.

Quan el servidor accepta l'enviament, el navegador desa una marca local per al
codi públic del qüestionari i evita un segon enviament des del mateix navegador.
Aquesta mesura no identifica la persona i no garanteix que una mateixa persona
no pugui respondre des d'un altre navegador, dispositiu o després d'esborrar les
dades locals.

### Consulta de resultats

Ruta compartida: `/resultats/compartit/[publicCode]#token=[privateToken]`

Ruta del creador: `/espais/[publicCode]/resultats`

El navegador llegeix el fragment `#token=` i envia el token mitjançant `POST /api/results`. El token no s'envia en query params.

El creador autenticat pot consultar els resultats dels espais propis si `owner_user_id` coincideix amb el seu usuari autenticat.

La vista de resultats del creador mostra l'accio de descarregar el PDF i un boto per tornar a la gestio de l'espai. La gestio de l'enllaç privat compartit es fa des de `/crear`.

El servidor valida el token i retorna només dades de conjunt:

- Codi de l'espai.
- Versio del qüestionari.
- Nombre total de respostes.
- Mitjana global.
- Mitjana per bloc.
- Grafica d'aranya i grafica de barres per bloc.
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

Estructura inicial:

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

Les preguntes concretes s'han de carregar amb migració o `seed.sql`. Una versió
activa o amb respostes només admet correccions de títols i textos existents
després d'acceptar l'avís d'edició quan correspongui; qualsevol canvi
d'estructura crea una nova versió.

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
