import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderParticipantReportPdf } from "@/lib/pdf/render-participant-report";
import type { ParticipantResult } from "@/lib/participants/types";

const result: ParticipantResult = {
  centreName: "Institut de Prova",
  publicCode: "C-ABCD-EFGH",
  questionnaireTitle: "Diagnosi IA",
  questionnaireVersion: "2026.2",
  completedAt: "2026-09-16T10:00:00.000Z",
  globalScore: 66.67,
  blocks: [{
    position: 1,
    title: "Bloc de prova",
    score: 66.67,
    questions: [{
      position: 1,
      blockPosition: 1,
      text: "Pregunta de prova",
      value: 2,
      label: "Bastant / Habitualment",
    }],
  }],
};

describe("participant PDF", () => {
  it("renders a server-side PDF with the participant's selected answers", async () => {
    const buffer = await renderParticipantReportPdf(result);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("does not include identity or internal identifier fields", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/pdf/participant-report-document.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/participantUserId|submissionId|email|displayName|privateToken/i);
  });
});
