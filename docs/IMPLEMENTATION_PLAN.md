# Pla d'implementacio

El pla esta dividit en fases petites i verificables. No s'hauria de comencar una fase si els criteris de la fase anterior no estan validats.

## Fase 0: Validacio documental

Objectiu:

- Revisar que producte, privacitat, arquitectura i base de dades son coherents abans d'escriure codi.

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
- La taula principal es `diagnostic_spaces`.
- Les rutes previstes estan documentades.
- El token privat nomes apareix com fragment `#token=`.
- Els resultats estan definits com agregats.
- `.env.example` no conte secrets reals.

Proves:

- Revisio manual de documents.
- Cerca textual de termes prohibits abans de codificar.

Riscos o decisions pendents:

- Aprovar el llindar d'avis de poques respostes.
- Decidir `zod` o validacio manual.
- Decidir RPC SQL o connexio `pg` per transaccions.

## Fase 1: Bootstrap tecnic

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
- `.env.example` no conte secrets reals.
- La pagina inicial compila.
- No hi ha clients Supabase amb service role en codi client.

Proves:

- `npm run lint`
- `npm run build`

Riscos o decisions pendents:

- Escollir gestor de paquets.
- Confirmar versions exactes de Next.js i React.

## Fase 2: Base de dades i seed del questionari

Objectiu:

- Crear migracions Supabase i seed del questionari `2026.1`.

