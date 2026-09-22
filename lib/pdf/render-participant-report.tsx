import { renderToBuffer } from "@react-pdf/renderer";
import { ParticipantReportDocument } from "@/lib/pdf/participant-report-document";
import type { ParticipantResult } from "@/lib/participants/types";

export async function renderParticipantReportPdf(result: ParticipantResult): Promise<Buffer> {
  return renderToBuffer(<ParticipantReportDocument result={result} />);
}
