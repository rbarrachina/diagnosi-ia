import { getResponsibleSessionState } from "@/lib/auth/session";
import {
  createDiagnosticSpace,
  OwnerSpaceAlreadyExistsError,
} from "@/lib/spaces/create-space";
import { resolveAppUrl } from "@/lib/http/app-url";
import { readJsonRequestBody } from "@/lib/http/request";
import { createSpaceRequestSchema } from "@/lib/validation/schemas";
import { registerResponsibleCentreAccount } from "@/lib/centres/centre-profiles";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await readJsonRequestBody(request, {
      allowEmpty: true,
      maxBytes: 1024,
    });
    createSpaceRequestSchema.parse(payload);

    const session = await getResponsibleSessionState();

    if (session.status === "unauthenticated") {
      return Response.json({ error: "Cal iniciar sessió." }, { status: 401 });
    }

    if (session.status === "forbidden") {
      return Response.json(
        { error: getResponsibleAccessErrorMessage(session.reason) },
        { status: 403 },
      );
    }

    const centre = await registerResponsibleCentreAccount(session.user);

    if (!centre) {
      return Response.json(
        { error: "No s'ha pogut preparar la fitxa del responsable." },
        { status: 403 },
      );
    }

    if (!centre.profileConfirmedAt || !centre.emailPolicyConfiguredAt) {
      return Response.json(
        { error: "Completa primer la configuració inicial de l'espai." },
        { status: 409 },
      );
    }

    const createdSpace = await createDiagnosticSpace(
      resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL),
      session.user.id,
      centre.id,
    );

    return Response.json(
      {
        publicCode: createdSpace.publicCode,
        questionnaireTitle: createdSpace.questionnaireTitle,
        questionnaireVersion: createdSpace.questionnaireVersion,
        publicUrl: createdSpace.publicUrl,
        sharedResultsUrl: createdSpace.sharedResultsUrl,
        ownerResultsUrl: createdSpace.ownerResultsUrl,
        questionnairePreviewUrl: createdSpace.questionnairePreviewUrl,
        totalSubmissions: createdSpace.totalSubmissions,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OwnerSpaceAlreadyExistsError) {
      return Response.json(
        {
          error:
            "Aquest centre o compte responsable ja té un qüestionari. El pots gestionar o reiniciar des d'aquesta pantalla.",
        },
        { status: 409 },
      );
    }

    return Response.json({ error: "No s'ha pogut crear l'espai." }, { status: 400 });
  }
}

function getResponsibleAccessErrorMessage(reason: "not_xtec" | "not_centre_xtec") {
  return reason === "not_centre_xtec"
    ? "Cal accedir amb un correu electrònic de centre @xtec.cat amb codi de centre, o amb un compte administrador actiu."
    : "Només es permet l'accés amb un compte XTEC.";
}
