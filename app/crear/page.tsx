import { redirect } from "next/navigation";

import {
  ResponsibleForbiddenNotice,
} from "@/components/auth/auth-actions";
import { CentreManagementHeader } from "@/components/create-space/centre-management-header";
import { CentreOnboarding } from "@/components/create-space/centre-onboarding";
import { CreateSpaceForm } from "@/components/create-space/create-space-form";
import { getCommunicationTemplate } from "@/lib/admin/communication-settings";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { isActiveAdminUser } from "@/lib/auth/responsible-access";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { listOwnerSpaces } from "@/lib/spaces/manage-spaces";
import {
  getCentreProfileForUser,
  registerCentreAccount,
} from "@/lib/centres/centre-profiles";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getResponsibleSessionState();

  if (session.status === "unauthenticated") {
    redirect("/");
  }

  const isAdmin =
    session.status === "authenticated"
      ? await isActiveAdminUser(session.user.id)
      : false;
  const centre =
    session.status === "authenticated"
      ? (await registerCentreAccount(session.user, {
          allowNonCentre: isAdmin,
        })) ?? (await getCentreProfileForUser(session.user.id))
      : null;
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

        {session.status === "authenticated" && centre && (
          !centre.profileConfirmedAt || !centre.emailPolicyConfiguredAt
        ) ? (
          <CentreOnboarding centre={centre} email={session.user.email} />
        ) : null}

        {session.status === "authenticated" &&
        (!centre || (centre.profileConfirmedAt && centre.emailPolicyConfiguredAt)) ? (
          <>
            <div className="w-full max-w-2xl">
              <CentreManagementHeader
                centre={centre}
                collapseCentreProfile
                email={session.user.email}
              />
              <CreateSpaceForm
                communicationTemplate={communicationTemplate}
                centreName={centre?.displayName ?? session.user.displayName ?? session.user.email}
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
