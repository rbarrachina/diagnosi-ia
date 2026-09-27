import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { ZodError } from "zod";

import { getResponsibleSessionState } from "@/lib/auth/session";
import { updateCentreEmailPolicyForUser } from "@/lib/centres/email-policy";
import { readJsonRequestBody } from "@/lib/http/request";

export const runtime = "nodejs";

export async function PUT(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  const session = await getResponsibleSessionState();
  if (session.status !== "authenticated") {
    return Response.json({ error: t("accesNoAutoritzat2") }, { status: 403 });
  }

  try {
    const policy = await updateCentreEmailPolicyForUser(
      session.user.id,
      await readJsonRequestBody(request, { maxBytes: 2_000 }),
    );
    return policy
      ? Response.json({ policy })
      : Response.json(
          { error: t("confirmaPrimerLaFitxaDelCentre") },
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
      { error: t("noSHaPogutDesarLaConfiguracio") },
      { status: 500 },
    );
  }
}
