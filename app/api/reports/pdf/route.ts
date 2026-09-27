import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { readJsonRequestBody } from "@/lib/http/request";
import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import { getAggregatedResults, ResultsAccessError } from "@/lib/results/get-results";
import { privateResultsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function reportFilename(publicCode: string): string {
  return `diagnosi-ia-${publicCode.toLowerCase()}.pdf`;
}

export async function POST(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    const payload = privateResultsRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 4096,
      }),
    );
    const results = await getAggregatedResults(payload);
    const pdfBuffer = await renderDiagnosticReportPdf(results);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="${reportFilename(results.publicCode)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof ResultsAccessError) {
      return Response.json(
        { error: t("noSHanPogutValidarLesCredencialsDeResultats") },
        { status: 403 },
      );
    }

    return Response.json(
      { error: t("noSHaPogutGenerarLInformePdf") },
      { status: 400 },
    );
  }
}
