import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { readJsonRequestBody } from "@/lib/http/request";
import { getCurrentParticipantUser } from "@/lib/auth/session";
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
  isGoogleAccountAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    if ((await getResponsiblePortalStatus()) === "closed") {
      return Response.json(
        { error: t("elServeiEncaraNoEstaDisponible") },
        { status: 503 },
      );
    }

    const user = await getCurrentParticipantUser();

    if (!user) {
      return Response.json(
        { error: t("calIniciarSessioAmbGooglePerRespondre") },
        { status: 401 },
      );
    }

    const payload = submissionRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 64_000,
      }),
    );
    const policy = await getCentreEmailPolicyForPublicCode(payload.publicCode);

    if (
      !policy ||
      !isGoogleAccountAllowedByCentrePolicy(user.email, user.hostedDomain, policy)
    ) {
      return Response.json(
        { error: t("noSHaPogutValidarLAccesAlQuestionari") },
        { status: 403 },
      );
    }

    await createSubmission(payload, user);

    return Response.json(
      { ok: true, resultsPath: `/docent/resultats/${payload.publicCode}` },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DuplicateSubmissionError) {
      return Response.json(
        { error: t("aquestCompteGoogleJaHaEnviatUnaRespostaPerAquestQuestionari") },
        { status: 409 },
      );
    }

    if (error instanceof SubmissionLimitReachedError) {
      return Response.json(
        {
          error: t("aquestQuestionariJaHaArribatAlMaximDeValue0Respostes", { value0: MAX_SUBMISSIONS_PER_SPACE }),
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: t("noSHanPogutDesarLesRespostes") },
      { status: 400 },
    );
  }
}
