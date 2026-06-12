# Pla d'implementació

El pla està dividit en fases petites i verificables. No s'hauria de començar una fase si els criteris de la fase anterior no estan validats.

## Estat actual

- Fase 1 completada: bootstrap tècnic.
- Fase 2 completada: esquema Supabase, seed del qüestionari, restriccions i RLS.
- Fase 3 implementada en aquest canvi: criptografia, creació d'espais, formulari públic i submissions atomiques.
- Fase 4 implementada en aquest canvi: resultats de conjunt, validació de token de resultats, gràfiques web i PDF.
- Gestio de creador implementada: un únic espai per usuari autenticat,
  recuperació d'enllaç privat i reinici d'espai amb rotació d'enllaços i
  assignacio de la versio activa.
- Nova fase prevista: administracio global del qüestionari versionat i dels
  administradors.
- Fora d'abast actual: rate limiting, anti-bots, retenció de dades i tancament d'espais.

## Fase 0: Validacio documental

Objectiu:

- Revisar que producte, privacitat, arquitectura i base de dades són coherents abans d'escriure codi.

Fitxers:

- `README.md`
- `AGENTS.md`
- `.env.example`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/IMPLEMENTATION_PLAN.md`

Criteris d'acceptacio:

- No es proposa ni es crea cap taula `centres`.
- La taula principal és `diagnostic_spaces`.
- Les rutes previstes estan documentades.
- El token privat només apareix com fragment `#token=`.
- Els resultats estan definits com a resultats de conjunt.
- `.env.example` no conté secrets reals.

Proves:

- Revisio manual de documents.
- Cerca textual de termes prohibits abans de codificar.

Riscos o decisions pendents:

- Aprovar el llindar d'avís de poques respostes.
- Decidir `zod` o validació manual.
- Decidir RPC SQL o connexió `pg` per transaccions.
- Administracio aprovada com a nou abast: només pot gestionar qüestionaris i
  administradors, no respostes individuals.
- Regla aprovada per correccions menors: una versio assignada a espais es pot
  editar només després d'un avís i confirmacio explícita. Si està activa o ja té
  respostes, només es poden corregir títols i textos mantenint l'estructura.
- Els esborranys sense espais assignats poden tenir estructura parcial durant
  l'edició; poden arribar a 10 blocs i 10 preguntes per bloc, i l'activacio
  exigeix almenys 1 bloc amb almenys 1 pregunta per bloc.

## Fase 1: Bootstrap tècnic

Objectiu:

- Crear el projecte Next.js amb TypeScript estricte, Tailwind i estructura base.

Fitxers:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `app/layout.tsx`
- `app/page.tsx`
- `.env.example`
- `.gitignore`

Criteris d'acceptacio:

- `strict: true` a TypeScript.
- `.env.example` no conté secrets reals.
- La pagina inicial compila.
- No hi ha clients Supabase amb service role en codi client.

Proves:

- `npm run lint`
- `npm run build`

Riscos o decisions pendents:

- Escollir gestor de paquets.
- Confirmar versions exactes de Next.js i React.

## Fase 2: Base de dades i seed del qüestionari

Objectiu:

- Crear migracions Supabase i seed del qüestionari.

