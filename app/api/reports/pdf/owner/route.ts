import { getResponsibleSessionState } from "@/lib/auth/session";
import { readJsonRequestBody } from "@/lib/http/request";
import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import { getAggregatedResultsForOwner, ResultsAccessError } from "@/lib/results/get-results";
import { ownerResultsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function reportFilename(publicCode: string): string {
  return `diagnosi-ia-${publicCode.toLowerCase()}.pdf`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getResponsibleSessionState();

    if (session.status === "unauthenticated") {
      return Response.json({ error: "Cal iniciar sessió." }, { status: 401 });
    }

    if (session.status === "forbidden") {
      return Response.json(
        { error: getResponsibleAccessErrorMessage(session.reason) },
        { status: 403 },
      );
    }

    const payload = ownerResultsRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 1024,
      }),
    );
    const results = await getAggregatedResultsForOwner({
      publicCode: payload.publicCode,
      ownerUserId: session.user.id,
    });
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
        { error: "No s'han pogut validar les credencials de resultats." },
        { status: 403 },
      );
    }

    return Response.json(
      { error: "No s'ha pogut generar l'informe PDF." },
      { status: 400 },
    );
  }
}

function getResponsibleAccessErrorMessage(reason: "not_xtec" | "not_centre_xtec") {
  return reason === "not_centre_xtec"
    ? "Només es permet l'accés a responsables amb un compte de centre XTEC o amb un administrador actiu."
    : "Només es permet l'accés amb un compte XTEC.";
}
