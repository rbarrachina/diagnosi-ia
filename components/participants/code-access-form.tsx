"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/i18n/language-settings-provider";

const PUBLIC_CODE_PATTERN = /^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

export function ParticipantCodeAccessForm({
  disabled = false,
  authenticated = false,
  compact = false,
  submitLabel,
}: {
  disabled?: boolean;
  authenticated?: boolean;
  compact?: boolean;
  submitLabel?: ReactNode;
}) {
  const router = useRouter();
  const messages = useTranslations();
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const normalizedCode = code.trim().toUpperCase();
  const valid = PUBLIC_CODE_PATTERN.test(normalizedCode);
  const invalid = touched && code.length > 0 && !valid;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || !valid) return;
        if (authenticated) {
          router.push(`/q/${normalizedCode}`);
          return;
        }
        // The OAuth Route Handler requires a full browser navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/auth/login?next=${encodeURIComponent(`/q/${normalizedCode}`)}`);
      }}
    >
      <div className={`flex gap-3 ${compact ? "flex-row flex-wrap justify-center" : "flex-col sm:flex-row"}`}>
        <label className="sr-only" htmlFor="participant-code">
          {messages.common.questionnaireCode}
        </label>
        <input
          autoComplete="off"
          aria-describedby={invalid ? "participant-code-error" : "participant-code-help"}
          aria-invalid={invalid || undefined}
          className={`min-h-12 min-w-0 rounded-xl border border-line bg-surface px-4 font-mono uppercase text-ink outline-none focus:border-action focus:ring-2 focus:ring-focus ${compact ? "box-content w-[12ch] max-w-[calc(100%_-_2rem_-_2px)]" : "flex-1"}`}
          id="participant-code"
          disabled={disabled}
          maxLength={12}
          onBlur={() => setTouched(true)}
          onChange={(event) => setCode(event.target.value)}
          placeholder="C-XXXX-XXXX"
          required
          spellCheck={false}
          value={code}
        />
        <button
          className={`min-h-12 rounded-xl bg-action font-semibold text-action-contrast disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "max-w-full px-4" : "px-6"}`}
          disabled={disabled || !valid}
          type="submit"
        >
          {submitLabel ?? messages.common.access}
        </button>
      </div>
      <p
        className={invalid ? "text-sm text-danger-text" : "sr-only"}
        id={invalid ? "participant-code-error" : "participant-code-help"}
        role={invalid ? "alert" : undefined}
      >
        {invalid
          ? messages.common.questionnaireCodeFormatError
          : messages.common.questionnaireCodeFormatHelp}
      </p>
    </form>
  );
}
