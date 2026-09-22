import { describe, expect, it } from "vitest";

import {
  CENTRE_NAME_PLACEHOLDER,
  QUESTIONNAIRE_CODE_PLACEHOLDER,
  QUESTIONNAIRE_URL_PLACEHOLDER,
  buildGmailComposeUrl,
  renderCommunicationBody,
} from "@/lib/communication/email-template";

describe("communication email template", () => {
  it("replaces the questionnaire URL and code placeholders", () => {
    expect(
      renderCommunicationBody(
        `Respon aquí: ${QUESTIONNAIRE_URL_PLACEHOLDER}\nCodi: ${QUESTIONNAIRE_CODE_PLACEHOLDER}`,
        "https://example.test/q/C-AAAA-BBBB",
        "C-AAAA-BBBB",
      ),
    ).toBe(
      "Respon aquí: https://example.test/q/C-AAAA-BBBB\nCodi: C-AAAA-BBBB",
    );
  });

  it("appends both required access details when placeholders are missing", () => {
    expect(
      renderCommunicationBody(
        "Respon el qüestionari.",
        "https://example.test/q/C-AAAA-BBBB",
        "C-AAAA-BBBB",
      ),
    ).toBe(
      "Respon el qüestionari.\n\nEnllaç del qüestionari:\nhttps://example.test/q/C-AAAA-BBBB\n\nCodi del qüestionari: C-AAAA-BBBB",
    );
  });

  it("builds a Gmail compose URL without recipients", () => {
    const url = new URL(
      buildGmailComposeUrl({
        subject: "Títol",
        body: `Cos ${QUESTIONNAIRE_URL_PLACEHOLDER}\nCodi ${QUESTIONNAIRE_CODE_PLACEHOLDER}`,
        publicCode: "C-AAAA-BBBB",
        publicUrl: "https://example.test/q/C-AAAA-BBBB",
        senderEmail: "a1234567@xtec.cat",
      }),
    );

    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("fs")).toBe("1");
    expect(url.searchParams.get("su")).toBe("Títol");
    expect(url.searchParams.get("body")).toBe(
      "Cos https://example.test/q/C-AAAA-BBBB\nCodi C-AAAA-BBBB",
    );
    expect(url.searchParams.get("authuser")).toBe("a1234567@xtec.cat");
    expect(url.searchParams.has("to")).toBe(false);
  });

  it("renders the centre name in the subject and body", () => {
    const url = new URL(
      buildGmailComposeUrl({
        subject: `Diagnosi · ${CENTRE_NAME_PLACEHOLDER}`,
        body: `Benvolgut ${CENTRE_NAME_PLACEHOLDER}\n${QUESTIONNAIRE_URL_PLACEHOLDER}\n${QUESTIONNAIRE_CODE_PLACEHOLDER}`,
        publicCode: "C-AAAA-BBBB",
        publicUrl: "https://example.test/q/C-AAAA-BBBB",
        centreName: "Institut de Prova",
      }),
    );

    expect(url.searchParams.get("su")).toBe("Diagnosi · Institut de Prova");
    expect(url.searchParams.get("body")).toContain("Benvolgut Institut de Prova");
  });

  it("does not add the centre name when the admin template omits it", () => {
    const url = new URL(
      buildGmailComposeUrl({
        subject: "Diagnosi IA",
        body: `Benvolgudes i benvolguts\n${QUESTIONNAIRE_URL_PLACEHOLDER}\n${QUESTIONNAIRE_CODE_PLACEHOLDER}`,
        publicCode: "C-AAAA-BBBB",
        publicUrl: "https://example.test/q/C-AAAA-BBBB",
        centreName: "Institut de Prova",
      }),
    );

    expect(url.searchParams.get("su")).toBe("Diagnosi IA");
    expect(url.searchParams.get("body")).toBe(
      "Benvolgudes i benvolguts\nhttps://example.test/q/C-AAAA-BBBB\nC-AAAA-BBBB",
    );
    expect(url.toString()).not.toContain("Institut+de+Prova");
  });
});
