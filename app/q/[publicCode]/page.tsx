import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { getCurrentAuthenticatedUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import { hasAccountSubmittedToPublicQuestionnaire } from "@/lib/repositories/submissions";
import {
  acceptedDomainLabels,
  getCentreEmailPolicyForPublicCode,
  isEmailAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";

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

  const questionnaire = await loadPublicQuestionnaire(publicCode);

  if (!questionnaire) {
    notFound();
  }

  const policy = await getCentreEmailPolicyForPublicCode(publicCode);
  if (!policy?.configured) {
    notFound();
  }
  const user = await getCurrentAuthenticatedUser();
  const isAllowed = user ? isEmailAllowedByCentrePolicy(user.email, policy) : false;
  const alreadySubmitted =
    user && isAllowed
      ? await hasAccountSubmittedToPublicQuestionnaire({
          accountId: user.id,
          publicCode,
        })
      : false;

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
            acceptedDomains={acceptedDomainLabels(policy)}
            centreName={questionnaire.centreName}
            publicCode={publicCode}
          />
        ) : !isAllowed ? (
          <QuestionnaireForbiddenNotice
            acceptedDomains={acceptedDomainLabels(policy)}
            publicCode={publicCode}
          />
        ) : (
          <QuestionnaireForm
            alreadySubmitted={alreadySubmitted}
            questionnaire={questionnaire}
          />
        )}
      </section>
    </main>
  );
}

function QuestionnaireLoginNotice({
  centreName,
  acceptedDomains,
  publicCode,
}: {
  centreName: string;
  acceptedDomains: string[];
  publicCode: string;
}) {
  return (
    <div className="questionnaire-panel mx-auto max-w-3xl p-7 text-center sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        {centreName}
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
        Inicia sessió amb Google
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        Cal validar un compte dels dominis {formatDomains(acceptedDomains)} per
        evitar més d’una resposta per compte. L’aplicació no desa el correu ni
        el vincula a les respostes.
      </p>
      <div className="mt-7">
        <LoginButton label="Accedeix amb Google" next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}

function QuestionnaireForbiddenNotice({
  acceptedDomains,
  publicCode,
}: {
  acceptedDomains: string[];
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
        Només es permet respondre amb un compte dels dominis{" "}
        {formatDomains(acceptedDomains)}.
      </p>
      <div className="mt-6 flex justify-center">
        <LogoutButton next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}

function formatDomains(domains: string[]): string {
  return domains.join(" o ");
}
