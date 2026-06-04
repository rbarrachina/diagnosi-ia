import { CreateSpaceForm } from "@/components/create-space/create-space-form";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Diagnosi IA
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
            Diagnosi anònima del claustre
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Genera un codi públic per compartir el qüestionari amb el
            professorat. També es crearà un enllaç privat per consultar els
            resultats de conjunt.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <CreateSpaceForm />
        </div>
      </section>
    </main>
  );
}
