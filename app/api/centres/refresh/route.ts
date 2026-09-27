import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { refreshCentreProfileForUser } from "@/lib/centres/centre-profiles";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  const session = await getResponsibleSessionState();

  if (session.status !== "authenticated") {
    return Response.json({ error: t("accesNoAutoritzat2") }, { status: 403 });
  }

  const centre = await refreshCentreProfileForUser(session.user);

  if (!centre) {
    return Response.json(
      { error: t("aquestCompteNoCorresponAUnCentre") },
      { status: 400 },
    );
  }

  return Response.json({ centre });
}
