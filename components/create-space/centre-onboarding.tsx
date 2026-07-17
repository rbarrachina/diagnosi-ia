"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/auth/auth-actions";
import { CentreCard } from "@/components/create-space/centre-card";
import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";
import type { CentreProfile } from "@/lib/centres/types";

export function CentreOnboarding({
  centre,
  email,
}: {
  centre: CentreProfile;
  email: string;
}) {
  const router = useRouter();
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
      setError(payload.error ?? "No s'ha pogut confirmar la fitxa.");
      setSaving(false);
    }

    return (
      <div className="w-full max-w-2xl">
        <SessionBar email={email} />
        <CentreCard initialCentre={centre} />
        <div className="rounded-md border border-line bg-white p-5 text-left shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Confirma la fitxa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Revisa les dades del centre. Si no s’han trobat, pots continuar i
            recarregar-les més endavant.
          </p>
          {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
          <button
            className="mt-4 rounded-md bg-action px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            onClick={confirm}
            type="button"
          >
            {saving ? "Confirmant..." : "Confirma i continua"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <SessionBar email={email} />
      <CentreEmailPolicyForm
        initialPolicy={{
          allowXtec: centre.allowXtec,
          customDomain: centre.customDomain,
          configured: false,
        }}
        onSaved={() => router.refresh()}
        title="Configura els correus del professorat"
      />
    </div>
  );
}

function SessionBar({ email }: { email: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-line bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
      <span>
        Sessió iniciada com <strong>{email}</strong>
      </span>
      <LogoutButton next="/" />
    </div>
  );
}
