import { CentreLoginDialog } from "@/components/home/centre-login-dialog";
import { QuestionPreview } from "@/components/home/question-preview";
import { SiteFooter } from "@/components/home/site-footer";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="app-shell min-h-screen overflow-hidden bg-paper text-ink">
      <AppHeader brandHref="#inici">
        <ThemeToggle />
        <CentreLoginDialog
          ariaLabel="Accés XTEC"
          className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-action text-white shadow-[0_8px_24px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-0.5 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
        >
          <AccessIcon />
        </CentreLoginDialog>
      </AppHeader>

      <section
        className="home-hero relative flex min-h-[100svh] items-center px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32"
        id="inici"
      >
        <div aria-hidden="true" className="app-grid absolute inset-0 opacity-50" />
        <div aria-hidden="true" className="app-orb app-orb-left" />
        <div aria-hidden="true" className="app-orb app-orb-right" />

        <div className="relative mx-auto w-full max-w-6xl -translate-y-6 text-center sm:-translate-y-12">
          <p className="mx-auto inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_5px_var(--app-dot-ring)]" />
            Eina per a centres educatius
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_5px_var(--app-dot-ring)]" />
          </p>

          <h1 className="mx-auto mt-5 max-w-5xl text-balance text-[clamp(2.75rem,7vw,6.6rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            Diagnosi de la{" "}
            <span className="home-title-gradient">
              competència digital docent en IA
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-xl sm:leading-8">
            Coneix el punt de partida del claustre i obtén-ne una visió de
            conjunt per orientar l’ús educatiu de la intel·ligència artificial.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <CentreLoginDialog
              className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-action px-7 text-base font-semibold text-white shadow-[0_18px_50px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-1 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper sm:w-auto sm:min-w-72 sm:text-lg"
            >
              Accedeix amb el compte de centre
              <ArrowIcon />
            </CentreLoginDialog>
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted">
            <TrustItem label="Participació anònima" />
            <TrustItem label="Resultats col·lectius" />
            <TrustItem label="Creada per al claustre" />
          </div>
        </div>

        <a
          aria-label="Ves a la informació sobre la diagnosi"
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-muted transition hover:text-action sm:flex"
          href="#com-funciona"
        >
          Descobreix-ne més
          <span className="home-scroll-cue flex h-9 w-6 justify-center rounded-full border border-line pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-action" />
          </span>
        </a>
      </section>

      <section
        className="relative border-t border-line bg-section px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-6xl" id="com-funciona">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
              Un objectiu, dos rols
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Una diagnosi compartida per avançar amb criteri
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Una base pedagògica comuna, un espai gestionat pel centre i una
              participació docent anònima.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="foundation" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Fonament pedagògic
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                Una diagnosi amb criteri
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                L’eina ajuda a conèixer el punt de partida del claustre i pren
                com a base la documentació de competència digital docent i les
                <cite className="not-italic">
                  {" "}orientacions per a l’ús de la IA als centres educatius
                </cite>
                .
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium leading-6 text-muted">
                <CheckIcon />
                <span>
                  [OIA-12] Fer una diagnosi de quina és la competència digital
                  docent en IA del claustre
                </span>
              </p>
            </article>

            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="centre" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Responsable del centre
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                El centre gestiona
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                La persona responsable crea i configura l’espai de diagnosi,
                comparteix el qüestionari amb el claustre i consulta els
                resultats de conjunt del centre.
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-muted">
                <CheckIcon /> Un únic espai de diagnosi per centre
              </p>
            </article>

            <article className="home-card flex flex-col rounded-3xl border border-line p-7 sm:p-8">
              <RoleIcon type="teacher" />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Participació anònima
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                El docent respon
              </h3>
              <p className="mt-4 flex-1 leading-7 text-muted">
                Cada docent respon anònimament des de l’enllaç que rep per
                correu del seu centre. No pot crear cap compte a l’aplicació i
                les respostes només es presenten de manera agregada.
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-muted">
                <CheckIcon /> Participació anònima i resultats de conjunt
              </p>
            </article>
          </div>

          <div className="mt-14 flex justify-center">
            <a
              aria-label="Ves a la mostra del qüestionari"
              className="home-scroll-cue flex h-9 w-6 justify-center rounded-full border border-line pt-2 transition hover:border-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
              href="#mostra-questionari"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-action" />
            </a>
          </div>
        </div>
      </section>

      <QuestionPreview />

      <SiteFooter />
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
