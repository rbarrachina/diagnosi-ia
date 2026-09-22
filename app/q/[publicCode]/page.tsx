import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { getCurrentAuthenticatedUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import {
  getCentreEmailPolicyForPublicCode,
  isEmailAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";
import { getParticipantResult } from "@/lib/repositories/participant-results";
import {
  canAttemptParticipantCode,
  clearParticipantCodeFailures,
  recordParticipantCodeFailure,
} from "@/lib/participants/access-rate-limit";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Qüestionari",
};

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

  const user = await getCurrentAuthenticatedUser();

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
    user && questionnaire && policy && isEmailAllowedByCentrePolicy(user.email, policy),
  );
  if (user) {
    if (isAllowed) clearParticipantCodeFailures(user.id);
    else recordParticipantCodeFailure(user.id);
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
        ) : !isAllowed ? (
          <QuestionnaireForbiddenNotice publicCode={publicCode} />
        ) : (
          <QuestionnaireForm
            questionnaire={questionnaire!}
          />
        )}
      </section>
    </main>
  );
}

function QuestionnaireLoginNotice({
  publicCode,
}: {
  publicCode: string;
}) {
  return (
    <div className="questionnaire-panel mx-auto max-w-3xl p-7 text-center sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        Accés docent
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
        Inicia sessió amb Google
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        Cal validar el compte Google abans de comprovar el codi i l’accés al
        qüestionari. No es mostrarà cap dada del centre fins que l’autorització
        s’hagi completat.
      </p>
      <div className="mt-7">
        <LoginButton label="Accedeix amb Google" next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}

function QuestionnaireForbiddenNotice({
  publicCode,
}: {
  publicCode: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-danger-border bg-danger-bg p-8 text-center text-danger-text shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-xl sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
        Accés al qüestionari
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em]">
        Accés no autoritzat
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6">
        No s’ha pogut validar el codi, l’estat del qüestionari o el compte.
      </p>
      <div className="mt-6 flex justify-center">
        <LogoutButton next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}
