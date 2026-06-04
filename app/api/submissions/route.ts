import { readJsonRequestBody } from "@/lib/http/request";
import { createSubmission } from "@/lib/submissions/create-submission";
import { submissionRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = submissionRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 16_384,
      }),
    );
    await createSubmission(payload);

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: "No s'han pogut desar les respostes." },
      { status: 400 },
    );
  }
}
