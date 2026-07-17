export const QUESTIONNAIRE_URL_PLACEHOLDER = "{URL_QUESTIONARI}";
export const CENTRE_NAME_PLACEHOLDER = "{NOM_CENTRE}";

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

export function renderCommunicationBody(
  bodyTemplate: string,
  publicUrl: string,
  centreName = "",
): string {
  const withCentreName = bodyTemplate.includes(CENTRE_NAME_PLACEHOLDER)
    ? bodyTemplate.replaceAll(CENTRE_NAME_PLACEHOLDER, centreName)
    : centreName
      ? `${centreName}\n\n${bodyTemplate}`
      : bodyTemplate;

  if (withCentreName.includes(QUESTIONNAIRE_URL_PLACEHOLDER)) {
    return withCentreName.replaceAll(QUESTIONNAIRE_URL_PLACEHOLDER, publicUrl);
  }

  return `${withCentreName.trim()}\n\n${publicUrl}`;
}

export function buildGmailComposeUrl({
  body,
  centreName,
  publicUrl,
  senderEmail,
  subject,
}: CommunicationTemplate & {
  centreName?: string;
  publicUrl: string;
  senderEmail?: string;
}): string {
  const url = new URL("https://mail.google.com/mail/");
  url.searchParams.set("view", "cm");
  url.searchParams.set("fs", "1");
  const renderedSubject = subject.includes(CENTRE_NAME_PLACEHOLDER)
    ? subject.replaceAll(CENTRE_NAME_PLACEHOLDER, centreName ?? "")
    : centreName
      ? `${centreName} · ${subject}`
      : subject;
  url.searchParams.set("su", renderedSubject);
  url.searchParams.set(
    "body",
    renderCommunicationBody(body, publicUrl, centreName),
  );

  if (senderEmail) {
    url.searchParams.set("authuser", senderEmail);
  }

  return url.toString();
}
