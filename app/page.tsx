import { XtecAccessNotice } from "@/components/auth/auth-actions";
import { ParticipantInfoCard } from "@/components/create-space/participant-info-card";
import type { ResponsibleAccessMode } from "@/lib/auth/responsible-access";

export const dynamic = "force-dynamic";

export default async function Home() {
  const responsibleAccessMode = await getResponsibleAccessModeForNotice();

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-10 text-center sm:py-14">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Competència digital docent en IA
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Diagnosi IA
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Eina per fer una diagnosi de la competència digital docent en IA
            del claustre i obtenir una lectura de conjunt del punt de partida
            del centre.
          </p>
        </header>

        <div className="mt-8 w-full max-w-3xl rounded-md border border-line bg-white px-5 py-4 shadow-sm">
          <p className="text-[18px] font-semibold text-ink">
            Orientacions per a l’ús de la IA als centres educatius
          </p>
          <p className="text-sm font-semibold text-ink">Indicador OIA-12</p>
          <p className="mt-2 text-base leading-7 text-slate-700">
            Fer una diagnosi de quina és la competència digital docent en IA
            del claustre.
          </p>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
          Les respostes són anònimes, no s&apos;hi introdueix el nom del centre
          i els resultats es consulten només en conjunt.
        </p>

        <div className="mt-9 w-full">
          <div className="mx-auto max-w-3xl text-lg leading-8 text-slate-700">
            <p>Aquesta diagnosi s’organitza segons el rol de cada usuari.</p>
          </div>

          <div className="mt-6 grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex h-full flex-col">
              <p className="mb-4 flex items-center justify-center text-lg leading-8 text-slate-700 md:min-h-16">
                🏫 El responsable del centre genera el qüestionari per al
                claustre i en consulta els resultats de conjunt.
              </p>
              <div className="flex-1">
                <XtecAccessNotice
                  next="/crear"
                  responsibleAccessMode={responsibleAccessMode}
                />
              </div>
            </div>

            <div className="flex h-full flex-col">
              <p className="mb-4 flex items-center justify-center text-lg leading-8 text-slate-700 md:min-h-16">
                🧑‍🏫 El professorat respon des de l’enllaç facilitat pel
                responsable.
              </p>
              <div className="flex-1">
                <ParticipantInfoCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getResponsibleAccessModeForNotice(): Promise<ResponsibleAccessMode> {
  try {
    const { getResponsibleAccessMode } = await import(
      "@/lib/auth/responsible-access"
    );

    return await getResponsibleAccessMode();
  } catch {
    return "all_xtec";
  }
}
