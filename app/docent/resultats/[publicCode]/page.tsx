import { InterfaceText } from "@/components/i18n/interface-text";
import { IconLogoutButton } from "@/components/auth/auth-actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { getCurrentParticipantUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getParticipantResult } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";
import { BlockStageBar } from "@/components/participants/block-stage-bar";

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

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader
        brandHref="/docent"
        leadingControls={
          <span className="max-w-20 truncate text-right text-xs font-semibold text-ink sm:max-w-48 sm:text-sm lg:max-w-64" title={result.centreName}>
            {result.centreName}
          </span>
        }
      >
        <ThemeToggle />
        <IconLogoutButton next="/" />
      </AppHeader>
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
        <h1 className="sr-only"><InterfaceText messageKey="resultatIndividual" /></h1>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <Link className="inline-flex min-h-10 items-center justify-center rounded-full border border-action bg-accent-soft px-5 py-2 text-sm font-semibold text-action shadow-sm transition hover:bg-action hover:text-action-contrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper" href="/docent">
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
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.blocks.map((block) => <BlockStageBar block={block} key={block.position} />)}
        </div>
        <h2 className="mt-12 text-2xl font-semibold"><InterfaceText messageKey="detallPerBlocs" /></h2>
        <div className="mt-8 space-y-6">
          {result.blocks.map((block) => (
            <section className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6" id={`bloc-${block.position}`} key={block.position} tabIndex={-1}>
              <h3 className="text-xl font-semibold">{block.position}. {block.title}</h3>
              <ol className="mt-5 space-y-4">
                {block.questions.map((question) => (
                  <li className="border-t border-line pt-4" key={question.position}>
                    <p className="font-medium">{block.position}.{question.blockPosition}. {question.text}</p>
                    <p className="mt-2 text-sm text-muted">
                      <InterfaceText messageKey="respostaSeleccionada" />{" "}<strong className="text-ink">{question.value} · {question.label}</strong>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
