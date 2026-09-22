"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CentreCard } from "@/components/create-space/centre-card";
import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";
import type { CentreProfile } from "@/lib/centres/types";
import { useTranslations } from "@/components/i18n/language-settings-provider";

export function CentreOnboarding({
  centre,
}: {
  centre: CentreProfile;
}) {
  const router = useRouter();
  const messages = useTranslations();
  const copy = messages.centre;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!centre.profileConfirmedAt) {
    async function confirm() {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/centres/confirm", { method: "POST" });
      if (response.ok) {
        router.refresh();
        return;
      }
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? copy.confirmError);
      setSaving(false);
    }

    return (
      <div className="w-full max-w-3xl text-ink">
        <CentreCard embedded initialCentre={centre} />
        <div className="mt-8 border-t border-line pt-7 text-left">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">{copy.confirmProfile}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {copy.confirmProfileHelp}
          </p>
          {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
          <button
            className="mt-5 rounded-full bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_10px_28px_var(--app-action-shadow)] transition hover:bg-action-hover disabled:opacity-60"
            disabled={saving}
            onClick={confirm}
            type="button"
          >
            {saving ? copy.confirming : copy.confirmAndContinue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <CentreEmailPolicyForm
        embedded
        initialPolicy={{
          allowXtec: centre.allowXtec,
          customDomain: centre.customDomain,
          configured: false,
        }}
        onSaved={() => router.refresh()}
        title={copy.configureTeacherEmails}
      />
    </div>
  );
}
