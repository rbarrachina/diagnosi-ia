# Privacitat i anonimat

## Principi rector

Diagnosi IA minimitza dades. Els espais no identifiquen centres, les respostes
no identifiquen docents i els resultats només existeixen en conjunt.

## Dades prohibides

No es pot recollir ni desar del professorat participant:

- nom o codi del centre;
- nom o cognoms;
- correu electrònic;
- comptes o perfils a la base de dades de diagnosi;
- identificadors personals;
- IP, user agent o informació del dispositiu;
- respostes obertes.

No es pot crear una taula `centres`.

## Dades estrictament permeses

- Identificador opac del creador.
- Identificador opac dels administradors.
- Nom visible, correu XTEC i darrera entrada només dels administradors.
- Correus XTEC d'invitacions d'administració, separats de les respostes.
- Configuració global no personal.
- Codi públic anònim de l'espai.
- HMAC i valor xifrat del token privat.
- Versió i estat del qüestionari.
- Submissions i respostes tancades amb identificadors tècnics.
- Bloquejos HMAC separats contra respostes repetides.
- Timestamps tècnics que no es mostren ni s'exporten.

## Separació d'identitats

Els creadors s'autentiquen per gestionar el seu espai. El seu identificador opac
no s'uneix amb `submissions` o `answers`.

El professorat inicia sessió amb un compte XTEC només per impedir una segona
resposta al mateix espai. El servidor deriva un HMAC i no desa el correu, nom o
perfil. `submission_locks` no conté `submission_id` ni respostes.

Els administradors no són anònims. Les seves dades identificatives queden
limitades a `admin_users` i `admin_email_invitations` i no poden servir per
filtrar o relacionar resultats.

## Accés a les dades

El navegador no té accés directe a MySQL. Tota lectura o escriptura passa per
codi server-side amb validació de sessió, rol, propietat, token i payload.

Els repositoris sensibles no s'importen des de components client. Cap endpoint
pot retornar files individuals de `submissions` o `answers`.

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

La creació és transaccional. El servidor valida l'espai, la versió, totes les
preguntes, els valors 0-3, els duplicats, el bloqueig HMAC i el límit de 300
respostes.

`submissions` no conté usuari, correu, IP o dispositiu. `answers` només conté
les claus tècniques i el valor tancat.

## Resultats agregats

El tauler i el PDF poden mostrar:

- total de respostes;
- percentatge global;
- percentatges per bloc i pregunta;
- distribucions agregades;
- resultats globals agregats per versió;
- nombre agregat d'espais inclosos.

No poden mostrar:

- files o identificadors individuals;
- dates o hores de cada resposta;
- combinacions de respostes d'una persona;
- llistes o codis d'espais en resultats globals;
- creadors, participants o comptes;
- token privat.

Les consultes agrupen directament a MySQL per pregunta i valor. El servidor no
carrega conjunts de respostes individuals per construir el tauler o el PDF.

## Poques respostes

No hi ha un mínim fix per consultar els resultats d'un espai. Amb menys de cinc
respostes es mostra un avís de prudència. No es poden afegir filtres que
augmentin el risc de reidentificació.

Els resultats globals d'administració poden excloure espais que no superin el
llindar configurat, sense revelar quins espais han estat exclosos.

## Administració

L'administració pot gestionar qüestionaris, configuració i administradors, però
no pot veure o exportar respostes individuals ni filtrar per centre, espai,
creador, docent, data o compte.

Una versió activa o amb respostes només permet correccions textuals que
mantinguin identificadors i estructura. Els canvis estructurals exigeixen una
versió nova.

Eliminar una versió no activa pot eliminar dades anònimes dependents després
d'una confirmació explícita, però no pot mostrar-les, exportar-les o
retornar-les abans d'esborrar.

## Logs i errors

No es registren tokens, payloads complets, respostes, correus de participants,
IP o informació de dispositiu. Els missatges visibles no revelen si existeix un
codi, token o compte concret.

## Exportacions

L'única exportació de resultats és el PDF agregat. Qualsevol nova exportació
requereix una revisió explícita de privacitat.

## Riscos pendents

- Rate limiting i protecció anti-bots.
- Política de retenció i eliminació.
- Caducitat o tancament d'espais.
- Revisió legal o DPO per a ús institucional.
