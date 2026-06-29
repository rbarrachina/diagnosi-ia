import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import type { AggregatedResults } from "@/lib/results/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const results: AggregatedResults = {
  publicCode: "C-7KX9-M2Q8",
  questionnaireVersion: "2026.2",
  generatedAt: "2026-06-04T10:00:00.000Z",
  totalSubmissions: 2,
  globalAverage: 41.67,
  lowResponseWarning: true,
  scale: [
    { value: 0, label: "Gens / No ho faig" },
    { value: 1, label: "Una mica / Ocasionalment" },
    { value: 2, label: "Bastant / Habitualment" },
    { value: 3, label: "Molt / Soc un referent al centre" },
  ],
  interpretation: "Interpretació de conjunt.",
  strengths: ["Bloc 1: 50.0%."],
  improvementAreas: ["Bloc 2: 33.3%."],
  blocks: [
    {
      position: 1,
      title: "Bloc 1",
      average: 50,
      questions: [
        {
          position: 1,
          blockPosition: 1,
          text: "Pregunta 1",
          average: 50,
          distribution: [
            { value: 0, label: "Gens / No ho faig", count: 0, percentage: 0 },
            { value: 1, label: "Una mica / Ocasionalment", count: 1, percentage: 50 },
            { value: 2, label: "Bastant / Habitualment", count: 1, percentage: 50 },
            { value: 3, label: "Molt / Soc un referent al centre", count: 0, percentage: 0 },
          ],
        },
      ],
    },
    {
      position: 2,
      title: "Bloc 2",
      average: 33.33,
      questions: [
        {
          position: 2,
          blockPosition: 1,
          text: "Pregunta 2",
          average: 33.33,
          distribution: [
            { value: 0, label: "Gens / No ho faig", count: 1, percentage: 50 },
            { value: 1, label: "Una mica / Ocasionalment", count: 1, percentage: 50 },
            { value: 2, label: "Bastant / Habitualment", count: 0, percentage: 0 },
            { value: 3, label: "Molt / Soc un referent al centre", count: 0, percentage: 0 },
          ],
        },
      ],
    },
  ],
};

function countPdfPages(buffer: Buffer): number {
  return buffer.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0;
}

describe("renderDiagnosticReportPdf", () => {
  it("renders a PDF buffer", async () => {
    const buffer = await renderDiagnosticReportPdf(results);

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders one general page and one page per block", async () => {
    const buffer = await renderDiagnosticReportPdf(results);

    expect(countPdfPages(buffer)).toBe(results.blocks.length + 1);
  });

  it("does not render tokens or individual answer fields", () => {
    const reportSource = readFileSync(
      join(process.cwd(), "lib/pdf/report-document.tsx"),
      "utf8",
    );

    expect(reportSource).not.toMatch(/privateToken|resultsToken|token_hash|submissionId/i);
    expect(reportSource).not.toMatch(/answers\.submission_id|submission_id|owner_user_id/i);
  });
});
