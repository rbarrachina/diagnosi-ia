import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconLogoutButton, LoginButton } from "@/components/auth/auth-actions";
import { ParticipantCodeAccessForm } from "@/components/participants/code-access-form";
import { ParticipantWorkspaceFrame } from "@/components/participants/participant-workspace-frame";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { getCurrentParticipantUser } from "@/lib/auth/session";
import { listParticipantResults } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";
import { getParticipantAccessErrorDomain } from "@/lib/participants/access-error-domain";

export const dynamic = "force-dynamic";

export default async function ParticipantAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; view?: string }>;
}) {
  const t = await getServerInterfaceTranslator();
  if ((await getResponsiblePortalStatus()) === "closed") {
    redirect("/auth/error?reason=service-closed");
  }

  const user = await getCurrentParticipantUser();
  if (!user) {
    return (
      <main className="app-shell min-h-screen bg-paper text-ink">
        <AppHeader brandHref="/"><ThemeToggle /></AppHeader>
        <section className="mx-auto max-w-2xl px-5 pb-16 pt-32 text-center">
          <h1 className="text-4xl font-semibold tracking-tight"><InterfaceText messageKey="areaDocent" /></h1>
          <p className="mt-4 text-muted">
            <InterfaceText messageKey="iniciaSessioAmbElMateixCompteGoogleQueVasUtilitzarPer" />
          </p>
          <div className="mt-7"><LoginButton label={t("accedeixAmbGoogle")} next="/docent" /></div>
        </section>
      </main>
    );
  }

  const participations = await listParticipantResults(user.id);
  const { error, code, view: requestedView } = await searchParams;
  const view = error === "participant-access"
    ? "new"
    : requestedView === "new" || requestedView === "questionnaires"
      ? requestedView
      : "home";
  const requiredDomain = error === "participant-access"
    ? await getParticipantAccessErrorDomain(user, code)
    : null;

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader brandHref="/docent">
        <ThemeToggle />
        <IconLogoutButton next="/" />
      </AppHeader>
      <ParticipantWorkspaceFrame participations={participations.map(({ publicCode, questionnaireTitle }) => ({ publicCode, questionnaireTitle }))} view={view}>
        <section className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8 md:pb-20">
          {view === "home" ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action"><InterfaceText messageKey="accesPrivat" /></p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight"><InterfaceText messageKey="areaDocent" /></h1>
              <p className="mt-4 max-w-2xl leading-7 text-muted"><InterfaceText messageKey="nomesEsMostrenLesParticipacionsVinculadesDeManeraPseudonimaAlCompte" /></p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="text-sm font-semibold text-muted"><InterfaceText messageKey="questionarisFets" /></h2>
                  <p className="mt-3 text-4xl font-semibold text-ink">{participations.length}</p>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="text-sm font-semibold text-muted"><InterfaceText messageKey="darrerQuestionari" /></h2>
                  {participations[0] ? (
                    <>
                      <Link className="mt-3 block text-lg font-semibold text-action hover:underline" href={`/docent/resultats/${participations[0].publicCode}`}>
                        {participations[0].questionnaireTitle}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{formatDate(participations[0].completedAt)}</p>
                    </>
                  ) : <p className="mt-3 text-sm text-muted"><InterfaceText messageKey="encaraNoHiHaCapParticipacioVinculadaAAquestCompte" /></p>}
                </div>
              </div>
            </>
          ) : view === "new" ? (
            <>
              <h1 className="text-4xl font-semibold tracking-tight"><InterfaceText messageKey="nouQuestionari" /></h1>
              <p className="mt-4 text-muted"><InterfaceText messageKey="elCentreEtFacilitaraElCodiPerAccedirAlQuestionari" /></p>
              <div className="mt-8 max-w-lg rounded-2xl border border-line bg-surface p-5">
                {error === "participant-access" && (
                  <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg p-4 text-danger-text" role="alert">
                    <p className="font-semibold"><InterfaceText messageKey="noSHaPogutAccedirAlQuestionari" /></p>
                    <p className="mt-2 text-sm">
                      {requiredDomain
                        ? <InterfaceText messageKey="questionariRequereixDomini" values={{ domain: requiredDomain }} />
                        : <InterfaceText messageKey="noSHaPogutValidarLAccesDocentRevisaElCodi" />}
                    </p>
                  </div>
                )}
                <ParticipantCodeAccessForm authenticated />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-semibold tracking-tight"><InterfaceText messageKey="questionaris" /></h1>
              <div className="mt-8 grid gap-4">
                {participations.length === 0 ? (
                  <p className="rounded-2xl border border-line bg-surface p-6 text-muted"><InterfaceText messageKey="encaraNoHiHaCapParticipacioVinculadaAAquestCompte" /></p>
                ) : participations.map((item) => (
                  <article className="rounded-2xl border border-line bg-surface p-6" key={item.publicCode}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-action">{item.centreName}</p>
                        <h2 className="mt-1 text-xl font-semibold">{item.questionnaireTitle}</h2>
                        <p className="mt-2 text-sm text-muted"><InterfaceText messageKey="versio" />{" "}{item.questionnaireVersion} · {formatDate(item.completedAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link className="rounded-xl bg-action px-4 py-2 text-sm font-semibold text-action-contrast" href={`/docent/resultats/${item.publicCode}`}><InterfaceText messageKey="veureResultats" /></Link>
                        <form action="/api/docent/results/pdf" method="post">
                          <input name="publicCode" type="hidden" value={item.publicCode} />
                          <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" type="submit"><InterfaceText messageKey="descarregaPdf" /></button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </ParticipantWorkspaceFrame>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(new Date(value));
}
