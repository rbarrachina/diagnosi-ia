import { createDiagnosticSpace } from "@/lib/spaces/create-space";
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

    const createdSpace = await createDiagnosticSpace(
      resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL),
    );

    return Response.json(
      {
        publicCode: createdSpace.publicCode,
        publicUrl: createdSpace.publicUrl,
        privateResultsUrl: createdSpace.privateResultsUrl,
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "No s'ha pogut crear l'espai." }, { status: 400 });
  }
}
