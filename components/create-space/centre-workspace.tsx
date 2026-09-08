"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { CentreCard } from "@/components/create-space/centre-card";
import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";
import {
  CentreMobileNavigation,
  CentreSidebar,
  type WorkspaceView,
} from "@/components/create-space/centre-workspace-navigation";
import {
  CreateSpaceForm,
  type CreateSpaceFormProps,
} from "@/components/create-space/create-space-form";
import type { CentreProfile } from "@/lib/centres/types";
import { useCentreSidebarState } from "@/components/create-space/use-centre-sidebar-state";

type CentreWorkspaceProps = CreateSpaceFormProps & {
  centre: CentreProfile | null;
  footer: ReactNode;
  initialView?: WorkspaceView;
};

export function CentreWorkspace({
  centre,
  centreName,
  footer,
  initialView = "questionnaire",
  ...createSpaceProps
}: CentreWorkspaceProps) {
  const [view, setView] = useState<WorkspaceView>(initialView);
  const [navigationSpace, setNavigationSpace] = useState(
    createSpaceProps.existingSpace ?? null,
  );
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useCentreSidebarState();
  const [emailPolicy, setEmailPolicy] = useState(
    centre
      ? {
          allowXtec: centre.allowXtec,
          customDomain: centre.customDomain,
          configured: Boolean(centre.emailPolicyConfiguredAt),
        }
      : null,
  );

  function navigate(nextView: WorkspaceView) {
    if (!centre && nextView !== "questionnaire") {
      return;
    }
    setView(nextView);
  }

  return (
    <div className="relative mx-auto flex h-[100svh] w-full max-w-7xl overflow-hidden pt-20">
      <CentreSidebar
        centreName={centreName}
        expanded={sidebarExpanded}
        hasCentre={Boolean(centre)}
        onNavigate={navigate}
        onToggle={toggleSidebar}
        questionnairePreviewUrl={navigationSpace?.questionnairePreviewUrl}
        resultsUrl={navigationSpace?.ownerResultsUrl}
        view={view}
      />

      <div
        className="h-full min-w-0 flex-1 overflow-y-auto overscroll-contain"
        id="inici"
        tabIndex={-1}
      >
        <div className="flex min-h-full flex-col">
          <div className="flex-1 px-5 pb-28 pt-8 sm:px-8 md:pb-16 md:pt-10 lg:px-12 xl:px-16">
            <div className="mx-auto w-full max-w-4xl">
              <section
                aria-labelledby="workspace-questionnaire-heading"
                hidden={view !== "questionnaire"}
              >
                <CreateSpaceForm
                  {...createSpaceProps}
                  centreName={centreName}
                  onSpaceChange={setNavigationSpace}
                />
              </section>

              {centre ? (
                <section
                  aria-labelledby="workspace-profile-heading"
                  hidden={view !== "profile"}
                >
                  <div className="mb-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
                      Espai del centre
                    </p>
                    <h2
                      className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl"
                      id="workspace-profile-heading"
                    >
                      Fitxa del centre
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                      Consulta les dades institucionals vinculades a aquest espai i
                      actualitza-les des de les fonts oficials.
                    </p>
                  </div>
                  <CentreCard embedded hideHeading initialCentre={centre} />
                </section>
              ) : null}

              {centre && emailPolicy ? (
                <section
                  aria-labelledby="workspace-settings-heading"
                  hidden={view !== "settings"}
                >
                  <CentreEmailPolicyForm
                    embedded
                    headingId="workspace-settings-heading"
                    initialPolicy={emailPolicy}
                    onSaved={setEmailPolicy}
                    title="Accés del professorat"
                  />
                </section>
              ) : null}
            </div>
          </div>
          <div className="pb-20 md:pb-0">{footer}</div>
        </div>
      </div>

      <CentreMobileNavigation
        hasCentre={Boolean(centre)}
        onNavigate={navigate}
        questionnairePreviewUrl={navigationSpace?.questionnairePreviewUrl}
        resultsUrl={navigationSpace?.ownerResultsUrl}
        view={view}
      />
    </div>
  );
}
