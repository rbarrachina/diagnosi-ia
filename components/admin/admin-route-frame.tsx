"use client";

import type { ReactNode } from "react";

import {
  AdminMobileNavigation,
  AdminSidebar,
  type AdminSection,
} from "@/components/admin/admin-navigation";
import { useAdminSidebarState } from "@/components/admin/use-admin-sidebar-state";

export function AdminRouteFrame({
  activeSection,
  children,
  footer,
  selectedQuestionnaireId,
}: {
  activeSection: AdminSection;
  children: ReactNode;
  footer: ReactNode;
  selectedQuestionnaireId: string | null;
}) {
  const { expanded, toggle } = useAdminSidebarState();

  return (
    <div className="relative mx-auto flex h-[100svh] w-full max-w-[100rem] overflow-hidden pt-20">
      <AdminSidebar
        activeSection={activeSection}
        expanded={expanded}
        onToggle={toggle}
        selectedQuestionnaireId={selectedQuestionnaireId}
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

      <AdminMobileNavigation
        activeSection={activeSection}
        selectedQuestionnaireId={selectedQuestionnaireId}
      />
    </div>
  );
}
