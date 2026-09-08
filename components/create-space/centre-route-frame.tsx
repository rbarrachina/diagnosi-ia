"use client";

import type { ReactNode } from "react";

import {
  CentreMobileNavigation,
  CentreSidebar,
  type WorkspaceAccess,
} from "@/components/create-space/centre-workspace-navigation";
import { useCentreSidebarState } from "@/components/create-space/use-centre-sidebar-state";

type CentreRouteFrameProps = {
  activeAccess: WorkspaceAccess;
  centreName: string;
  children: ReactNode;
  footer: ReactNode;
  questionnairePreviewUrl: string;
  resultsUrl: string;
};

export function CentreRouteFrame({
  activeAccess,
  centreName,
  children,
  footer,
  questionnairePreviewUrl,
  resultsUrl,
}: CentreRouteFrameProps) {
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useCentreSidebarState();

  return (
    <div className="relative mx-auto flex h-[100svh] w-full max-w-7xl overflow-hidden pt-20">
      <CentreSidebar
        activeAccess={activeAccess}
        centreName={centreName}
        expanded={sidebarExpanded}
        hasCentre
        onToggle={toggleSidebar}
        questionnairePreviewUrl={questionnairePreviewUrl}
        resultsUrl={resultsUrl}
      />

      <div
        className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        id="inici"
        tabIndex={-1}
      >
        <div className="flex min-h-full flex-col">
          <div className="flex-1 px-5 pb-28 pt-8 sm:px-8 md:pb-16 md:pt-10 lg:px-12 xl:px-16">
            {children}
          </div>
          <div className="pb-20 md:pb-0">{footer}</div>
        </div>
      </div>

      <CentreMobileNavigation
        activeAccess={activeAccess}
        hasCentre
        questionnairePreviewUrl={questionnairePreviewUrl}
        resultsUrl={resultsUrl}
      />
    </div>
  );
}
