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
      randomizeOptions: false,
      options: [
        { value: 0, label: "Gens / No ho faig" },
        { value: 1, label: "Una mica / Ocasionalment" },
        { value: 2, label: "Bastant / Habitualment" },
        { value: 3, label: "Molt / Soc un referent" },
      ],
    }],
  }],
};

describe("participant PDF", () => {
  it("renders a server-side PDF with the participant's selected answers", async () => {
    const buffer = await renderParticipantReportPdf(result);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.toString("latin1")).toMatch(/\/BaseFont\s*\/Helvetica/);
    expect(buffer.toString("latin1")).not.toMatch(/\/FontFile[23]?\b/);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("renders the full five-block stage overview", async () => {
    const blocks = Array.from({ length: 5 }, (_, index) => ({
      ...result.blocks[0],
      position: index + 1,
      questions: result.blocks[0].questions.map((question) => ({ ...question, value: index % 4 as 0 | 1 | 2 | 3 })),
    }));
    const buffer = await renderParticipantReportPdf({ ...result, blocks });
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