Fitxers:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/seed.sql`
- `docs/DATABASE_SCHEMA.md` si cal ajustar decisions

Criteris d'acceptacio:

- Existeixen `questionnaires`, `question_blocks`, `questions`, `diagnostic_spaces`, `submissions`, `answers`.
- No existeix `centres`.
- RLS està activat a totes les taules.
- No hi ha polítiques públiques de lectura per `diagnostic_spaces`, `submissions`, `answers`.
- El seed crea 5 blocs i 20 preguntes per a la versió activa del qüestionari.

Proves:

- Aplicar migracions en entorn local Supabase.
- Executar consultes de comprovacio de recompte.
- Test de consistencia del seed si s'afegeix harness de tests.

Riscos o decisions pendents:

- Definir el text definitiu de les 20 preguntes.
- Decidir quan una correccio sobre versions assignades requereix nova versio.

## Fase 3: Criptografia i validació

Objectiu:

- Implementar generació de codis, tokens i esquemes de validació.

Fitxers:

- `lib/crypto/públic-code.ts`
- `lib/crypto/private-token.ts`
- `lib/validation/schemas.ts`
- `tests/crypto.test.ts`
- `tests/validation.test.ts`

Criteris d'acceptacio:

- Els codis tenen 8 caràcters útils i format `C-XXXX-XXXX`.
- L'alfabet exclou `0`, `O`, `1`, `I`, `L`.
- No s'usa `Math.random()`.
- Els tokens tenen com a mínim 32 bytes aleatoris.
- El token es desa només com HMAC o hash amb secret.
- Els esquemes rebutgen camps addicionals.

Proves:

- `npm test -- crypto`
- `npm test -- validation`
- `npm run lint`

Riscos o decisions pendents:

- Confirmar estrategia de comparacio segura compatible amb runtime Node de Vercel.
- Confirmar si el projecte usara Node runtime per endpoints de PDF i crypto.

Estat: implementada amb `crypto.randomInt`, `crypto.randomBytes`, HMAC-SHA256 i esquemes `zod` estrictes.

## Fase 4: Creacio d'espais

Objectiu:

- Implementar `/crear` i `POST /api/spaces`.

Fitxers:

- `app/crear/page.tsx`
- `app/api/spaces/route.ts`
- `lib/database/server.ts`
- `lib/spaces/create-space.ts`
- `tests/spaces.test.ts`

Criteris d'acceptacio:

- Es crea un espai anònim amb autenticació OAuth XTEC del creador.
- Cada creador autenticat pot tenir com a màxim un espai.
- Es retorna codi públic, enllaç públic i enllaç privat amb fragment.
- El token privat no queda desat en text pla.
- Les col·lisions de `public_code` es reintenten.
- No es registra el token.
- Si l'usuari ja té un espai, la UI el deriva a la gestio de l'espai existent.
- El reinici elimina respostes anònimes, conserva propietari i espai, assigna
  la versio activa, i regenera codi públic i token privat.

Proves:

- `npm test -- spaces`
- Prova manual de creació a `/crear`.
- `npm run build`

Riscos o decisions pendents:

- Tractament UX si la persona perd l'enllaç privat.
- Nombre màxim de reintents per col·lisió.

Estat: implementada. El nombre màxim actual de reintents per col·lisió és 8.

## Fase 5: Formulari públic i submissions

Objectiu:

- Implementar `/q/[publicCode]` i `POST /api/submissions`.

Fitxers:

- `app/q/[publicCode]/page.tsx`
- `components/questionnaire/*`
- `app/api/submissions/route.ts`
- `lib/questionnaire/load-questionnaire.ts`
- `lib/submissions/create-submission.ts`
- `supabase/migrations/0002_submission_rpc.sql` si s'usa RPC
- `tests/submissions.test.ts`

Criteris d'acceptacio:

- El formulari mostra els avisos d'anonimat i tractament de les dades en conjunt.
- Totes les preguntes de la versio assignada són obligatories.
- El servidor valida exactament una resposta per cada pregunta de la versio
  assignada.
- El servidor rebutja duplicats, valors fora de rang i camps inesperats.
- L'espai ha d'existir i estar actiu.
- L'espai no pot superar 300 submissions completes.
- La inserció de submission i answers és atòmica.

Proves:

- `npm test -- submissions`
- Proves manuals amb payload vàlid i payloads invàlids.
- `npm run lint`
- `npm run build`

Riscos o decisions pendents:

- No hi ha mecanisme fort per garantir "una sola vegada" sense identificar persones. Cal comunicar-ho com instrucció, no com garantia tècnica.
- Anti-bots queda per fase 2 del producte.

Estat: implementada amb RPC PostgreSQL `public.create_submission_with_answers` i Route Handler server-side. La RPC limita cada espai a 300 submissions completes.

## Fase 6: Agregacio i resultats web

Objectiu:

- Implementar validació de token, càlcul de resultats de conjunt i tauler de resultats.

Fitxers:

- `app/resultats/[publicCode]/page.tsx`
- `components/results/*`
- `app/api/results/route.ts`
- `lib/results/get-results.ts`
- `lib/aggregation/calculate-results.ts`
- `tests/aggregation.test.ts`
- `tests/results-auth.test.ts`

Criteris d'acceptacio:

- La pagina llegeix `#token=` al navegador i fa `POST`.
- El token no es mostra ni s'inclou en query params.
- El servidor valida el token.
- La resposta conté només dades de conjunt.
- El tauler mostra codi, versió, total, mitjana global, blocs, preguntes, distribucions i interpretació.
- Amb poques respostes mostra avís de prudència.
- No mostra submissions, timestamps individuals ni combinacions per persona.

Proves:

- `npm test -- aggregation`
- `npm test -- results-auth`
- Prova manual amb token vàlid i invàlid.
- `npm run build`

Riscos o decisions pendents:

- Definir textos d'interpretació exactes.
- Rate limiting i proteccio anti-bots continuen fora d'abast d'aquesta fase.

Estat: implementada. PostgreSQL calcula els recomptes agregats amb la RPC server-only `public.get_diagnostic_answer_counts(uuid)` i TypeScript construeix el model final del tauler i del PDF a partir d'aquests totals. No es carreguen files individuals d'`answers` per generar resultats.

## Fase 7: Informe PDF

Objectiu:

- Generar PDF de conjunt server-side després de validar token.

Fitxers:

- `app/api/reports/pdf/route.ts`
- `lib/pdf/report-document.tsx`
- `lib/pdf/render-report.ts`
- `components` o helpers compartits per dades de conjunt
- `tests/pdf.test.ts`

Criteris d'acceptacio:

- El PDF es genera només amb token vàlid.
- Inclou títol, codi anònim, versió, data, nombre de respostes, escala, gràfiques, fortaleses, millores, nota metodològica i avís.
- No inclou token, dades personals ni respostes individuals.
- La generació funciona a runtime server compatible amb Vercel.

Proves:

- `npm test -- pdf`
- Prova manual de descarrega.
- Revisio visual del PDF.
- `npm run build`

Riscos o decisions pendents:

- Limitacions de `@react-pdf/renderer` amb gràfiques complexes.
- Pot caldre renderitzar gràfiques simplificades directament en PDF en lloc de reutilitzar Recharts.

Estat: implementada amb gràfiques simplificades directament al PDF.

## Fase 8: Enduriment de seguretat i qualitat

Objectiu:

- Revisio final de privacitat, seguretat i qualitat abans de desplegar.

Fitxers:

- `README.md`
- `docs/PRIVACY.md`
- `docs/ARCHITECTURE.md`
- tests addicionals
- configuració Vercel/Supabase documentada

Criteris d'acceptacio:

- Cap secret exposat al client.
- Cap endpoint sensible accepta camps addicionals.
- RLS activat.
- No hi ha polítiques públiques indegudes.
- No hi ha exportacio individual.
- Els logs no contenen tokens.
- Documentacio d'execució completa.

Proves:

- `npm run lint`
- `npm test`
- `npm run build`
- Revisio manual de variables d'entorn.
- Revisio manual de payloads de xarxa.

Riscos o decisions pendents:

- Rate limiting.
- Proteccio anti-bots.
- Monitoratge sense dades personals.
- Politica de retenció.
- Procediment d'esborrat d'espais.

## Fase 8A: Administracio del qüestionari

Objectiu:

- Afegir una administracio global per gestionar versions, blocs, preguntes i
  administradors sense exposar respostes individuals ni dades identificatives.

Fitxers:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `supabase/migrations/*_add_questionnaire_admin.sql`
- `app/admin/**`
- `app/api/admin/**` si cal una API HTTP separada de la UI
- `lib/admin/**`
- `lib/questionnaire/**`
- `lib/validation/schemas.ts`
- `tests/admin*.test.ts`
- `tests/questionnaire*.test.ts`

Criteris d'acceptacio:

- Existeix una autoritzacio explicita d'administradors separada dels creadors
  d'espais.
- L'accés d'administracio requereix OAuth i usuari administrador actiu.
- Es poden crear noves versions del qüestionari.
- La creació de versio usa un únic formulari amb opcio d'esborrany en blanc o
  copia d'una versio existent.
- El títol de cada versio és obligatori i únic.
- Es poden gestionar blocs i preguntes tancades fins a 10 blocs i 10 preguntes
  per bloc, mantenint valors `0`, `1`, `2`.
- Es pot activar una versio concreta i només una versio queda activa.
- Es pot eliminar una versio no activa amb avís i confirmacio explícita; això
  elimina també espais, respostes, blocs i preguntes associats.
- Les correccions in-place sobre versions assignades exigeixen un avís i una
  confirmacio explícita.
- Si una versio està activa o ja té respostes, l'API rebutja canvis d'estructura
  i només permet corregir títols i textos existents.
- L'activacio d'una nova versio no modifica els espais ja creats ni les
  submissions existents.
- Cap endpoint d'administracio retorna files individuals de `submissions` o
  `answers`.
- Si la UI usa server actions en comptes de Route Handlers, les accions han de
  validar sessio, rol i payload al servidor amb les mateixes garanties.
- No es desa ni es mostra cap nom de centre, codi de centre, nom de docent,
  email de participant, IP, user agent ni informació de dispositiu.

Proves:

- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- Tests de migració per RLS i permisos d'administrador.
- Tests de validació per crear versions, editar versions sense espais assignats,
  exigir confirmacio en versions assignades i rebutjar canvis d'estructura quan
  ja hi ha respostes.
- Tests d'activacio per garantir una única versio activa.
- Revisio manual del diff per comprovar que no s'exposen secrets ni dades
  identificatives.

Riscos o decisions pendents:

- Bootstrap inicial definit: el primer usuari autenticat `@xtec.cat` que
  accedeix correctament a `/admin` esdevé administrador si `admin_users` és
  buida. La insercio s'ha de fer server-side i només ha de desar el seu
  `auth.users.id`.
- Crear un espai de diagnosi no concedeix permisos d'administracio.
- El bootstrap automàtic del primer administrador ha de ser atòmic, amb RPC o
  bloqueig transaccional, per evitar que dos primers logins simultanis a
  `/admin` obtinguin el rol.
- La gestio d'administradors queda limitada inicialment a `auth.users.id`. Si
  cal mostrar correus, s'han de llegir server-side de Supabase Auth sense
  duplicar-los a la base de dades de l'aplicacio.
- Decidir si es vol conservar historial d'activacions de versions. Si es fa,
  ha de ser historial de metadades, mai de respostes individuals.

Estat parcial:

- Implementada la taula `admin_users`.
- Implementada lectura RLS de metadades per administradors actius.
- Implementades RPCs server-only per bootstrap, crear esborranys, copiar
  versions, reemplaçar contingut i activar versions.
- Implementats serveis server-side `lib/admin/auth.ts`,
  `lib/admin/questionnaires.ts` i `lib/admin/admin-users.ts`.
- Implementada la ruta `/admin` amb llista de versions, editor de
  blocs/preguntes, activacio amb confirmacio i gestio d'administradors per
  `auth.users.id`.
- Pendent: endpoints `app/api/admin/**` només si cal consumir aquestes
  operacions fora de la UI.

## Fase 9: Desplegament

Objectiu:

- Desplegar a Vercel amb Supabase configurat.

Fitxers:

- Documentacio de desplegament al `README.md`
- Configuracio de variables a Vercel
- Migracions aplicades a Supabase

Criteris d'acceptacio:

- L'app desplegada pot crear espais.
- L'enllaç públic accepta respostes.
- L'enllaç privat mostra resultats de conjunt.
- El PDF es descarrega.
- Cap taula sensible es pot llegir públicament.

Proves:

- Smoke test complet en producció.
- Test de token invàlid.
- Test de codi inexistent.
- Verificacio de RLS amb clau anon.

Riscos o decisions pendents:

- Configurar backups i retenció a Supabase.
- Revisar límits de Vercel per generació PDF.

## Incoherències o decisions a revisar abans de programar

1. "Cal respondre una sola vegada" no es pot garantir tècnicament sense algun identificador, cookie, login, IP o fingerprint. Per preservar l'anonimat, s'ha de tractar com una instrucció de bon ús, no com una restricció forta.
2. Mostrar resultats des de la primera resposta és coherent amb el requisit, però augmenta el risc interpretatiu. La mitigació mínima és l'avís de prudència; es podria revisar si cal ocultar algunes distribucions amb volums molt baixos.
3. Els timestamps de submissions no estan prohibits explícitament, però no s'han de mostrar. Si es vol maximitzar anonimat, es pot considerar no desar-los o truncar-los.
4. Cal decidir aviat si les transaccions es faran amb RPC SQL a Supabase o amb connexió Postgres directa. Aquesta decisió afecta dependències, tests i desplegament.
5. El text exacte de les 20 preguntes encara s'ha de definir i revisar abans del seed.
