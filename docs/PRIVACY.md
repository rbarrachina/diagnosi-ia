# Privacitat i pseudonimització

## Principi rector

Diagnosi IA identifica el centre promotor i minimitza les dades del professorat.
El centre no és anònim davant l'aplicacio ni davant l'administracio autoritzada.
No es desen el nom ni el correu del professorat, però cada participació queda
vinculada a un identificador opac derivat del compte Google. Aquesta dada és
personal i pseudonimitzada: permet recuperar els resultats propis, però no es
mostra al centre ni a l'administració.

## Dades prohibides

No es pot recollir ni desar del professorat participant:

- nom o cognoms;
- correu electrònic;
- comptes o perfils docents amb nom o correu a la base de dades de diagnosi;
- identificadors proporcionats pel navegador o hashes simples del correu;
- IP, user agent o informació del dispositiu;
- respostes obertes.

## Dades estrictament permeses

- Codi, nom oficial, municipi, àrea territorial i servei educatiu del centre.
- Identificador opac, correu XTEC i nom visible del compte responsable.
- Identificador opac dels administradors.
- Nom visible, correu XTEC i darrera entrada només dels administradors.
- Correus XTEC d'invitacions d'administració, separats de les respostes.
- Configuració global no personal.
- Estat global de prellançament o obertura de l'accés dels centres.
- Registre mínim d'actuacions administratives sobre centres, sense dades ni
  identificadors de participants.
- Codi públic de l'espai.
- HMAC i valor xifrat del token privat.
- Versió i estat del qüestionari.
- Submissions i respostes tancades amb identificadors tècnics.
- Identificador opac derivat del `sub` de Google amb HMAC, exclusivament a la
  vinculació `participant_submissions`.
- Timestamps tècnics que només es mostren al participant propietari quan formen
  part de la data de realització.

## Separació d'identitats

Els responsables s'autentiquen per gestionar l'espai del centre. La seva
identitat institucional no s'uneix amb `submissions` o `answers`.

Quan el mode de proves admet qualsevol compte XTEC, el compte docent que actua
com a responsable es desa exclusivament a `centres` i `centre_accounts` per
gestionar el seu espai de prova. Aquesta funció de responsable no identifica
els docents que participen en el qüestionari ni es relaciona amb les seves
respostes.

El professorat inicia sessió amb Google. El servidor usa el correu
transitòriament per validar el domini durant el primer accés i deriva del `sub`
un identificador opac amb HMAC. `participant_submissions` vincula aquest
identificador amb una única submission per espai; no conté correu, nom, domini,
IP ni metadades de dispositiu.

Cada centre ha de triar entre `@xtec.cat` o un domini propi exacte. Les dues
opcions no es poden activar alhora, fet que evita que una mateixa persona pugui
respondre amb dos comptes de dominis admesos diferents sense haver de relacionar
identitats docents.

Els administradors no són anònims. Les seves dades identificatives queden
limitades a `admin_users` i `admin_email_invitations` i no poden servir per
filtrar o relacionar resultats.

## Accés a les dades

El navegador no té accés directe a MySQL. Tota lectura o escriptura passa per
codi server-side amb validació de sessió, rol, propietat, token i payload.

Els repositoris sensibles no s'importen des de components client. Els endpoints
de centre i administració no poden retornar files individuals. Les rutes docents
només poden retornar la participació pròpia, determinada per la sessió al servidor.

## Token privat

- Té com a mínim 32 bytes aleatoris.
- Es genera amb una font criptogràficament segura.
- Es desa com HMAC per validar-lo.
- Es desa xifrat només si el creador l'ha de recuperar.
- No es desa en text pla.
- No apareix en query strings, logs, errors o PDFs.

Format:

```text
/resultats/compartit/[publicCode]#token=[privateToken]
```

La pàgina llegeix el fragment, l'elimina visualment i envia el token per POST.

## Submissions

La creació és transaccional. El servidor torna a validar el domini docent vigent
del centre, l'espai, la versió, totes les preguntes, els valors 0-3, la
vinculació única i el límit de 300 respostes.

`submissions` no conté usuari, correu, IP o dispositiu. `answers` només conté
les claus tècniques i el valor tancat. La vinculació separada és l'única font
de veritat per impedir duplicats i recuperar la participació.

## Resultats individuals del docent

