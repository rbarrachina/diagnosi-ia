import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import type { AggregatedResults } from "@/lib/results/types";

const results: AggregatedResults = {
  publicCode: "C-7KX9-M2Q8",
  questionnaireVersion: "2026.2",
  generatedAt: "2026-06-04T10:00:00.000Z",
  totalSubmissions: 2,
  globalAverage: 1.25,
  lowResponseWarning: true,
  scale: [
    { value: 0, label: "Encara no" },
    { value: 1, label: "Parcialment" },
    { value: 2, label: "Sí, de manera habitual" },
  ],
  interpretation: "Interpretació de conjunt.",
  strengths: ["Bloc 1: mitjana 1.50 sobre 2."],
  improvementAreas: ["Bloc 2: mitjana 1.00 sobre 2."],
  blocks: [
    {
      position: 1,
      title: "Bloc 1",
      average: 1.5,
      questions: [
        {
          position: 1,
          blockPosition: 1,
          text: "Pregunta 1",
          average: 1.5,
          distribution: [
            { value: 0, label: "Encara no", count: 0, percentage: 0 },
            { value: 1, label: "Parcialment", count: 1, percentage: 50 },
            { value: 2, label: "Sí, de manera habitual", count: 1, percentage: 50 },
          ],
        },
      ],
    },
    {
      position: 2,
      title: "Bloc 2",
      average: 1,
      questions: [
        {
          position: 2,
          blockPosition: 1,
          text: "Pregunta 2",
          average: 1,
          distribution: [
            { value: 0, label: "Encara no", count: 1, percentage: 50 },
            { value: 1, label: "Parcialment", count: 1, percentage: 50 },
            { value: 2, label: "Sí, de manera habitual", count: 0, percentage: 0 },
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
});
