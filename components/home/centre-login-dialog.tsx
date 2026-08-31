"use client";

import type { MouseEvent, ReactNode } from "react";
import { useId, useRef } from "react";

import { AppLogoMark } from "@/components/brand/app-logo";

const LOGIN_URL = "/auth/login?next=%2Fcrear";

type CentreLoginDialogProps = {
  ariaLabel?: string;
  children: ReactNode;
  className: string;
};

export function CentreLoginDialog({
  ariaLabel,
  children,
  className,
}: CentreLoginDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog() {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeDialog();
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={className}
        onClick={openDialog}
        type="button"
      >
        {children}
      </button>

      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="m-auto max-h-[calc(100svh-2rem)] w-[min(27rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-[0_32px_110px_rgba(3,15,35,0.45)] backdrop:bg-slate-950/55 backdrop:backdrop-blur-md"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={closeFromBackdrop}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
          }
        }}
        ref={dialogRef}
      >
        <div className="relative px-6 pb-7 pt-14 sm:px-8 sm:pb-8">
          <button
            aria-label="Tanca l’accés del centre"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-accent-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-focus"
            onClick={closeDialog}
            type="button"
          >
            <CloseIcon />
          </button>

          <div className="text-center">
            <span className="relative isolate mx-auto block w-fit">
              <span
                aria-hidden="true"
                className="absolute -inset-4 -z-10 rounded-full bg-blue-400/15 blur-2xl"
              />
              <AppLogoMark size="large" />
            </span>
            <h2
              className="mt-5 text-balance text-3xl font-semibold tracking-[-0.035em]"
              id={titleId}
            >
              Espai del centre
            </h2>
            <p
              className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-6 text-muted"
              id={descriptionId}
            >
              Heu d’accedir amb el compte institucional del centre, amb domini{" "}
              <strong className="font-semibold text-ink">@xtec.cat</strong>.
            </p>
          </div>

          <a
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-action px-6 font-semibold text-white shadow-[0_14px_34px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-0.5 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface"
            href={LOGIN_URL}
          >
            <GoogleIcon />
            Accedeix amb XTEC
          </a>
        </div>
      </dialog>
    </>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.32 2.98-7.42Z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.98-.9 6.64-2.35L15.39 17.1c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.77-5.61-4.14H3.04v2.63A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.63Z" fill="#FBBC05" />
      <path d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z" fill="#EA4335" />
    </svg>
  );
}
