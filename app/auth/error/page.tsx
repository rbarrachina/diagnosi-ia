import Link from "next/link";

type AuthErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const serviceClosed = reason === "service-closed";
  const message =
    serviceClosed
      ? "El servei encara no està disponible. Torna-ho a provar quan s’hagi obert des de l’administració."
      : reason === "centre-access-closed"
      ? "L’accés dels centres encara no està disponible. Torna-ho a provar quan s’hagi obert el servei."
      : reason === "centre-suspended"
        ? "L’accés d’aquest centre està suspès. Contacta amb l’administració de l’aplicació."
      : reason === "centre-account-required"
        ? "Cal accedir amb un compte oficial de centre XTEC o amb un compte administrador actiu."
      : reason === "xtec"
      ? "Només es permet l’accés amb un compte XTEC."
      : reason === "participant-domain" || reason === "participant-access"
        ? "No s’ha pogut validar l’accés docent. Revisa el codi o torna-ho a provar més endavant."
      : "No s’ha pogut completar l’autenticació.";

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {serviceClosed ? "Servei en prellançament" : "Accés no autoritzat"}
          </h1>
          <p className="mt-3 text-sm leading-6">{message}</p>
          <Link
            className="mt-6 inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-action-contrast transition hover:bg-action-hover"
            href="/"
          >
            Torna a l’inici
          </Link>
        </div>
      </section>
    </main>
  );
}
