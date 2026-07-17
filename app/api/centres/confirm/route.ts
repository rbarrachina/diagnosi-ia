import { getResponsibleSessionState } from "@/lib/auth/session";
import { confirmCentreProfileForUser } from "@/lib/centres/email-policy";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const session = await getResponsibleSessionState();
  if (session.status !== "authenticated") {
    return Response.json({ error: "Accés no autoritzat." }, { status: 403 });
  }

  const confirmed = await confirmCentreProfileForUser(session.user.id);
  return confirmed
    ? Response.json({ ok: true })
    : Response.json({ error: "No s'ha trobat la fitxa del centre." }, { status: 404 });
}
