import { redirect } from "next/navigation";

import {
  LogoutButton,
  ResponsibleForbiddenNotice,
} from "@/components/auth/auth-actions";
import { CreateSpaceForm } from "@/components/create-space/create-space-form";
import { getCommunicationTemplate } from "@/lib/admin/communication-settings";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { listOwnerSpaces } from "@/lib/spaces/manage-spaces";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getResponsibleSessionState();

  if (session.status === "unauthenticated") {
    redirect("/");
  }

  const ownerSpaces =
    session.status === "authenticated"
      ? await listOwnerSpaces(session.user.id, await getServerAppUrl())
      : [];
  const communicationTemplate =
    session.status === "authenticated"
      ? await getCommunicationTemplate()
      : { subject: "", body: "" };
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
        </div>

        {session.status === "forbidden" ? (
          <div className="w-full max-w-xl">
            <ResponsibleForbiddenNotice reason={session.reason} />
          </div>
        ) : null}

        {session.status === "authenticated" ? (
          <>
            <div className="mb-4 flex w-full max-w-2xl items-center justify-between rounded-md border border-line bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
              <span>
                Sessió iniciada com <strong>{session.user.email}</strong>
              </span>
              <LogoutButton next="/" />
            </div>
            <div className="w-full max-w-2xl">
              <CreateSpaceForm
                communicationTemplate={communicationTemplate}
                existingSpace={existingSpace}
                responsibleEmail={session.user.email}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
