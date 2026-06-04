import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Orientacions IA · OIA-12
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Diagnosi IA
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Eina per fer una diagnosi anònima de la competència digital docent
            en IA del claustre i obtenir una lectura de conjunt del punt de
            partida del centre.
          </p>

          <div className="mx-auto mt-9 max-w-2xl rounded-md border border-line bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-ink">Indicador OIA-12</p>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Fer una diagnosi de quina és la competència digital docent en IA
              del claustre.
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-slate-600">
            Les respostes són anònimes, no s&apos;hi introdueix el nom del
            centre i els resultats es consulten només en conjunt.
          </p>

          <Link
            className="mt-8 inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
            href="/crear"
          >
            Comença la diagnosi
          </Link>
        </div>
      </section>
    </main>
  );
}
