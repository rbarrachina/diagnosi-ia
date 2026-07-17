"use client";

import { useState } from "react";
import type { CentreEmailPolicy } from "@/lib/centres/types";

export function CentreEmailPolicyForm({
  initialPolicy,
  onSaved,
  title = "Correus admesos",
}: {
  initialPolicy: CentreEmailPolicy;
  onSaved?: (policy: CentreEmailPolicy) => void;
  title?: string;
}) {
  const [allowXtec, setAllowXtec] = useState(initialPolicy.allowXtec);
  const [useCustom, setUseCustom] = useState(Boolean(initialPolicy.customDomain));
  const [customDomain, setCustomDomain] = useState(initialPolicy.customDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/centres/email-policy", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        allowXtec,
        customDomain: useCustom ? customDomain.toLowerCase().trim() : null,
      }),
    });
    const payload = (await response.json()) as {
      policy?: CentreEmailPolicy;
      error?: string;
    };
    if (!response.ok || !payload.policy) {
      setMessage(payload.error ?? "No s'ha pogut desar la configuració.");
      setSaving(false);
      return;
    }
    setMessage("Configuració desada.");
    setSaving(false);
    onSaved?.(payload.policy);
  }

  return (
    <section className="mb-4 rounded-md border border-line bg-white p-5 text-left shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
        Configuració d’accés
      </p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        El professorat haurà d’iniciar sessió amb Google. No es desa el seu
        correu ni es vincula a les respostes.
      </p>

      <label className="mt-5 block rounded-md border border-line p-4">
        <span className="flex items-center gap-3">
          <input
            checked={allowXtec}
            className="h-4 w-4 shrink-0"
            onChange={(event) => setAllowXtec(event.target.checked)}
            type="checkbox"
          />
          <strong className="text-sm leading-5 text-ink">@xtec.cat</strong>
        </span>
        <span className="mt-1 block pl-7 text-xs text-slate-600">
          Opció recomanada i predeterminada.
        </span>
      </label>

      <label className="mt-3 block rounded-md border border-line p-4">
        <span className="flex items-center gap-3">
          <input
            checked={useCustom}
            className="h-4 w-4 shrink-0"
            onChange={(event) => setUseCustom(event.target.checked)}
            type="checkbox"
          />
          <strong className="text-sm leading-5 text-ink">Domini propi</strong>
        </span>
        <span className="mt-1 block pl-7 text-xs text-slate-600">
          Ha de ser un domini gestionat amb Google Workspace. No s’admeten
          automàticament els subdominis.
        </span>
        <span className="block pl-7">
          {useCustom ? (
            <span className="mt-3 flex max-w-sm items-center rounded-md border border-line bg-white">
              <span className="border-r border-line bg-slate-100 px-3 py-2 text-slate-500">@</span>
              <input
                aria-label="Domini propi"
                className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                onChange={(event) => setCustomDomain(event.target.value.toLowerCase())}
                placeholder="escola.cat"
                spellCheck={false}
                type="text"
                value={customDomain}
              />
            </span>
          ) : null}
        </span>
      </label>

      {allowXtec && useCustom ? (
        <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Si una persona disposa d’un compte XTEC i d’un compte del domini
          propi, podria respondre dues vegades. Les respostes són anònimes i
          l’aplicació no relaciona els dos comptes.
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      <button
        className="mt-4 rounded-md bg-action px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={saving}
        onClick={save}
        type="button"
      >
        {saving ? "Desant..." : "Desa i continua"}
      </button>
    </section>
  );
}
