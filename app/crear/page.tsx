import {
  LogoutButton,
  XtecAccessNotice,
  XtecForbiddenNotice,
} from "@/components/auth/auth-actions";
import { CreateSpaceForm } from "@/components/create-space/create-space-form";
import { ParticipantInfoCard } from "@/components/create-space/participant-info-card";
import { getXtecSessionState } from "@/lib/auth/session";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { listOwnerSpaces } from "@/lib/spaces/manage-spaces";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getXtecSessionState();
  const ownerSpaces =
    session.status === "authenticated"
      ? await listOwnerSpaces(session.user.id, await getServerAppUrl())
      : [];
  const existingSpace = ownerSpaces[0] ?? null;

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

        {session.status === "unauthenticated" ? (
          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <XtecAccessNotice />
            <ParticipantInfoCard />
          </div>
        ) : null}

        {session.status === "forbidden" ? (
          <div className="w-full max-w-xl">
            <XtecForbiddenNotice />
          </div>
        ) : null}

        {session.status === "authenticated" ? (
          <>
            <div className="mb-4 flex w-full max-w-2xl items-center justify-between rounded-md border border-line bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
              <span>
                Sessió iniciada com <strong>{session.user.email}</strong>
              </span>
              <LogoutButton next="/crear" />
            </div>
            <div className="w-full max-w-2xl">
              <CreateSpaceForm existingSpace={existingSpace} />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
