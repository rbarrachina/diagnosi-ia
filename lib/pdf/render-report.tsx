import { renderToBuffer } from "@react-pdf/renderer";
import { DiagnosticReportDocument } from "@/lib/pdf/report-document";
import type { AggregatedResults } from "@/lib/results/types";

export async function renderDiagnosticReportPdf(
  results: AggregatedResults,
): Promise<Buffer> {
  return renderToBuffer(<DiagnosticReportDocument results={results} />);
}
