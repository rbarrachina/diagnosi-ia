import { getResponsibleSessionState } from "@/lib/auth/session";
import { refreshCentreProfileForUser } from "@/lib/centres/centre-profiles";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const session = await getResponsibleSessionState();

  if (session.status !== "authenticated") {
    return Response.json({ error: "Accés no autoritzat." }, { status: 403 });
  }

  const centre = await refreshCentreProfileForUser(session.user);

  if (!centre) {
    return Response.json(
      { error: "Aquest compte no correspon a un centre." },
      { status: 400 },
    );
  }

  return Response.json({ centre });
}
