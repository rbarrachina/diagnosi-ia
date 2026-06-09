type AuthErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const message =
    reason === "xtec"
      ? "Només es permet l’accés amb un compte XTEC."
      : "No s’ha pogut completar l’autenticació.";

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
          <h1 className="text-2xl font-semibold">Accés no autoritzat</h1>
          <p className="mt-3 text-sm leading-6">{message}</p>
          <a
            className="mt-6 inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
            href="/crear"
          >
            Torna a l’inici
          </a>
        </div>
      </section>
    </main>
  );
}
