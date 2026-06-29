import { getRequiredAdminUser, AdminAccessError } from "@/lib/admin/auth";
import { readJsonRequestBody } from "@/lib/http/request";
import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import {
  getAggregatedResultsForQuestionnaireVersion,
  ResultsAccessError,
} from "@/lib/results/get-results";
import { adminResultsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function reportFilename(questionnaireVersion: string): string {
  const safeVersion = questionnaireVersion
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `diagnosi-ia-resultats-${safeVersion || "questionari"}.pdf`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    await getRequiredAdminUser();

    const payload = adminResultsRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 1024,
      }),
    );
    const results = await getAggregatedResultsForQuestionnaireVersion(
      payload.questionnaireId,
    );
    const pdfBuffer = await renderDiagnosticReportPdf(results);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="${reportFilename(results.questionnaireVersion)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return Response.json({ error: "Cal accés d'administració." }, { status: 403 });
    }

    if (error instanceof ResultsAccessError) {
      return Response.json(
        { error: "No s'ha pogut trobar la versió del qüestionari." },
        { status: 404 },
      );
    }

    return Response.json(
      { error: "No s'ha pogut generar l'informe PDF." },
      { status: 400 },
    );
  }
}
