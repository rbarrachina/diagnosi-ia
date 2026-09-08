"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/auth-actions";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";

type CentreManagementHeaderProps = {
  accountName: string;
  email: string;
  logoutNext?: string;
};

export function CentreManagementHeader({
  accountName,
  email,
  logoutNext = "/",
}: CentreManagementHeaderProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuId = useId();
  const controlsRef = useRef<HTMLDivElement>(null);
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || "C";

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !controlsRef.current?.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  function toggleAccountMenu() {
    setIsAccountMenuOpen((isOpen) => !isOpen);
  }

  return (
    <AppHeader brandHref="/" controlsRef={controlsRef}>
      <ThemeToggle />

      <div className="relative ml-1">
        <button
          aria-controls={accountMenuId}
          aria-expanded={isAccountMenuOpen}
          aria-label={`Menú del compte de ${accountName}`}
          className="inline-flex h-10 max-w-56 items-center gap-2 rounded-full bg-action py-1 pl-1 pr-2 text-sm font-semibold text-action-contrast shadow-[0_8px_24px_var(--app-action-shadow)] transition duration-200 hover:-translate-y-0.5 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper sm:pr-4"
          onClick={toggleAccountMenu}
          type="button"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {accountInitial}
          </span>
          <span className="hidden truncate min-[520px]:inline">
            {accountName}
          </span>
          <ChevronIcon isOpen={isAccountMenuOpen} />
        </button>

        {isAccountMenuOpen ? (
          <div
            aria-label="Opcions del compte"
            className="fixed right-4 top-20 mt-3 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 text-left shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-xl sm:absolute sm:right-0 sm:top-auto"
            id={accountMenuId}
            role="region"
          >
            <div className="border-b border-line px-3 pb-3 pt-2">
              <p className="truncate font-semibold text-ink">
                {accountName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
            </div>

            <LogoutButton
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-accent-soft hover:text-action"
              label="Surt"
              next={logoutNext}
            />
          </div>
        ) : null}
      </div>
    </AppHeader>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 14 14">
      <path d="m3.5 5.25 3.5 3.5 3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}
