import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { confirmCentreProfileForUser } from "@/lib/centres/email-policy";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  const session = await getResponsibleSessionState();
  if (session.status !== "authenticated") {
    return Response.json({ error: t("accesNoAutoritzat2") }, { status: 403 });
  }

  const confirmed = await confirmCentreProfileForUser(session.user.id);
  return confirmed
    ? Response.json({ ok: true })
    : Response.json({ error: t("noSHaTrobatLaFitxaDelCentre") }, { status: 404 });
}
