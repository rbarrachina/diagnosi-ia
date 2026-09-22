export const QUESTIONNAIRE_LANGUAGE_CODES = ["ca", "es", "eu", "gl", "oc"] as const;

export type QuestionnaireLanguageCode =
  (typeof QUESTIONNAIRE_LANGUAGE_CODES)[number];

export const QUESTIONNAIRE_LANGUAGE_LABELS: Record<QuestionnaireLanguageCode, string> = {
  ca: "Català",
  es: "Castellà",
  eu: "Euskara",
  gl: "Galego",
  oc: "Aranès",
};
