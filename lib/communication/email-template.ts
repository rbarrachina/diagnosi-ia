export const QUESTIONNAIRE_URL_PLACEHOLDER = "{URL_QUESTIONARI}";

export const DEFAULT_COMMUNICATION_SUBJECT =
  "Qüestionari de diagnosi sobre competència digital docent en IA";

export const DEFAULT_COMMUNICATION_BODY = `Benvolgudes i benvolguts,

Us convidem a respondre el qüestionari de diagnosi sobre l'ús educatiu de la intel·ligència artificial.

Podeu accedir-hi des d'aquest enllaç:
${QUESTIONNAIRE_URL_PLACEHOLDER}

Les respostes són anònimes i els resultats es tractaran sempre de manera agregada.

Gràcies per la vostra participació.`;

export type CommunicationTemplate = {
  subject: string;
  body: string;
};

export function renderCommunicationBody(bodyTemplate: string, publicUrl: string): string {
  if (bodyTemplate.includes(QUESTIONNAIRE_URL_PLACEHOLDER)) {
    return bodyTemplate.replaceAll(QUESTIONNAIRE_URL_PLACEHOLDER, publicUrl);
  }

  return `${bodyTemplate.trim()}\n\n${publicUrl}`;
}

export function buildGmailComposeUrl({
  body,
  publicUrl,
  senderEmail,
  subject,
}: CommunicationTemplate & { publicUrl: string; senderEmail?: string }): string {
  const url = new URL("https://mail.google.com/mail/");
  url.searchParams.set("view", "cm");
  url.searchParams.set("fs", "1");
  url.searchParams.set("su", subject);
  url.searchParams.set("body", renderCommunicationBody(body, publicUrl));

  if (senderEmail) {
    url.searchParams.set("authuser", senderEmail);
  }

  return url.toString();
}
