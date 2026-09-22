import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";

export type ReportCopy = {
  locale: string;
  aggregateSubject: string;
  aggregateSubtitle: string;
  scope: string;
  allCentres: string;
  spaceCode: string;
  version: string;
  centres: string;
  responses: string;
  globalPercentage: string;
  noData: string;
  lowResponses: string;
  scale: string;
  scoreScale: string;
  blockOverview: string;
  interpretation: string;
  strengths: string;
  improvements: string;
  aggregatePrivacy: string;
  blockResults: string;
  blockPercentage: string;
  questionResults: string;
  percentage: string;
  blockPrivacy: string;
  participantSubject: string;
  participantTitle: string;
  completedOn: string;
  globalScore: string;
  block: string;
  selectedAnswer: string;
  participantPrivacy: string;
};

const copies: Record<QuestionnaireLanguageCode, ReportCopy> = {
  ca: {
    locale: "ca-ES", aggregateSubject: "Informe de conjunt de diagnosi pseudonimitzada",
    aggregateSubtitle: "Informe de conjunt de diagnosi generat el", scope: "Àmbit", allCentres: "Tots els centres",
    spaceCode: "Codi de l’espai", version: "Versió", centres: "Centres", responses: "Respostes",
    globalPercentage: "Percentatge global", noData: "Sense dades",
    lowResponses: "Poques respostes: interpreta els resultats amb prudència.", scale: "Escala",
    scoreScale: "0–3 punts; les opcions de cada pregunta es mostren ordenades per puntuació.",
    blockOverview: "Resultat general per blocs", interpretation: "Interpretació", strengths: "Fortaleses",
    improvements: "Àmbits amb marge de millora",
    aggregatePrivacy: "Nota metodològica: aquest informe presenta exclusivament resultats de conjunt. No inclou identificadors de participants, no mostra respostes individuals i no permet reconstruir el conjunt complet de respostes d’una mateixa persona.",
    blockResults: "Resultats del bloc", blockPercentage: "Percentatge del bloc", questionResults: "Resultats per pregunta",
    percentage: "Percentatge", blockPrivacy: "Les dades d’aquest bloc es presenten en conjunt. L’informe no inclou respostes individuals ni permet avaluar cap docent.",
    participantSubject: "Resultat individual pseudonimitzat", participantTitle: "Resultat individual",
    completedOn: "Realitzat el", globalScore: "Puntuació global", block: "Bloc", selectedAnswer: "Resposta seleccionada",
    participantPrivacy: "Aquest document només conté la participació recuperada amb el compte autenticat. No inclou el nom, el correu, l’identificador pseudònim, identificadors interns, comparacions ni dades d’altres participants.",
  },
  es: {
    locale: "es-ES", aggregateSubject: "Informe agregado de diagnóstico seudonimizado",
    aggregateSubtitle: "Informe agregado de diagnóstico generado el", scope: "Ámbito", allCentres: "Todos los centros", spaceCode: "Código del espacio",
    version: "Versión", centres: "Centros", responses: "Respuestas", globalPercentage: "Porcentaje global", noData: "Sin datos",
    lowResponses: "Hay pocas respuestas: interpreta los resultados con prudencia.", scale: "Escala",
    scoreScale: "0–3 puntos; las opciones de cada pregunta se muestran ordenadas por puntuación.", blockOverview: "Resultado general por bloques",
    interpretation: "Interpretación", strengths: "Fortalezas", improvements: "Ámbitos con margen de mejora",
    aggregatePrivacy: "Nota metodológica: este informe presenta exclusivamente resultados agregados. No incluye identificadores de participantes, no muestra respuestas individuales ni permite reconstruir el conjunto completo de respuestas de una misma persona.",
    blockResults: "Resultados del bloque", blockPercentage: "Porcentaje del bloque", questionResults: "Resultados por pregunta", percentage: "Porcentaje",
    blockPrivacy: "Los datos de este bloque se presentan de forma agregada. El informe no incluye respuestas individuales ni permite evaluar a ningún docente.",
    participantSubject: "Resultado individual seudonimizado", participantTitle: "Resultado individual", completedOn: "Realizado el",
    globalScore: "Puntuación global", block: "Bloque", selectedAnswer: "Respuesta seleccionada",
    participantPrivacy: "Este documento solo contiene la participación recuperada con la cuenta autenticada. No incluye el nombre, el correo, el identificador seudónimo, identificadores internos, comparaciones ni datos de otros participantes.",
  },
  eu: {
    locale: "eu-ES", aggregateSubject: "Diagnosi pseudonimizatuaren emaitza agregatuen txostena",
    aggregateSubtitle: "Diagnosi-txosten agregatua, sortze-data:", scope: "Esparrua", allCentres: "Ikastetxe guztiak", spaceCode: "Gunearen kodea", version: "Bertsioa",
    centres: "Ikastetxeak", responses: "Erantzunak", globalPercentage: "Ehuneko globala", noData: "Daturik ez",
    lowResponses: "Erantzun gutxi daude: interpretatu emaitzak zuhurtziaz.", scale: "Eskala",
    scoreScale: "0–3 puntu; galdera bakoitzeko aukerak puntuazioaren arabera ordenatuta ageri dira.", blockOverview: "Blokeen emaitza orokorra",
    interpretation: "Interpretazioa", strengths: "Indarguneak", improvements: "Hobetzeko arloak",
    aggregatePrivacy: "Ohar metodologikoa: txosten honek emaitza agregatuak baino ez ditu aurkezten. Ez du parte-hartzaileen identifikatzailerik edo banakako erantzunik jasotzen, eta ezin da pertsona beraren erantzun multzo osoa berreraiki.",
    blockResults: "Blokearen emaitzak", blockPercentage: "Blokearen ehunekoa", questionResults: "Galderaz galderako emaitzak", percentage: "Ehunekoa",
    blockPrivacy: "Bloke honetako datuak modu agregatuan aurkezten dira. Txostenak ez du banakako erantzunik jasotzen eta ez du irakaslerik ebaluatzeko balio.",
    participantSubject: "Banakako emaitza pseudonimizatua", participantTitle: "Banakako emaitza", completedOn: "Egindako data:",
    globalScore: "Puntuazio globala", block: "Blokea", selectedAnswer: "Hautatutako erantzuna",
    participantPrivacy: "Dokumentu honek autentifikatutako kontuarekin berreskuratutako parte-hartzea baino ez du jasotzen. Ez du izenik, helbide elektronikorik, identifikatzaile pseudonimorik, barne-identifikatzailerik, konparaziorik edo beste parte-hartzaileen daturik jasotzen.",
  },
  gl: {
    locale: "gl-ES", aggregateSubject: "Informe agregado de diagnose pseudonimizada",
    aggregateSubtitle: "Informe agregado de diagnose xerado o", scope: "Ámbito", allCentres: "Todos os centros", spaceCode: "Código do espazo", version: "Versión",
    centres: "Centros", responses: "Respostas", globalPercentage: "Porcentaxe global", noData: "Sen datos",
    lowResponses: "Hai poucas respostas: interpreta os resultados con prudencia.", scale: "Escala",
    scoreScale: "0–3 puntos; as opcións de cada pregunta móstranse ordenadas por puntuación.", blockOverview: "Resultado xeral por bloques",
    interpretation: "Interpretación", strengths: "Fortalezas", improvements: "Ámbitos con marxe de mellora",
    aggregatePrivacy: "Nota metodolóxica: este informe presenta exclusivamente resultados agregados. Non inclúe identificadores de participantes, non mostra respostas individuais nin permite reconstruír o conxunto completo de respostas dunha mesma persoa.",
    blockResults: "Resultados do bloque", blockPercentage: "Porcentaxe do bloque", questionResults: "Resultados por pregunta", percentage: "Porcentaxe",
    blockPrivacy: "Os datos deste bloque preséntanse de forma agregada. O informe non inclúe respostas individuais nin permite avaliar ningún docente.",
    participantSubject: "Resultado individual pseudonimizado", participantTitle: "Resultado individual", completedOn: "Realizado o",
    globalScore: "Puntuación global", block: "Bloque", selectedAnswer: "Resposta seleccionada",
    participantPrivacy: "Este documento só contén a participación recuperada coa conta autenticada. Non inclúe o nome, o correo, o identificador pseudónimo, identificadores internos, comparacións nin datos doutras persoas participantes.",
  },
  oc: {
    locale: "oc-ES", aggregateSubject: "Rapòrt agregat de diagnostic pseudonimizat",
    aggregateSubtitle: "Rapòrt agregat de diagnostic generat eth", scope: "Encastre", allCentres: "Toti es centres", spaceCode: "Còdi der espaci", version: "Version",
    centres: "Centres", responses: "Responses", globalPercentage: "Percentatge globau", noData: "Sense donades",
    lowResponses: "I a pògues responses: interpreta es resultats damb prudéncia.", scale: "Escala",
    scoreScale: "0–3 punts; es opcions de cada qüestion se mòstren ordenades per puntuacion.", blockOverview: "Resultat generau per blòcs",
    interpretation: "Interpretacion", strengths: "Fortaleses", improvements: "Encastres damb marge de melhora",
    aggregatePrivacy: "Nòta metodologica: aguest rapòrt presente sonque resultats agregats. Non includís identificadors de participants, non mòstre responses individuaus e non permet reconstruïr eth conjunt complèt de responses d’ua madeisha persona.",
    blockResults: "Resultats deth blòc", blockPercentage: "Percentatge deth blòc", questionResults: "Resultats per qüestion", percentage: "Percentatge",
    blockPrivacy: "Es donades d’aguest blòc se presenten de manèra agregada. Eth rapòrt non includís responses individuaus ne permet avalorar cap docent.",
    participantSubject: "Resultat individuau pseudonimizat", participantTitle: "Resultat individuau", completedOn: "Realizat eth",
    globalScore: "Puntuacion globau", block: "Blòc", selectedAnswer: "Response seleccionada",
    participantPrivacy: "Aguest document sonque conten era participacion recuperada damb eth compde autentificat. Non includís eth nòm, eth corrèu, er identificador pseudonim, identificadors intèrns, comparacions ne donades d’auti participants.",
  },
};

export function getReportCopy(languageCode?: QuestionnaireLanguageCode): ReportCopy {
  return copies[languageCode ?? "ca"];
}
