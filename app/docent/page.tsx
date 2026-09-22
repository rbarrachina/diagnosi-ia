import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import { ParticipantCodeAccessForm } from "@/components/participants/code-access-form";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { getCurrentAuthenticatedUser } from "@/lib/auth/session";
import { listParticipantResults } from "@/lib/repositories/participant-results";
import { getResponsiblePortalStatus } from "@/lib/auth/responsible-access";

export const dynamic = "force-dynamic";

export default async function ParticipantAreaPage() {
  if ((await getResponsiblePortalStatus()) === "closed") {
    redirect("/auth/error?reason=service-closed");
  }

  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return (
      <main className="app-shell min-h-screen bg-paper text-ink">
        <AppHeader brandHref="/"><ThemeToggle /></AppHeader>
        <section className="mx-auto max-w-2xl px-5 pb-16 pt-32 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Àrea docent</h1>
          <p className="mt-4 text-muted">Inicia sessió amb el mateix compte Google que vas utilitzar per participar.</p>
          <div className="mt-7"><LoginButton label="Accedeix amb Google" next="/docent" /></div>
        </section>
      </main>
    );
  }

  const participations = await listParticipantResults(user.id);

  return (
    <main className="app-shell min-h-screen bg-paper text-ink">
      <AppHeader brandHref="/docent">
        <ThemeToggle />
        <LogoutButton next="/" />
      </AppHeader>
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">Accés privat</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Les meves diagnosis</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Només es mostren les participacions vinculades de manera pseudònima al compte actual. No es mostra ni es desa aquí el teu nom o correu.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Accedeix a un altre qüestionari</h2>
          <div className="mt-4"><ParticipantCodeAccessForm /></div>
        </div>

        <div className="mt-8 grid gap-4">
          {participations.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-6 text-muted">Encara no hi ha cap participació vinculada a aquest compte.</p>
          ) : participations.map((item) => (
            <article className="rounded-2xl border border-line bg-surface p-6" key={item.publicCode}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-action">{item.centreName}</p>
                  <h2 className="mt-1 text-xl font-semibold">{item.questionnaireTitle}</h2>
                  <p className="mt-2 text-sm text-muted">Versió {item.questionnaireVersion} · {formatDate(item.completedAt)} · Puntuació {item.globalScore.toFixed(1)}%</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="rounded-xl bg-action px-4 py-2 text-sm font-semibold text-action-contrast" href={`/docent/resultats/${item.publicCode}`}>Veure resultats</Link>
                  <form action="/api/docent/results/pdf" method="post">
                    <input name="publicCode" type="hidden" value={item.publicCode} />
                    <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" type="submit">Descarrega PDF</button>
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
