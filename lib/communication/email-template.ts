export const QUESTIONNAIRE_URL_PLACEHOLDER = "{URL_QUESTIONARI}";
export const QUESTIONNAIRE_CODE_PLACEHOLDER = "{CODI_QUESTIONARI}";
export const CENTRE_NAME_PLACEHOLDER = "{NOM_CENTRE}";

export const DEFAULT_COMMUNICATION_SUBJECT =
  "Qüestionari de diagnosi sobre competència digital docent en IA";

export const DEFAULT_COMMUNICATION_BODY = `Benvolgudes i benvolguts,

Us convidem a respondre el qüestionari de diagnosi sobre l'ús educatiu de la intel·ligència artificial.

Podeu accedir-hi des d'aquest enllaç:
${QUESTIONNAIRE_URL_PLACEHOLDER}

Per tornar-hi a accedir més endavant, conserveu aquest codi:
${QUESTIONNAIRE_CODE_PLACEHOLDER}

No es desa el nom ni el correu docent. Cada participant pot recuperar els seus resultats amb el mateix compte, mentre que el centre només veu dades agregades.

Gràcies per la vostra participació.`;

export type CommunicationTemplate = {
  subject: string;
  body: string;
};

export function renderCommunicationBody(
  bodyTemplate: string,
  publicUrl: string,
  publicCode: string,
  centreName = "",
): string {
  const withCentreName = bodyTemplate.replaceAll(
    CENTRE_NAME_PLACEHOLDER,
    centreName,
  );

  const hasUrlPlaceholder = withCentreName.includes(
    QUESTIONNAIRE_URL_PLACEHOLDER,
  );
  const hasCodePlaceholder = withCentreName.includes(
    QUESTIONNAIRE_CODE_PLACEHOLDER,
  );
  const renderedBody = withCentreName
    .replaceAll(QUESTIONNAIRE_URL_PLACEHOLDER, publicUrl)
    .replaceAll(QUESTIONNAIRE_CODE_PLACEHOLDER, publicCode);
  const requiredAccessDetails: string[] = [];

  if (!hasUrlPlaceholder) {
    requiredAccessDetails.push(`Enllaç del qüestionari:\n${publicUrl}`);
  }

  if (!hasCodePlaceholder) {
    requiredAccessDetails.push(`Codi del qüestionari: ${publicCode}`);
  }

  return requiredAccessDetails.length === 0
    ? renderedBody
    : `${renderedBody.trim()}\n\n${requiredAccessDetails.join("\n\n")}`;
}

export function buildGmailComposeUrl({
  body,
  centreName,
  publicCode,
  publicUrl,
  senderEmail,
  subject,
}: CommunicationTemplate & {
  centreName?: string;
  publicCode: string;
  publicUrl: string;
  senderEmail?: string;
}): string {
  const url = new URL("https://mail.google.com/mail/");
  url.searchParams.set("view", "cm");
  url.searchParams.set("fs", "1");
  const renderedSubject = subject.replaceAll(
    CENTRE_NAME_PLACEHOLDER,
    centreName ?? "",
  );
  url.searchParams.set("su", renderedSubject);
  url.searchParams.set(
    "body",
    renderCommunicationBody(body, publicUrl, publicCode, centreName),
  );

  if (senderEmail) {
    url.searchParams.set("authuser", senderEmail);
  }

  return url.toString();
}
