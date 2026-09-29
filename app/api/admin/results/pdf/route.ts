import { privateJson, PRIVATE_CACHE_CONTROL } from "@/lib/http/private-response";
import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
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
  const t = await getServerInterfaceTranslator();
  try {
    await getRequiredAdminUser();

    const payload = adminResultsRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 1024,
      }),
    );
    const results = await getAggregatedResultsForQuestionnaireVersion(payload);

    if (payload.scope === "centre" && results.totalSubmissions === 0) {
      return privateJson(
        { error: t("aquestCentreNoSuperaElLlindarMinimDeRespostes") },
        { status: 409 },
      );
    }

    const pdfBuffer = await renderDiagnosticReportPdf(results);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Cache-Control": PRIVATE_CACHE_CONTROL,
        "Content-Disposition": `attachment; filename="${reportFilename(results.questionnaireVersion)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return privateJson({ error: t("calAccesDAdministracio") }, { status: 403 });
    }

    if (error instanceof ResultsAccessError) {
      return privateJson(
        { error: t("noSHaPogutTrobarLAmbitDeResultatsSolLicitat") },
        { status: 404 },
      );
    }

    return privateJson(
      { error: t("noSHaPogutGenerarLInformePdf") },
      { status: 400 },
    );
  }
}
