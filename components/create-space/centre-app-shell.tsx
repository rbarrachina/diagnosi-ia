import type { ReactNode } from "react";

import { CentreManagementHeader } from "@/components/create-space/centre-management-header";

type CentreAppShellProps = {
  account?: {
    email: string;
    name: string;
  };
  children: ReactNode;
  logoutNext?: string;
};

export function CentreAppShell({
  account,
  children,
  logoutNext,
}: CentreAppShellProps) {
  return (
    <main className="app-shell min-h-screen overflow-hidden text-ink">
      {account ? (
        <CentreManagementHeader
          accountName={account.name}
          email={account.email}
          logoutNext={logoutNext}
        />
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
