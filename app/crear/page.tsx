import { redirect } from "next/navigation";

import {
  ResponsibleForbiddenNotice,
} from "@/components/auth/auth-actions";
import { CentreAppShell } from "@/components/create-space/centre-app-shell";
import { CentreOnboarding } from "@/components/create-space/centre-onboarding";
import { CentreWorkspace } from "@/components/create-space/centre-workspace";
import { SiteFooter } from "@/components/home/site-footer";
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

type CreatePageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const requestedView = (await searchParams).view;
  const initialView =
    requestedView === "profile" || requestedView === "settings"
      ? requestedView
      : "questionnaire";
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
  const accountName = session.status === "authenticated"
    ? session.user.displayName ?? centre?.accountDisplayName ?? session.user.email
    : "";

  return (
    <CentreAppShell
      account={
        session.status === "authenticated"
          ? { email: session.user.email, name: accountName }
          : undefined
      }
    >

      {session.status === "forbidden" ? (
        <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-10">
          <div className="w-full max-w-xl">
            <ResponsibleForbiddenNotice reason={session.reason} />
          </div>
        </section>
      ) : null}

      {session.status === "authenticated" && centre && (
        !centre.profileConfirmedAt || !centre.emailPolicyConfiguredAt
      ) ? (
        <section className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 pb-24 pt-28 sm:px-8 lg:px-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
              Espai del centre
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">
              Configuració inicial
            </h1>
          </div>
          <CentreOnboarding centre={centre} />
        </section>
      ) : null}

      {session.status === "authenticated" &&
      (!centre || (centre.profileConfirmedAt && centre.emailPolicyConfiguredAt)) ? (
        <CentreWorkspace
          centre={centre}
          communicationTemplate={communicationTemplate}
          centreName={centre?.displayName ?? session.user.displayName ?? session.user.email}
          existingSpace={existingSpace}
          footer={<SiteFooter />}
          initialView={centre ? initialView : "questionnaire"}
          responsibleEmail={session.user.email}
        />
      ) : null}

      {session.status === "forbidden" ||
      (session.status === "authenticated" &&
        centre &&
        (!centre.profileConfirmedAt || !centre.emailPolicyConfiguredAt)) ? (
        <SiteFooter />
      ) : null}
    </CentreAppShell>
  );
}
