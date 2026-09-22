# Pla d'implementació

## Estat actual

L'aplicació funciona amb Next.js i MySQL i disposa de:

- qüestionari públic versionat;
- Google OAuth i mode local de desenvolupament;
- creació, gestió i reinici d'un espai per creador;
- enviaments atòmics amb vinculació pseudònima única contra respostes repetides;
- resultats agregats i PDF, i resultats individuals exclusius del docent;
- administració de versions, responsables, administradors, idiomes visibles i
  comunicat global;
- gestió administrativa de centres amb suspensió reversible, reinicis,
  eliminació confirmada i auditoria mínima;
- resultats globals agregats per versió.
- consulta administrativa agregada per a tots els centres o per a un centre
  identificat concret, sempre subjecta al llindar mínim.

La versió 0.5.0 incorpora resultats docents pseudonimitzats sense desar-ne el
nom o el correu i manté els accessos institucionals exclusivament agregats.

La infraestructura d'internacionalització usa catàlegs tipats, selecció
explícita i una cookie funcional. No fa detecció automàtica del navegador i
manté separades les traduccions de la interfície dels qüestionaris versionats.

Queden fora de l'abast actual la infraestructura compartida de rate limiting,
la protecció anti-bots, la retenció automàtica i la política de còpies de seguretat.

## Fase 0 — Governança del repositori

Objectiu: establir un flux de canvis verificable.

- `main` és la branca estable.
- Cada canvi es fa en una branca curta.
- Els commits segueixen Conventional Commits.
- Cada integració passa per Pull Request.
- La CI executa lint, type check, proves i build.
- `CHANGELOG.md` i les versions de l'aplicació segueixen SemVer.

## Fase 1 — Base tècnica

Estat: completada.

- Next.js, TypeScript estricte i Tailwind.
- MySQL 8.4, Drizzle ORM i `mysql2`.
- Variables d'entorn server-side.
- Estructura de proves amb Vitest.

## Fase 2 — Esquema i qüestionari

Estat: completada.

- Esquema MySQL a `lib/db/schema.ts`.
- Migracions Drizzle a `drizzle/`.
- Seed de la versió activa.
- Restriccions de pertinença entre versions.
- Identitat del centre separada de submissions i answers.

## Fase 3 — Criptografia i validació

Estat: completada.

- Codis públics sense caràcters ambigus.
- Tokens aleatoris de 32 bytes.
- HMAC per validar i xifrat per recuperar tokens.
- Esquemes estrictes que rebutgen camps addicionals.

## Fase 4 — Espais i autenticació

Estat: completada.

- Google OAuth amb comptes XTEC per a responsables.
- Mode de prellançament administrable, tancat per defecte i amb bloqueig
  server-side de l'accés dels centres i del professorat.
- Mode local només per desenvolupament.
- Identificadors opacs derivats amb HMAC.
- Un espai per centre o per compte XTEC de prova autoritzat, amb fitxa
  institucional i `centre_id` propis.
- Regeneració de token i reinici transaccional.

## Fase 5 — Submissions

Estat: completada.

- Sessió Google d'un domini admès pel centre requerida per respondre.
- Bloqueig HMAC separat de submissions i answers.
- Validació de totes les preguntes de la versió assignada.
- Valors 0, 1, 2 i 3.
- Límit de 300 respostes.
- Inserció transaccional amb bloqueig de concurrència.

## Fase 6 — Resultats i PDF

Estat: completada.

- Validació de propietat o token al servidor.
- Consultes MySQL agregades.
- Tauler i PDF sense files individuals.
- Token privat només al fragment de l'enllaç i al cos POST.
- Avís metodològic amb poques respostes.

## Fase 7 — Administració

Estat: completada.

- Bootstrap atòmic del primer administrador.
- Invitacions per correu XTEC separades de les respostes.
- Gestió de versions, blocs, preguntes i configuració.
- Edició protegida de versions assignades.
- Resultats globals i PDF agregats per versió.
- Resum inicial agregat de centres i del qüestionari actiu, subjecte al llindar.
- Indicadors accionables, filtres de centres i avisos operatius del resum.
- Llista i fitxa administrativa de centres sense dades individuals.
- Suspensió i reactivació de centres.
- Reinici de respostes, reinici complet i eliminació transaccionals.
- Registre mínim de les actuacions administratives.

## Fase 8 — Enduriment pendent

- Substituir el rate limiting local en memòria per un servei compartit sense
  desar IPs ni correus a la base de dades de diagnosis.
- Definir protecció anti-bots compatible amb la minimització de dades.
- Aprovar política de retenció i eliminació automàtica.
- Definir caducitat automàtica d'espais.
- Fer revisió legal o DPO.
- Definir infraestructura, còpies de seguretat i recuperació.

## Fase 9 — Centres identificats

- Crear `centres` i `centre_accounts`.
- Associar un únic espai a cada centre.
- Consultar Dades Obertes per a tots els responsables autoritzats que creen
  espais, també els comptes XTEC de prova.
- Incorporar i atribuir la font de serveis educatius.
- Mostrar la fitxa i el nom del centre a totes les superfícies específiques del
  centre.
- Conservar espais de prova per a administradors en qualsevol mode i per a
  responsables XTEC no oficials quan estigui actiu `all_xtec`, amb fitxa
  institucional i estat de Dades Obertes.
- Mantenir la identitat del professorat fora de la base de dades.
- Afegir l'alta guiada de confirmació de fitxa i configuració dels dominis
  docents.
- Permetre triar exclusivament entre `@xtec.cat` o un domini propi exacte de
  Google Workspace.
- Validar el domini després de l'OAuth i novament dins la transacció de
  resposta, sense persistir el correu docent.

Cada canvi d'aquesta fase ha d'actualitzar els documents normatius, afegir
proves i superar la checklist de privacitat.

## Fase 10 — Resultats docents pseudonimitzats

Estat: implementada.

- Substituir `submission_locks` per `participant_submissions` com a font única
  de propietat i prevenció de duplicats.
- Eliminar explícitament les respostes de prova durant la migració, amb còpia
  de seguretat prèvia i sense tocar dades estructurals.
- Afegir accés docent per codi sense comprovació pública d'existència.
- Afegir àrea docent, resultat propi i PDF sota demanda.
- Permetre consultar participacions pròpies d'espais tancats i eliminar-les en
  cascada en reiniciar o eliminar l'espai.
- Mantenir les superfícies de centre i administració exclusivament agregades.

## Fase 11 — Respostes configurables per pregunta

Estat: implementada.

- Afegir quatre opcions administrables amb puntuacions fixes `0–3` a cada
  pregunta i validar-ne longitud, unicitat i completitud al servidor.
- Fer que el client enviï `optionId` i derivar la puntuació dins la transacció.
- Permetre ordre aleatori per pregunta amb colors neutres, estable durant cada
  emplenament.
- Mantenir resultats i informes ordenats per puntuació.
- Fixar un idioma per versió i usar-lo als informes sense traduir preguntes ni
  respostes.
- Migrar les opcions històriques sense alterar respostes existents.

## Qualitat obligatòria

Abans d'integrar qualsevol canvi:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

També cal revisar el diff, cercar secrets i confirmar que no s'han introduït
dades identificatives ni endpoints individuals.
