import { privateJson, PRIVATE_CACHE_CONTROL } from "@/lib/http/private-response";
import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { getResponsibleSessionState } from "@/lib/auth/session";
import type { ResponsibleAccessReason } from "@/lib/auth/responsible-access";
import { readJsonRequestBody } from "@/lib/http/request";
import { renderDiagnosticReportPdf } from "@/lib/pdf/render-report";
import { getAggregatedResultsForOwner, ResultsAccessError } from "@/lib/results/get-results";
import { ownerResultsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function reportFilename(publicCode: string): string {
  return `diagnosi-ia-${publicCode.toLowerCase()}.pdf`;
}

export async function POST(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    const session = await getResponsibleSessionState();

    if (session.status === "unauthenticated") {
      return privateJson({ error: t("calIniciarSessio") }, { status: 401 });
    }

    if (session.status === "forbidden") {
      return privateJson(
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
        "Cache-Control": PRIVATE_CACHE_CONTROL,
        "Content-Disposition": `attachment; filename="${reportFilename(results.publicCode)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof ResultsAccessError) {
      return privateJson(
        { error: t("noSHanPogutValidarLesCredencialsDeResultats") },
        { status: 403 },
      );
    }

    return privateJson(
      { error: t("noSHaPogutGenerarLInformePdf") },
      { status: 400 },
    );
  }
}

function getResponsibleAccessErrorMessage(reason: ResponsibleAccessReason) {
  return reason === "prelaunch"
    ? "L’accés dels centres encara no està disponible."
    : reason === "suspended"
    ? "L’accés d’aquest centre està suspès."
    : reason === "not_centre_xtec"
    ? "Cal accedir amb un correu electrònic de centre @xtec.cat amb codi de centre, o amb un compte administrador actiu."
    : "Només es permet l'accés amb un compte XTEC.";
}
