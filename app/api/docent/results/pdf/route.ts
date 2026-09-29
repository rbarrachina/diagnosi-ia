import { privateJson } from "@/lib/http/private-response";
import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { getCurrentParticipantUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { renderParticipantReportPdf } from "@/lib/pdf/render-participant-report";
import { getParticipantResult } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    if ((await getResponsiblePortalStatus()) === "closed") {
      return privateJson(
        { error: t("elServeiEncaraNoEstaDisponible") },
        { status: 503 },
      );
    }

    const user = await getCurrentParticipantUser();
    if (!user) return privateJson({ error: t("calIniciarSessio") }, { status: 401 });
    const formData = await request.formData();
    if (
      [...formData.keys()].some((key) => key !== "publicCode") ||
      formData.getAll("publicCode").length !== 1
    ) {
      return privateJson({ error: t("noSHaPogutGenerarLInforme") }, { status: 400 });
    }
    const publicCode = formData.get("publicCode");
    if (typeof publicCode !== "string" || !isPublicCode(publicCode)) {
      return privateJson({ error: t("noSHaPogutGenerarLInforme") }, { status: 400 });
    }
    const result = await getParticipantResult({ participantUserId: user.id, publicCode });
    if (!result) return privateJson({ error: t("noSHaPogutGenerarLInforme") }, { status: 404 });
    const pdf = await renderParticipantReportPdf(result);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": 'attachment; filename="diagnosi-ia-resultat-individual.pdf"',
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return privateJson({ error: t("noSHaPogutGenerarLInforme") }, { status: 400 });
  }
}
