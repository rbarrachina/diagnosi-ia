const checklist = [
  "Next.js App Router",
  "TypeScript estricte",
  "Tailwind CSS",
  "Lint i proves",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Bootstrap tecnic
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Diagnosi IA
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Base inicial preparada per construir una diagnosi anonima i agregada
            sobre l&apos;us educatiu de la intel.ligencia artificial.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {checklist.map((item) => (
            <div
              className="rounded-md border border-line bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
