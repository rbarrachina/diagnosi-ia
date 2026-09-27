import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { getCurrentParticipantUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import {
  getCentreEmailPolicyForPublicCode,
  isGoogleAccountAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";
import { getParticipantResult } from "@/lib/repositories/participant-results";
import {
  canAttemptParticipantCode,
  clearParticipantCodeFailures,
  recordParticipantCodeFailure,
} from "@/lib/participants/access-rate-limit";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerInterfaceTranslator();
  return {
    title: t("questionari"),
  };
}

type QuestionnairePageProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export default async function QuestionnairePage({ params }: QuestionnairePageProps) {
  const { publicCode } = await params;

  if (!isPublicCode(publicCode)) {
    notFound();
  }

  if ((await getResponsiblePortalStatus()) === "closed") {
    redirect("/auth/error?reason=service-closed");
  }

  const user = await getCurrentParticipantUser();

  if (user) {
    const existing = await getParticipantResult({
      participantUserId: user.id,
      publicCode,
    });
    if (existing) {
      clearParticipantCodeFailures(user.id);
      redirect(`/docent/resultats/${publicCode}`);
    }
  }

  const mayAttempt = user ? canAttemptParticipantCode(user.id) : false;
  const [questionnaire, policy] = user && mayAttempt
    ? await Promise.all([
        loadPublicQuestionnaire(publicCode),
        getCentreEmailPolicyForPublicCode(publicCode),
      ])
    : [null, null];
  const isAllowed = Boolean(
    user && questionnaire && policy &&
      isGoogleAccountAllowedByCentrePolicy(user.email, user.hostedDomain, policy),
  );
  if (user) {
    if (isAllowed) clearParticipantCodeFailures(user.id);
    else {
      if (questionnaire && policy?.configured) {
        redirect(`/docent?error=participant-access&code=${encodeURIComponent(publicCode)}`);
      }
      recordParticipantCodeFailure(user.id);
      redirect("/docent?error=participant-access");
    }
  }

  return (
    <main className="app-shell relative min-h-screen overflow-hidden text-ink">
      <AppHeader
        brandHref="/"
        brandOpensInNewTab
        showBrandLabelOnMobile
      >
        <ThemeToggle />
      </AppHeader>

      <div
        aria-hidden="true"
        className="app-grid pointer-events-none fixed inset-0 opacity-50"
      />
      <div aria-hidden="true" className="app-orb app-orb-left fixed" />
      <div aria-hidden="true" className="app-orb app-orb-right fixed" />

      <section
        className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-32"
        id="inici"
        tabIndex={-1}
      >
        {!user ? (
          <QuestionnaireLoginNotice
            publicCode={publicCode}
          />
        ) : (
          <QuestionnaireForm
            questionnaire={questionnaire!}
          />
        )}
      </section>
    </main>
  );
}

async function QuestionnaireLoginNotice({
  publicCode,
}: {
  publicCode: string;
}) {
  const t = await getServerInterfaceTranslator();
  return (
    <div className="questionnaire-panel mx-auto max-w-3xl p-7 text-center sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        <InterfaceText messageKey="accesDocent" />
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
        <InterfaceText messageKey="iniciaSessioAmbGoogle" />
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        <InterfaceText messageKey="calValidarElCompteGoogleAbansDeComprovarElCodiI" />
      </p>
      <div className="mt-7">
        <LoginButton label={t("accedeixAmbGoogle")} next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}
