export const QUESTIONNAIRE_URL_PLACEHOLDER = "{URL_QUESTIONARI}";
export const QUESTIONNAIRE_CODE_PLACEHOLDER = "{CODI_QUESTIONARI}";
export const CENTRE_NAME_PLACEHOLDER = "{NOM_CENTRE}";

export const DEFAULT_COMMUNICATION_SUBJECT =
  "Qüestionari de diagnosi sobre competència digital docent en IA";

const COMMUNICATION_PRIVACY_TEXT =
  "Podeu consultar les vostres respostes i resultats amb el mateix compte Google. No es recullen noms i el correu només s’utilitza durant la sessió per validar l’accés. La participació es vincula a un identificador pseudonimitzat per poder recuperar-la més endavant. El centre i l’administració només veuen resultats de conjunt.";

export const DEFAULT_COMMUNICATION_BODY = `Benvolgudes i benvolguts,

Us convidem a respondre el qüestionari de diagnosi sobre l'ús educatiu de la intel·ligència artificial.
Podeu accedir-hi des d'aquest enllaç:
${QUESTIONNAIRE_URL_PLACEHOLDER}

${COMMUNICATION_PRIVACY_TEXT}

També podeu accedir al qüestionari amb aquest codi:
${QUESTIONNAIRE_CODE_PLACEHOLDER}

Gràcies per la vostra participació.`;

// Refresh only known privacy paragraphs; keep the rest of the saved template.
export function refreshCommunicationPrivacyText(body: string): string {
  return body
    .replaceAll(
      "No es demana el nom docent. El correu només es conserva durant la sessió per validar el domini i no es desa a la base de dades ni es vincula a les respostes. Cada participant pot recuperar els seus resultats amb el mateix compte, mentre que el centre només veu dades agregades.",
      COMMUNICATION_PRIVACY_TEXT,
    )
    .replaceAll(
      "Les respostes no inclouen el vostre nom. La vostra participació es vincula a un identificador pseudonimitzat perquè pugueu consultar-la més endavant amb el mateix compte Google. El centre i l’administració només poden consultar resultats agregats.",
      COMMUNICATION_PRIVACY_TEXT,
    );
}

export function formatCommunicationBody(body: string): string {
  let formatted = body.replace(/\r\n?/g, "\n").replace(
    /(^|\n)(Benvolgudes i benvolguts,)[ \t]*\n+/,
    "$1$2\n\n",
  );
  formatted = formatted.replace(
    COMMUNICATION_PRIVACY_TEXT,
    `\n\n${COMMUNICATION_PRIVACY_TEXT}\n\n`,
  );

  const closing = "Gràcies per la vostra participació.";
  const closingLine = /(^|\n)Gràcies per la vostra participació\.[ \t]*(?=\n|$)/;
  if (closingLine.test(formatted)) {
    formatted = `${formatted.replace(closingLine, "$1").trim()}\n\n${closing}`;
  }

  return formatted.replace(/\n{3,}/g, "\n\n").trim();
}

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

  return formatCommunicationBody(
    requiredAccessDetails.length === 0
      ? renderedBody
      : `${renderedBody.trim()}\n\n${requiredAccessDetails.join("\n\n")}`,
  );
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
