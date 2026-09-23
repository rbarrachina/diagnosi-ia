import { CentreLoginDialog } from "@/components/home/centre-login-dialog";
import { QuestionPreview } from "@/components/home/question-preview";
import { SiteFooter } from "@/components/home/site-footer";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { ParticipantCodeAccessForm } from "@/components/participants/code-access-form";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";
import { getCurrentLanguage } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [portalStatus, language] = await Promise.all([
    getResponsiblePortalStatus(),
    getCurrentLanguage(),
  ]);
  const responsiblePortalOpen = portalStatus === "open";
  const copy = getMessages(language).home;

  return (
    <main className="app-shell min-h-screen overflow-hidden bg-paper text-ink">
      <AppHeader brandHref="#inici">
        <ThemeToggle />
        <CentreLoginDialog
          ariaLabel={responsiblePortalOpen ? copy.centreAccess : copy.centreAccessSoon}
          className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-action text-action-contrast shadow-[0_8px_24px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-0.5 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={!responsiblePortalOpen}
        >
          <AccessIcon />
        </CentreLoginDialog>
      </AppHeader>

      <section
        className="home-hero relative flex min-h-[100svh] items-center px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32"
        id="inici"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="app-grid absolute inset-0 opacity-50" />
        <div aria-hidden="true" className="app-orb app-orb-left" />
        <div aria-hidden="true" className="app-orb app-orb-right" />

        <div className="relative mx-auto w-full max-w-6xl -translate-y-6 text-center sm:-translate-y-12">
          <p className="mx-auto inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_5px_var(--app-dot-ring)]" />
            {copy.eyebrow}
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_5px_var(--app-dot-ring)]" />
          </p>

          <h1 className="mx-auto mt-5 max-w-5xl text-balance text-[clamp(2.75rem,7vw,6.6rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            {copy.titlePrefix}{" "}
            <span className="home-title-gradient">
              {copy.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-xl sm:leading-8">
            {copy.introduction}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CentreLoginDialog
              ariaLabel={responsiblePortalOpen ? undefined : copy.centreAccessSoon}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-action px-7 text-base font-semibold text-action-contrast shadow-[0_18px_50px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-1 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-w-72 sm:text-lg"
              disabled={!responsiblePortalOpen}
            >
              {responsiblePortalOpen
                ? copy.centreButton
                : copy.centreAccessSoon}
              {responsiblePortalOpen ? <ArrowIcon /> : null}
            </CentreLoginDialog>
            <a className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-line bg-surface px-7 text-base font-semibold text-ink sm:w-auto" href="#acces-docent">
              {copy.teacherButton}
            </a>
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted">
            <TrustItem label={copy.trustPseudonym} />
            <TrustItem label={copy.trustAggregate} />
            <TrustItem label={copy.trustStaff} />
          </div>
        </div>

        <a
          aria-label={copy.diagnosisInfo}
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-muted transition hover:text-action sm:flex"
          href="#com-funciona"
        >
          {copy.discover}
          <span className="home-scroll-cue flex h-9 w-6 justify-center rounded-full border border-line pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-action" />
          </span>
        </a>
      </section>

      <section
        className="relative flex min-h-[100svh] items-center border-t border-line bg-section px-5 py-14 sm:px-8 sm:py-16"
        id="com-funciona"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
              {copy.rolesEyebrow}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {copy.rolesTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted lg:whitespace-nowrap">
              {copy.rolesIntro}
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="foundation" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                {copy.foundationEyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                {copy.foundationTitle}
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                {copy.foundationText}
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium leading-6 text-muted">
                <CheckIcon />
                <span>
                  {copy.foundationCheck}
                </span>
              </p>
            </article>

            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="centre" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                {copy.centreEyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                {copy.centreTitle}
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                {copy.centreText}
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-muted">
                <CheckIcon /> {copy.centreCheck}
              </p>
            </article>

            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="teacher" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                {copy.privacyEyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                {copy.privacyTitle}
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                {copy.privacyText}
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-muted">
                <CheckIcon /> {copy.privacyCheck}
              </p>
            </article>
          </div>

          <div className="mt-8 flex justify-center">
            <a
              aria-label={copy.questionnaireSampleLink}
              className="home-scroll-cue flex h-9 w-6 justify-center rounded-full border border-line pt-2 transition hover:border-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
              href="#mostra-questionari"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-action" />
            </a>
          </div>
        </div>
      </section>

      <QuestionPreview />

      <div className="flex min-h-[100svh] flex-col">
        <section className="flex flex-1 items-center border-t border-line bg-paper px-5 py-10 sm:px-8 sm:py-12" id="acces-docent">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-action">
              {copy.teacherEyebrow}
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl border border-line bg-surface p-7 shadow-[0_14px_40px_var(--app-shadow)] sm:p-9">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.teacherTitle}</h2>
                <p className="mt-4 leading-7 text-muted">{copy.teacherHelp}</p>
                <div className="mt-6">
                  <ParticipantCodeAccessForm disabled={!responsiblePortalOpen} />
                </div>
              </article>

              <article className="flex flex-col rounded-3xl border border-line bg-surface p-7 shadow-[0_14px_40px_var(--app-shadow)] sm:p-9">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {copy.teacherHistoryTitle}
                </h2>
                <p className="mt-4 flex-1 leading-7 text-muted">
                  {copy.teacherHistoryHelp}
                </p>
                {responsiblePortalOpen ? (
                  <a
                    className="group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-action bg-surface px-5 text-sm font-semibold text-action transition hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper sm:w-auto sm:self-start"
                    href="/docent"
                  >
                    {copy.teacherHistory}
                    <ArrowIcon />
                  </a>
                ) : (
                  <span className="mt-6 inline-flex cursor-not-allowed text-sm font-semibold text-muted opacity-60">
                    {copy.teacherAccessSoon}
                  </span>
                )}
              </article>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <CheckIcon /> {label}
    </span>
  );
}

function AccessIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="M14 8 18 12l-4 4M18 12H7M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-action" fill="none" viewBox="0 0 24 24">
      <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function RoleIcon({ type }: { type: "centre" | "foundation" | "teacher" }) {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-action">
      {type === "foundation" ? (
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path d="M5 4.5h10a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M7 20a2 2 0 0 1 0-4h10M9 8h4M9 11h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      ) : type === "centre" ? (
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-5h6v5M9 11h.01M15 11h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.5-4 3-6 7-6s6.5 2 7 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      )}
    </span>
  );
}