Fitxers:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/seed.sql`
- `docs/DATABASE_SCHEMA.md` si cal ajustar decisions

Criteris d'acceptacio:

- Existeixen `questionnaires`, `question_blocks`, `questions`, `diagnostic_spaces`, `submissions`, `answers`.
- No existeix `centres`.
- RLS esta activat a totes les taules.
- No hi ha politiques publiques de lectura per `diagnostic_spaces`, `submissions`, `answers`.
- El seed crea 5 blocs i 20 preguntes per a `2026.1`.

Proves:

- Aplicar migracions en entorn local Supabase.
- Executar consultes de comprovacio de recompte.
- Test de consistencia del seed si s'afegeix harness de tests.

Riscos o decisions pendents:

- Definir el text definitiu de les 20 preguntes.
- Decidir com impedir tecnicament l'edicio de versions amb respostes.

## Fase 3: Criptografia i validacio

Objectiu:

- Implementar generacio de codis, tokens i esquemes de validacio.

Fitxers:

- `lib/crypto/public-code.ts`
- `lib/crypto/private-token.ts`
- `lib/validation/schemas.ts`
- `tests/crypto.test.ts`
- `tests/validation.test.ts`

Criteris d'acceptacio:

- Els codis tenen 8 caracters utils i format `C-XXXX-XXXX`.
- L'alfabet exclou `0`, `O`, `1`, `I`, `L`.
- No s'usa `Math.random()`.
- Els tokens tenen minim 32 bytes aleatoris.
- El token es desa nomes com HMAC o hash amb secret.
- Els esquemes rebutgen camps addicionals.

Proves:

- `npm test -- crypto`
- `npm test -- validation`
- `npm run lint`

Riscos o decisions pendents:

- Confirmar estrategia de comparacio segura compatible amb runtime Node de Vercel.
- Confirmar si el projecte usara Node runtime per endpoints de PDF i crypto.

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

- Es crea un espai anonim sense autenticacio.
- Es retorna codi public, enllac public i enllac privat amb fragment.
- El token privat no queda desat en text pla.
- Les col.lisions de `public_code` es reintenten.
- No es loga el token.

Proves:

- `npm test -- spaces`
- Prova manual de creacio a `/crear`.
- `npm run build`

Riscos o decisions pendents:

- Tractament UX si la persona perd l'enllac privat.
- Nombre maxim de reintents per col.lisio.

## Fase 5: Formulari public i submissions

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

- El formulari mostra els avisos d'anonimat i us agregat.
- Totes les 20 preguntes son obligatories.
- El servidor valida exactament 20 respostes.
- El servidor rebutja duplicats, valors fora de rang i camps inesperats.
- L'espai ha d'existir i estar actiu.
- La insercio de submission i answers es atomica.

Proves:

- `npm test -- submissions`
- Proves manuals amb payload valid i payloads invalids.
- `npm run lint`
- `npm run build`

Riscos o decisions pendents:

- No hi ha mecanisme fort per garantir "una sola vegada" sense identificar persones. Cal comunicar-ho com instruccio, no com garantia tecnica.
- Anti-bots queda per fase 2 del producte.

## Fase 6: Agregacio i resultats web

Objectiu:

- Implementar validacio de token, calcul d'agregats i tauler de resultats.

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
- La resposta conte nomes agregats.
- El tauler mostra codi, versio, total, mitjana global, blocs, preguntes, distribucions i interpretacio.
- Amb poques respostes mostra avis de prudencia.
- No mostra submissions, timestamps individuals ni combinacions per persona.

Proves:

- `npm test -- aggregation`
- `npm test -- results-auth`
- Prova manual amb token valid i invalid.
- `npm run build`

Riscos o decisions pendents:

- Definir textos d'interpretacio exactes.
- Decidir si els agregats es calculen en SQL o TypeScript.

## Fase 7: Informe PDF

Objectiu:

- Generar PDF agregat server-side despres de validar token.

Fitxers:

- `app/api/reports/pdf/route.ts`
- `lib/pdf/report-document.tsx`
- `lib/pdf/render-report.ts`
- `components` o helpers compartits per dades agregades
- `tests/pdf.test.ts`

Criteris d'acceptacio:

- El PDF es genera nomes amb token valid.
- Inclou titol, codi anonim, versio, data, nombre de respostes, escala, grafiques, fortaleses, millores, nota metodologica i avis.
- No inclou token, dades personals ni respostes individuals.
- La generacio funciona a runtime server compatible amb Vercel.

Proves:

- `npm test -- pdf`
- Prova manual de descarrega.
- Revisio visual del PDF.
- `npm run build`

Riscos o decisions pendents:

- Limitacions de `@react-pdf/renderer` amb grafiques complexes.
- Pot caldre renderitzar grafiques simplificades directament en PDF en lloc de reutilitzar Recharts.

## Fase 8: Enduriment de seguretat i qualitat

Objectiu:

- Revisio final de privacitat, seguretat i qualitat abans de desplegar.

Fitxers:

- `README.md`
- `docs/PRIVACY.md`
- `docs/ARCHITECTURE.md`
- tests addicionals
- configuracio Vercel/Supabase documentada

Criteris d'acceptacio:

- Cap secret exposat al client.
- Cap endpoint sensible accepta camps addicionals.
- RLS activat.
- No hi ha politiques publiques indegudes.
- No hi ha exportacio individual.
- Els logs no contenen tokens.
- Documentacio d'execucio completa.

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
- Politica de retencio.
- Procediment d'esborrat d'espais.

## Fase 9: Desplegament

Objectiu:

- Desplegar a Vercel amb Supabase configurat.

Fitxers:

- Documentacio de desplegament al `README.md`
- Configuracio de variables a Vercel
- Migracions aplicades a Supabase

Criteris d'acceptacio:

- L'app desplegada pot crear espais.
- L'enllac public accepta respostes.
- L'enllac privat mostra agregats.
- El PDF es descarrega.
- Cap taula sensible es pot llegir publicament.

Proves:

- Smoke test complet en produccio.
- Test de token invalid.
- Test de codi inexistent.
- Verificacio de RLS amb clau anon.

Riscos o decisions pendents:

- Configurar backups i retencio a Supabase.
- Revisar limits de Vercel per generacio PDF.

## Incoherencies o decisions a revisar abans de programar

1. "Cal respondre una sola vegada" no es pot garantir tecnicament sense algun identificador, cookie, login, IP o fingerprint. Per preservar l'anonimat, s'ha de tractar com una instruccio de bon us, no com una restriccio forta.
2. Mostrar resultats des de la primera resposta es coherent amb el requisit, pero augmenta el risc interpretatiu. La mitigacio minima es l'avis de prudencia; es podria revisar si cal ocultar algunes distribucions amb volums molt baixos.
3. Els timestamps de submissions no estan prohibits explicitament, pero no s'han de mostrar. Si es vol maximitzar anonimat, es pot considerar no desar-los o truncar-los.
4. Cal decidir aviat si les transaccions es faran amb RPC SQL a Supabase o amb connexio Postgres directa. Aquesta decisio afecta dependecies, tests i desplegament.
5. El text exacte de les 20 preguntes encara s'ha de definir i revisar abans del seed.
