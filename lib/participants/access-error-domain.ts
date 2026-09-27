import "server-only";

import { isPublicCode } from "@/lib/crypto/public-code";
import { acceptedDomainLabels, getCentreEmailPolicyForPublicCode, isGoogleAccountAllowedByCentrePolicy } from "@/lib/centres/email-policy";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import { canAttemptParticipantCode, recordParticipantCodeFailure } from "@/lib/participants/access-rate-limit";

/** Called only after the teacher area has validated the participant session. */
export async function getParticipantAccessErrorDomain(
  user: { id: string; email: string; hostedDomain?: string | null },
  publicCode: string | undefined,
): Promise<string | null> {
  if (typeof publicCode !== "string" || !isPublicCode(publicCode) || !canAttemptParticipantCode(user.id)) return null;
  const [questionnaire, policy] = await Promise.all([
    loadPublicQuestionnaire(publicCode),
    getCentreEmailPolicyForPublicCode(publicCode),
  ]);
  recordParticipantCodeFailure(user.id);
  if (!questionnaire || !policy?.configured ||
    isGoogleAccountAllowedByCentrePolicy(user.email, user.hostedDomain, policy)) return null;
  const domains = acceptedDomainLabels(policy);
  return domains.length === 1 ? domains[0] : null;
}
