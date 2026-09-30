import type { ReactNode } from "react";

import { CentreManagementHeader } from "@/components/create-space/centre-management-header";
import { IconLogoutButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";

type CentreAppShellProps = {
  account?: {
    email: string;
    name: string;
  };
  children: ReactNode;
  logoutNext?: string;
  showLogout?: boolean;
};

export function CentreAppShell({
  account,
  children,
  logoutNext,
  showLogout = false,
}: CentreAppShellProps) {
  return (
    <main className="app-shell min-h-screen overflow-hidden text-ink">
      {account ? (
        <CentreManagementHeader
          accountName={account.name}
          logoutNext={logoutNext}
        />
      ) : showLogout ? (
        <AppHeader brandHref="/">
          <ThemeToggle />
          <IconLogoutButton next={logoutNext} />
        </AppHeader>
      ) : null}

      <div
        aria-hidden="true"
        className="app-grid pointer-events-none fixed inset-0 opacity-50"
      />
      <div aria-hidden="true" className="app-orb app-orb-left fixed" />
      <div aria-hidden="true" className="app-orb app-orb-right fixed" />

      {children}
    </main>
  );
}
