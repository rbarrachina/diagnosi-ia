import { CreateSpaceForm } from "@/components/create-space/create-space-form";
import { ParticipantInfoCard } from "@/components/create-space/participant-info-card";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Competència digital docent en IA
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Diagnosi IA
          </h1>
          <p className="mx-auto mt-5 max-w-2xl space-y-1 text-lg leading-8 text-slate-700">
            <span className="block">
              Aquesta diagnosi s’organitza segons el rol de cada usuari.
            </span>
            <span className="block">
              El responsable del centre genera el qüestionari per al claustre i
              pot
            </span>
            <span className="block">
              consultar-ne els resultats de conjunt.
            </span>
            <span className="block">
              El professorat respon el qüestionari a partir de l’enllaç
              facilitat pel centre.
            </span>
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <CreateSpaceForm />
          <ParticipantInfoCard />
        </div>
      </section>
    </main>
  );
}
