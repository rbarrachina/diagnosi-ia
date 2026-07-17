import { readJsonRequestBody } from "@/lib/http/request";
import { getCurrentAuthenticatedUser } from "@/lib/auth/session";
import {
  createSubmission,
  DuplicateSubmissionError,
  SubmissionLimitReachedError,
} from "@/lib/submissions/create-submission";
import {
  MAX_SUBMISSIONS_PER_SPACE,
  submissionRequestSchema,
} from "@/lib/validation/schemas";
import {
  getCentreEmailPolicyForPublicCode,
  isEmailAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentAuthenticatedUser();

    if (!user) {
      return Response.json(
        { error: "Cal iniciar sessió amb Google per respondre." },
        { status: 401 },
      );
    }

    const payload = submissionRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 64_000,
      }),
    );
    const policy = await getCentreEmailPolicyForPublicCode(payload.publicCode);

    if (!policy || !isEmailAllowedByCentrePolicy(user.email, policy)) {
      return Response.json(
        { error: "Aquest compte Google no pertany a un domini admès." },
        { status: 403 },
      );
    }

    await createSubmission(payload, user);

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateSubmissionError) {
      return Response.json(
        { error: "Aquest compte Google ja ha enviat una resposta per aquest qüestionari." },
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
