import { privateJson } from "@/lib/http/private-response";
import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { getResponsibleSessionState } from "@/lib/auth/session";
import type { ResponsibleAccessReason } from "@/lib/auth/responsible-access";
import { isPublicCode } from "@/lib/crypto/public-code";
import { resolveAppUrl } from "@/lib/http/app-url";
import { regenerateOwnerResultsToken } from "@/lib/spaces/manage-spaces";

export const runtime = "nodejs";

type ResultsTokenRouteProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: ResultsTokenRouteProps,
): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    const { publicCode } = await params;

    if (!isPublicCode(publicCode)) {
      return privateJson({ error: t("codiPublicInvalid") }, { status: 400 });
    }

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

    const result = await regenerateOwnerResultsToken({
      ownerUserId: session.user.id,
      publicCode,
      appUrl: resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL),
    });

    return privateJson(result);
  } catch {
    return privateJson(
      { error: t("noSHaPogutRegenerarLEnllacPrivat") },
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
