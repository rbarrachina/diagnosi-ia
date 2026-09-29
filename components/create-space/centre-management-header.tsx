"use client";

import { IconLogoutButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";

type CentreManagementHeaderProps = {
  accountName: string;
  logoutNext?: string;
};

export function CentreManagementHeader({
  accountName,
  logoutNext = "/",
}: CentreManagementHeaderProps) {
  return (
    <AppHeader
      brandHref="/"
      leadingControls={
        <span
          className="max-w-20 truncate text-right text-xs font-semibold text-ink sm:max-w-48 sm:text-sm lg:max-w-64"
          title={accountName}
        >
          {accountName}
        </span>
      }
    >
      <ThemeToggle />
      <IconLogoutButton next={logoutNext} />
    </AppHeader>
  );
}