El docent autenticat pot veure les seves respostes, puntuació global i per
blocs, data, centre i versió, i generar un PDF propi. La consulta sempre filtra
per l'identificador de la sessió; el navegador no decideix el propietari ni rep
`participant_user_id` o `submission_id`. No hi ha comparacions, interpretacions
noves ni dades alienes. El centre, el responsable, l'administració i l'enllaç
privat continuen rebent només agregats.

En aquesta fase no hi ha eliminació directa pel docent. Les sol·licituds de
supressió requereixen un procediment administratiu. La participació es conserva
mentre existeix l'espai i s'elimina en reiniciar-lo o eliminar-lo. La durada de
les còpies de seguretat és una decisió d'infraestructura pendent i no es pot
afirmar que la supressió de la base activa les purgui immediatament.

## Resultats agregats

El tauler i el PDF poden mostrar:

- total de respostes;
- percentatge global;
- percentatges per bloc i pregunta;
- distribucions agregades;
- resultats globals agregats per versió;
- resultats agregats d'un centre identificat concret quan supera el llindar
  administratiu;
- nombre agregat d'espais inclosos.

No poden mostrar:

- files o identificadors individuals;
- dates o hores de cada resposta;
- combinacions de respostes d'una persona;
- llistes o codis d'espais en resultats globals;
- participants o comptes;
- token privat.

Les consultes agrupen directament a MySQL per pregunta i valor. El servidor no
carrega conjunts de respostes individuals per construir el tauler o el PDF.

## Poques respostes

No hi ha un mínim fix per consultar els resultats d'un espai. Amb menys de cinc
respostes es mostra un avís de prudència. No es poden afegir filtres que
augmentin el risc de reidentificació.

Els resultats d'administració exclouen els centres que no superen el llindar
configurat. Quan se selecciona un centre concret que no el supera, no se'n
mostren el recompte exacte, els percentatges ni les distribucions.

El resum inicial d'administració només mostra totals agregats. Les respostes
computables totals i les del qüestionari actiu exclouen tots els centres que no
superen el mateix llindar; no s'hi mostra cap desglossament de respostes per
centre.
Els indicadors i avisos poden obrir llistes institucionals filtrades, però no
afegeixen cap dimensió als resultats ni revelen recomptes de respostes que no
superin el llindar.

## Administració

L'administració pot gestionar qüestionaris, configuració i administradors. Pot
consultar resultats agregats de tots els centres o d'un centre identificat
concret, sempre amb el llindar administratiu aplicat. Pot mostrar el nom, el
codi oficial i el municipi del centre seleccionat.

La gestió de centres pot mostrar la fitxa institucional, el correu i darrer
accés del responsable, els dominis autoritzats, l'estat del qüestionari i un
recompte agregat subjecte al llindar. Pot suspendre l'accés o eliminar dades de
manera transaccional. El registre d'aquestes actuacions només conté identitat
administrativa, centre, tipus d'acció, data i recompte afectat; no conté
respostes ni identitat docent.

No pot veure o exportar respostes individuals ni filtrar resultats per espai,
responsable, docent, data, compte o cap característica personal. No pot afegir
altres dimensions al filtre de centre que facilitin la identificació indirecta
del professorat.

Una versió activa o amb respostes només permet correccions textuals que
mantinguin identificadors i estructura. Els canvis estructurals exigeixen una
versió nova.

Eliminar una versió no activa pot eliminar dades pseudonimitzades dependents després
d'una confirmació explícita, però no pot mostrar-les, exportar-les o
retornar-les abans d'esborrar.

## Logs i errors

No es registren tokens, payloads complets, respostes, correus de participants,
IP o informació de dispositiu. Els missatges visibles no revelen si existeix un
codi, token o compte concret.

## Exportacions

Les exportacions permeses són el PDF agregat per als rols institucionals i el
PDF individual exclusivament per al docent propietari autenticat. Aquest últim
es genera sota demanda, no es desa i no conté identitat ni identificadors.

## Riscos pendents

- El límit d'intents local en memòria només és adequat per a desenvolupament;
  cal un magatzem compartit per a producció distribuïda.
- Política de retenció i eliminació automàtica.
- Durada i purga de les còpies de seguretat.
- Caducitat automàtica d'espais.
- Revisió legal o DPO per a ús institucional.
