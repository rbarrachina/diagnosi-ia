"use client";

import { useId, useState } from "react";

import { LogoutButton } from "@/components/auth/auth-actions";
import { CentreCard } from "@/components/create-space/centre-card";
import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";
import type { CentreEmailPolicy, CentreProfile } from "@/lib/centres/types";

type CentreManagementHeaderProps = {
  centre: CentreProfile | null;
  collapseCentreProfile: boolean;
  email: string;
};

export function CentreManagementHeader({
  centre,
  collapseCentreProfile,
  email,
}: CentreManagementHeaderProps) {
  const centreProfileId = useId();
  const emailPolicyId = useId();
  const [isCollapsedProfileOpen, setIsCollapsedProfileOpen] = useState(false);
  const [isEmailPolicyOpen, setIsEmailPolicyOpen] = useState(false);
  const [emailPolicy, setEmailPolicy] = useState<CentreEmailPolicy>({
    allowXtec: centre?.allowXtec ?? true,
    customDomain: centre?.customDomain ?? null,
    configured: Boolean(centre?.emailPolicyConfiguredAt),
  });
  const isCentreProfileOpen = collapseCentreProfile
    ? isCollapsedProfileOpen
    : true;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-line bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          Sessió iniciada com <strong>{email}</strong>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {centre && collapseCentreProfile ? (
            <button
              aria-controls={centreProfileId}
              aria-expanded={isCentreProfileOpen}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action"
              onClick={() => setIsCollapsedProfileOpen((isOpen) => !isOpen)}
              type="button"
            >
              Fitxa
            </button>
          ) : null}
          {centre ? (
            <button
              aria-controls={emailPolicyId}
              aria-expanded={isEmailPolicyOpen}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action"
              onClick={() => setIsEmailPolicyOpen((isOpen) => !isOpen)}
              type="button"
            >
              Correu
            </button>
          ) : null}
          <LogoutButton next="/" />
        </div>
      </div>

      {centre && isCentreProfileOpen ? (
        <div id={centreProfileId}>
          <CentreCard initialCentre={centre} />
        </div>
      ) : null}
      {centre && isEmailPolicyOpen ? (
        <div id={emailPolicyId}>
          <CentreEmailPolicyForm
            initialPolicy={emailPolicy}
            onSaved={setEmailPolicy}
          />
        </div>
      ) : null}
    </>
  );
}
