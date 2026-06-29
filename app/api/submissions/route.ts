import { readJsonRequestBody } from "@/lib/http/request";
import { getXtecSessionState } from "@/lib/auth/session";
import {
  createSubmission,
  DuplicateSubmissionError,
  SubmissionLimitReachedError,
} from "@/lib/submissions/create-submission";
import {
  MAX_SUBMISSIONS_PER_SPACE,
  submissionRequestSchema,
} from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getXtecSessionState();

    if (session.status === "unauthenticated") {
      return Response.json(
        { error: "Cal iniciar sessió amb un compte XTEC per respondre." },
        { status: 401 },
      );
    }

    if (session.status === "forbidden") {
      return Response.json(
        { error: "Només es permet respondre amb un compte XTEC." },
        { status: 403 },
      );
    }

    const payload = submissionRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 64_000,
      }),
    );
    await createSubmission(payload, session.user.id);

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateSubmissionError) {
      return Response.json(
        { error: "Aquest compte XTEC ja ha enviat una resposta per aquest qüestionari." },
        { status: 409 },
      );
    }

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
