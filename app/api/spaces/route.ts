import { getResponsibleSessionState } from "@/lib/auth/session";
import {
  createDiagnosticSpace,
  OwnerSpaceAlreadyExistsError,
} from "@/lib/spaces/create-space";
import { resolveAppUrl } from "@/lib/http/app-url";
import { readJsonRequestBody } from "@/lib/http/request";
import { createSpaceRequestSchema } from "@/lib/validation/schemas";

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

    const createdSpace = await createDiagnosticSpace(
      resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL),
      session.user.id,
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
            "Aquest usuari ja té un qüestionari. El pots gestionar o reiniciar des d'aquesta pantalla.",
        },
        { status: 409 },
      );
    }

    return Response.json({ error: "No s'ha pogut crear l'espai." }, { status: 400 });
  }
}

function getResponsibleAccessErrorMessage(reason: "not_xtec" | "not_centre_xtec") {
  return reason === "not_centre_xtec"
    ? "Només es permet l'accés a responsables amb un compte de centre XTEC o amb un administrador actiu."
    : "Només es permet l'accés amb un compte XTEC.";
}
