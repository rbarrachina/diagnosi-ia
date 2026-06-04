import { createDiagnosticSpace } from "@/lib/spaces/create-space";
import { readJsonRequestBody } from "@/lib/http/request";
import { createSpaceRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

function getAppUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await readJsonRequestBody(request, {
      allowEmpty: true,
      maxBytes: 1024,
    });
    createSpaceRequestSchema.parse(payload);

    const createdSpace = await createDiagnosticSpace(getAppUrl(request));

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
