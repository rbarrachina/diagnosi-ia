import { describe, expect, it } from "vitest";

import {
  QUESTIONNAIRE_URL_PLACEHOLDER,
  buildGmailComposeUrl,
  renderCommunicationBody,
} from "@/lib/communication/email-template";

describe("communication email template", () => {
  it("replaces the questionnaire URL placeholder", () => {
    expect(
      renderCommunicationBody(
        `Respon aquí: ${QUESTIONNAIRE_URL_PLACEHOLDER}`,
        "https://example.test/q/C-AAAA-BBBB",
      ),
    ).toBe("Respon aquí: https://example.test/q/C-AAAA-BBBB");
  });

  it("appends the questionnaire URL when the placeholder is missing", () => {
    expect(
      renderCommunicationBody("Respon el qüestionari.", "https://example.test/q/C-AAAA-BBBB"),
    ).toBe("Respon el qüestionari.\n\nhttps://example.test/q/C-AAAA-BBBB");
  });

  it("builds a Gmail compose URL without recipients", () => {
    const url = new URL(
      buildGmailComposeUrl({
        subject: "Títol",
        body: `Cos ${QUESTIONNAIRE_URL_PLACEHOLDER}`,
        publicUrl: "https://example.test/q/C-AAAA-BBBB",
        senderEmail: "a1234567@xtec.cat",
      }),
    );

    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("fs")).toBe("1");
    expect(url.searchParams.get("su")).toBe("Títol");
    expect(url.searchParams.get("body")).toBe(
      "Cos https://example.test/q/C-AAAA-BBBB",
    );
    expect(url.searchParams.get("authuser")).toBe("a1234567@xtec.cat");
    expect(url.searchParams.has("to")).toBe(false);
  });
});
