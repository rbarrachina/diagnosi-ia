# Especificacio de producte

## Resum

Diagnosi IA permet crear un espai anònim de diagnosi sobre l'ús educatiu de la intel·ligència artificial. Una persona responsable autenticada amb compte XTEC autoritzat crea l'espai, comparteix un enllaç públic amb el professorat i consulta resultats de conjunt amb OAuth o amb un enllaç privat.

L'aplicació no desa ni mostra el nom del centre. Tampoc avalua docents individualment.

Nota de branca: `main` continua sent la versio estable amb
Supabase/PostgreSQL. La branca `migration/mysql` és experimental i té com a
objectiu immediat fer funcionar el mateix producte en local amb MySQL. Aquesta
migracio no canvia l'abast funcional ni les regles d'anonimat del producte.

## Objectius

- Crear espais anònims amb autenticació OAuth per al creador XTEC autoritzat.
- Recollir respostes anònimes d'un qüestionari fix i versionat, amb accés
  autenticat XTEC del professorat només per evitar respostes repetides.
- Mostrar resultats de conjunt des de la primera resposta.
- Generar un informe PDF de conjunt.
- Evitar la recollida de dades personals o identificadors de centre.

## Fora d'abast

- Perfils, gestio o emmagatzematge de correus del professorat participant.
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
- configurar els minuts estimats per respondre cada versio;
- activar una versio concreta;
- eliminar una versio no activa del qüestionari amb tots els espais i respostes
  associats després d'un avís explícit;
- aplicar correccions menors sobre una versio només quan encara no estigui
  assignada a cap espai de diagnosi;
- gestionar administradors;
- configurar si l'accés de responsables admet qualsevol compte `@xtec.cat` o
  només comptes de centre XTEC.
- consultar resultats globals agregats per versio de qüestionari i descarregar
  un PDF agregat d'administracio.

La gestio d'administradors permet cercar comptes XTEC existents per nom,
cognoms o correu i seleccionar quin usuari rep permisos. La pantalla pot
mostrar nom, cognoms i correu llegits server-side de Supabase Auth per facilitar
la identificacio de l'administrador, però aquestes dades no es copien a
`admin_users`.

Eliminar un administrador només elimina el rol d'administracio de `admin_users`;
no elimina ni modifica el compte de Supabase Auth de la persona.

Les versions noves es creen des d'un únic formulari on l'administrador tria si
vol començar amb un qüestionari en blanc o copiar una versio existent. El títol
sempre és obligatori i ha de ser diferent dels títols existents. Cada versio
inclou els minuts estimats per respondre-la, configurables entre 1 i 120 minuts.
Les versions sense espais de diagnosi assignats poden desar-se com a esborrany parcial durant
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

### Configuracio d'acces de responsables

L'administracio inclou una pantalla de configuracio global. Inclou l'opcio
`responsible_access_mode`, amb dos valors possibles:

- `all_xtec`: qualsevol compte acabat en `@xtec.cat` pot accedir com a
  responsable.
- `centre_xtec`: només els comptes de centre XTEC poden accedir com a
  responsables.

Els comptes de centre XTEC tenen el format: una lletra inicial `a`, `b`, `c`,
`d` o `e`, seguida de 7 digits i el domini `@xtec.cat`, per exemple
`a0000000@xtec.cat`.

Els administradors actius de l'aplicacio poden accedir com a responsables en
qualsevol dels dos modes. Aquesta excepcio no dona accés a respostes
individuals ni canvia les garanties d'anonimat.

La configuracio també inclou `admin_results_minimum_submissions`, un enter entre
0 i 10. En els resultats globals d'administracio, només es computen les
enquestes amb més respostes que aquest valor. Les enquestes amb un nombre de
respostes igual o inferior al llindar no s'inclouen en els totals, percentatges
ni PDF d'administracio. La pantalla de resultats mostra una frase inicial que
explica el llindar aplicat.

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

### Resultats d'administracio

L'administracio inclou una vista `Resultats`. Inicialment no hi ha cap versio
seleccionada i no es calculen resultats fins que l'administrador tria una
versio del qüestionari. Un cop seleccionada, consulta els resultats agregats de
totes les enquestes respostes amb aquella versio. Aquesta vista només mostra
dades de conjunt: nombre agregat de centres/espais, nombre total de respostes,
percentatges globals, percentatges per bloc, percentatges per pregunta i
distribucions agregades. Si hi ha definit un llindar de respostes mínimes per
computar resultats globals, només s'hi inclouen les enquestes que superen
aquest llindar.

La vista no mostra espais individuals, centres, creadors, docents, timestamps
individuals, `submission_id`, `answer_id` ni combinacions de respostes d'una
mateixa persona. El PDF d'administracio repeteix la mateixa agregacio per
versio i no inclou tokens ni codis publics d'espais.

## Fluxos principals

### Creacio d'espai

Ruta: `/crear`

La persona responsable inicia sessió amb compte XTEC autoritzat. A `main` això es fa amb
Google OAuth mitjançant Supabase Auth. A `migration/mysql` això es fa amb
Google OAuth directe, sense Supabase, o amb mode local provisional de
desenvolupament. Només s'accepten comptes amb correu acabat en `@xtec.cat`;
segons la configuracio global, l'accés de responsables pot quedar limitat als
comptes de centre XTEC. Els administradors actius poden crear i gestionar el
seu espai en qualsevol dels dos modes.
Cada usuari autenticat pot tenir un únic espai anònim. El servidor genera:

- Codi públic llegible amb format `C-7KX9-M2Q8`.
- Token privat llarg i criptograficament segur.

A `migration/mysql`, la capa d'autenticacio és server-side i independent de
Supabase. El mode `AUTH_MODE=google` valida el `id_token` amb Google, exigeix
email `@xtec.cat` i desa a MySQL nomes un identificador opac derivat amb HMAC.
El mode `AUTH_MODE=local` queda com a ajuda de desenvolupament.

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
- No recollida de noms, correus, centre, IP, dispositiu ni respostes obertes.
- Resultats només de conjunt.
- Indicacio que cal respondre una sola vegada.
- Emoji de rellotge amb els minuts estimats necessaris per respondre el
  qüestionari.

Per obrir el formulari, el docent ha d'iniciar sessio amb un compte
`@xtec.cat`. Aquesta sessio no crea un compte de professorat a la base de dades
de l'aplicacio i no es copia el correu a les taules de diagnosi. El servidor
calcula un HMAC server-side per al codi public de l'enquesta i l'usuari
autenticat, i el desa a `submission_locks` per impedir una segona resposta al
mateix enllaç. Aquest HMAC no es desa a `submissions` ni a `answers`.

El docent respon totes les preguntes obligatories de la versio assignada a
l'espai, amb escala:

- `0`: Gens / No ho faig
- `1`: Una mica / Ocasionalment
- `2`: Bastant / Habitualment
- `3`: Molt / Soc un referent al centre

No hi ha camps oberts.

Cada espai de diagnosi admet un màxim de 300 respostes completes. Quan s'arriba
a aquest límit, el formulari ja no accepta nous enviaments i informa que el
qüestionari ha arribat al màxim de respostes.

Quan el servidor accepta l'enviament, també es desa una marca local al navegador
per millorar l'experiencia si la persona torna a obrir el mateix enllaç.

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
- Percentatge global normalitzat a partir de l'escala 0-3.
- Percentatge per bloc.
- Grafica d'aranya i grafica de barres per bloc.
- Percentatge per pregunta.
- Distribucio per pregunta.
- Grafiques apilades amb les quatre opcions.
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
- Totes amb escala `0`, `1`, `2`, `3`.

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
