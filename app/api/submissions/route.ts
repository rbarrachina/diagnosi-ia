import { readJsonRequestBody } from "@/lib/http/request";
import {
  createSubmission,
  SubmissionLimitReachedError,
} from "@/lib/submissions/create-submission";
import {
  MAX_SUBMISSIONS_PER_SPACE,
  submissionRequestSchema,
} from "@/lib/validation/schemas";

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
  } catch (error) {
    if (error instanceof SubmissionLimitReachedError) {
      return Response.json(
        {
          error: `Aquest qüestionari ja ha arribat al màxim de ${MAX_SUBMISSIONS_PER_SPACE} respostes.`,
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "No s'han pogut desar les respostes." },
      { status: 400 },
    );
  }
}
