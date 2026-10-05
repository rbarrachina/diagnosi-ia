import { InterfaceText } from "@/components/i18n/interface-text";
import { IconLogoutButton } from "@/components/auth/auth-actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { getCurrentParticipantUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getParticipantResult, listParticipantResults } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";
import { ParticipantDimensionResults } from "@/components/participants/participant-dimension-results";
import { ParticipantWorkspaceFrame } from "@/components/participants/participant-workspace-frame";
import { SCALE_OPTIONS } from "@/lib/questionnaire/scale";

export const dynamic = "force-dynamic";

export default async function ParticipantResultPage({ params }: { params: Promise<{ publicCode: string }> }) {
  if ((await getResponsiblePortalStatus()) === "closed") {
    redirect("/auth/error?reason=service-closed");
  }

  const { publicCode } = await params;
  if (!isPublicCode(publicCode)) notFound();
  const user = await getCurrentParticipantUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/docent/resultats/${publicCode}`)}`);
  const result = await getParticipantResult({ participantUserId: user.id, publicCode });
  if (!result) notFound();
  const participations = await listParticipantResults(user.id);

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader
        brandHref="/docent"
        contentWidth="wide"
        leadingControls={
          <span className="max-w-20 truncate text-right text-xs font-semibold text-ink sm:max-w-48 sm:text-sm lg:max-w-64" title={result.centreName}>
            {result.centreName}
          </span>
        }
      >
        <ThemeToggle />
        <IconLogoutButton next="/" />
      </AppHeader>
      <ParticipantWorkspaceFrame
        activePublicCode={publicCode}
        participations={participations.map(({ publicCode: code, questionnaireTitle }) => ({ publicCode: code, questionnaireTitle }))}
        view="result"
      >
        <section className="mx-auto w-full px-5 pb-24 pt-12 sm:px-8 md:pb-20">
          <h1 className="sr-only"><InterfaceText messageKey="resultatIndividual" /></h1>
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <Link className="inline-flex min-h-10 items-center justify-center rounded-full border border-action bg-accent-soft px-5 py-2 text-sm font-semibold text-action shadow-sm transition hover:bg-action hover:text-action-contrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper" href="/docent?view=questionnaires">
              <InterfaceText messageKey="lesMevesDiagnosis2" />
            </Link>
            <form action="/api/docent/results/pdf" method="post">
              <input name="publicCode" type="hidden" value={result.publicCode} />
              <button className="min-h-10 rounded-xl bg-action px-4 py-2 text-sm font-semibold text-action-contrast" type="submit">
                <InterfaceText messageKey="descarregaElPdf" />
              </button>
            </form>
          </div>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-semibold leading-7 text-ink sm:text-lg">
              {result.questionnaireTitle}{" "}<InterfaceText messageKey="versio2" />{" "}{result.questionnaireVersion}
            </span>
            <span className="text-sm leading-6 text-muted">· {formatDate(result.completedAt)}</span>
          </p>
          <ParticipantDimensionResults blocks={result.blocks} />
          <h2 className="mt-12 scroll-mt-8 text-2xl font-semibold" id="detall-per-blocs"><InterfaceText messageKey="detallPerBlocs" /></h2>
          <div className="mt-8 space-y-6">
            {result.blocks.map((block) => (
              <details className="group scroll-mt-8 rounded-2xl border border-line bg-surface" id={`bloc-${block.position}`} key={block.position}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-xl font-semibold">
                  <span>{block.position}. {block.title}</span>
                  <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="space-y-7 border-t border-line p-6">
                  {[...new Map(block.questions.map((question) => [question.criterionPosition, question])).values()].map((criterion) => (
                    <section key={criterion.criterionPosition}>
                      <h3 className="mb-4 text-base font-semibold">{block.position}.{criterion.criterionPosition} · {criterion.criterionTitle}</h3>
                      <ol className="space-y-6">
                        {block.questions.filter((question) => question.criterionPosition === criterion.criterionPosition).map((question) => (
                          <li className="border-t border-line pt-4 first:border-t-0 first:pt-0" key={question.position}>
                            <p className="font-medium">{block.position}.{question.criterionPosition}.{question.questionPosition}. {question.text}</p>
                            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {question.options.map((option) => {
                          const selected = option.value === question.value;
                          const colorClasses = question.randomizeOptions
                            ? "questionnaire-random-option"
                            : SCALE_OPTIONS.find((item) => item.value === option.value)?.formClasses ?? "border-line bg-surface";
                          return (
                            <li key={option.value}>
                              <div
                                aria-current={selected ? "true" : undefined}
                                className={`questionnaire-answer-option flex min-h-14 items-center rounded-xl border px-4 py-3 text-sm text-ink ${colorClasses}${selected ? " questionnaire-answer-option-selected" : ""}`}
                              >
                                <span>{option.label}</span>
                                {selected ? <span className="sr-only"><InterfaceText messageKey="respostaSeleccionada" /></span> : null}
                              </div>
                            </li>
                          );
                              })}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </ParticipantWorkspaceFrame>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
