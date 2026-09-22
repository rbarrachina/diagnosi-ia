import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { getCurrentAuthenticatedUser } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getParticipantResult } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const dynamic = "force-dynamic";

export default async function ParticipantResultPage({ params }: { params: Promise<{ publicCode: string }> }) {
  if ((await getResponsiblePortalStatus()) === "closed") {
    redirect("/auth/error?reason=service-closed");
  }

  const { publicCode } = await params;
  if (!isPublicCode(publicCode)) notFound();
  const user = await getCurrentAuthenticatedUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/docent/resultats/${publicCode}`)}`);
  const result = await getParticipantResult({ participantUserId: user.id, publicCode });
  if (!result) notFound();

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader brandHref="/docent"><ThemeToggle /></AppHeader>
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
        <Link className="text-sm font-semibold text-action" href="/docent">← Les meves diagnosis</Link>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-action">{result.centreName}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Resultat individual</h1>
        <p className="mt-3 text-muted">{result.questionnaireTitle} · Versió {result.questionnaireVersion} · {formatDate(result.completedAt)}</p>
        <div className="mt-7 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-6">
          <div><p className="text-sm text-muted">Puntuació global</p><p className="text-3xl font-bold">{result.globalScore.toFixed(1)}%</p></div>
          <form action="/api/docent/results/pdf" className="sm:ml-auto" method="post">
            <input name="publicCode" type="hidden" value={result.publicCode} />
            <button className="rounded-xl bg-action px-5 py-3 font-semibold text-action-contrast" type="submit">Descarrega el PDF</button>
          </form>
        </div>
        <div className="mt-8 space-y-6">
          {result.blocks.map((block) => (
            <section className="rounded-2xl border border-line bg-surface p-6" key={block.position}>
              <div className="flex items-baseline justify-between gap-4"><h2 className="text-xl font-semibold">{block.position}. {block.title}</h2><strong>{block.score.toFixed(1)}%</strong></div>
              <ol className="mt-5 space-y-4">
                {block.questions.map((question) => (
                  <li className="border-t border-line pt-4" key={question.position}>
                    <p className="font-medium">{block.position}.{question.blockPosition}. {question.text}</p>
                    <p className="mt-2 text-sm text-muted">Resposta seleccionada: <strong className="text-ink">{question.value} · {question.label}</strong></p>
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
