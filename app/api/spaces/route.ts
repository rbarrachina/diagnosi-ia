import { getXtecSessionState } from "@/lib/auth/session";
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

    const session = await getXtecSessionState();

    if (session.status === "unauthenticated") {
      return Response.json({ error: "Cal iniciar sessió." }, { status: 401 });
    }

    if (session.status === "forbidden") {
      return Response.json(
        { error: "Només es permet l’accés amb un compte XTEC." },
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
        publicUrl: createdSpace.publicUrl,
        sharedResultsUrl: createdSpace.sharedResultsUrl,
        ownerResultsUrl: createdSpace.ownerResultsUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OwnerSpaceAlreadyExistsError) {
      return Response.json(
        {
          error:
            "Aquest usuari ja té un qüestionari. Ves a Els meus espais per gestionar-lo o reiniciar-lo.",
        },
        { status: 409 },
      );
    }

    return Response.json({ error: "No s'ha pogut crear l'espai." }, { status: 400 });
  }
}
