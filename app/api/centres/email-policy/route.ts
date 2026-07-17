import { ZodError } from "zod";

import { getResponsibleSessionState } from "@/lib/auth/session";
import { updateCentreEmailPolicyForUser } from "@/lib/centres/email-policy";
import { readJsonRequestBody } from "@/lib/http/request";

export const runtime = "nodejs";

export async function PUT(request: Request): Promise<Response> {
  const session = await getResponsibleSessionState();
  if (session.status !== "authenticated") {
    return Response.json({ error: "Accés no autoritzat." }, { status: 403 });
  }

  try {
    const policy = await updateCentreEmailPolicyForUser(
      session.user.id,
      await readJsonRequestBody(request, { maxBytes: 2_000 }),
    );
    return policy
      ? Response.json({ policy })
      : Response.json(
          { error: "Confirma primer la fitxa del centre." },
          { status: 409 },
        );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "La configuració no és vàlida." },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "No s'ha pogut desar la configuració." },
      { status: 500 },
    );
  }
}
