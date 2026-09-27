import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import { ParticipantCodeAccessForm } from "@/components/participants/code-access-form";
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
  searchParams: Promise<{ error?: string; code?: string }>;
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
  const { error, code } = await searchParams;
  const requiredDomain = error === "participant-access"
    ? await getParticipantAccessErrorDomain(user, code)
    : null;

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader brandHref="/docent">
        <ThemeToggle />
        <LogoutButton next="/" />
      </AppHeader>
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
          <InterfaceText messageKey="accesPrivat" />
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          <InterfaceText messageKey="lesMevesDiagnosis" />
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          <InterfaceText messageKey="nomesEsMostrenLesParticipacionsVinculadesDeManeraPseudonimaAlCompte" />
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold"><InterfaceText messageKey="accedeixAUnAltreQuestionari" /></h2>
          {error === "participant-access" && (
            <div className="mt-4 rounded-xl border border-danger-border bg-danger-bg p-4 text-danger-text" role="alert">
              <p className="font-semibold"><InterfaceText messageKey="noSHaPogutAccedirAlQuestionari" /></p>
              <p className="mt-2 text-sm">
                {requiredDomain
                  ? <InterfaceText messageKey="questionariRequereixDomini" values={{ domain: requiredDomain }} />
                  : <InterfaceText messageKey="noSHaPogutValidarLAccesDocentRevisaElCodi" />}
              </p>
            </div>
          )}
          <div className="mt-4"><ParticipantCodeAccessForm authenticated /></div>
        </div>

        <div className="mt-8 grid gap-4">
          {participations.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-6 text-muted">
              <InterfaceText messageKey="encaraNoHiHaCapParticipacioVinculadaAAquestCompte" />
            </p>
          ) : participations.map((item) => (
            <article className="rounded-2xl border border-line bg-surface p-6" key={item.publicCode}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-action">{item.centreName}</p>
                  <h2 className="mt-1 text-xl font-semibold">{item.questionnaireTitle}</h2>
                  <p className="mt-2 text-sm text-muted">
                    <InterfaceText messageKey="versio" />{" "}{item.questionnaireVersion} · {formatDate(item.completedAt)}{" "}<InterfaceText messageKey="puntuacio" />{" "}{item.globalScore.toFixed(1)}%
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="rounded-xl bg-action px-4 py-2 text-sm font-semibold text-action-contrast" href={`/docent/resultats/${item.publicCode}`}>
                    <InterfaceText messageKey="veureResultats" />
                  </Link>
                  <form action="/api/docent/results/pdf" method="post">
                    <input name="publicCode" type="hidden" value={item.publicCode} />
                    <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" type="submit">
                      <InterfaceText messageKey="descarregaPdf" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(new Date(value));
}
