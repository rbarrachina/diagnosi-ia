import {
  LogoutButton,
  XtecAccessNotice,
  XtecForbiddenNotice,
} from "@/components/auth/auth-actions";
import { OwnerSpacesList } from "@/components/spaces/owner-spaces-list";
import { getXtecSessionState } from "@/lib/auth/session";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { listOwnerSpaces } from "@/lib/spaces/manage-spaces";

export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  const session = await getXtecSessionState();

  if (session.status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
          <XtecAccessNotice next="/espais" />
        </section>
      </main>
    );
  }

  if (session.status === "forbidden") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
          <XtecForbiddenNotice />
        </section>
      </main>
    );
  }

  const spaces = await listOwnerSpaces(
    session.user.id,
    await getServerAppUrl(),
  );

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
              Espais diagnòstics
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">
              Els meus espais
            </h1>
            <p className="mt-3 text-sm text-slate-700">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
              href="/crear"
            >
              Crear qüestionari
            </a>
            <LogoutButton next="/" />
          </div>
        </div>

        <OwnerSpacesList spaces={spaces} />
      </section>
    </main>
  );
}
