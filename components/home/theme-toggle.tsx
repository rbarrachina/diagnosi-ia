"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "diagnosi-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    const updateTimer = window.setTimeout(() => {
      setTheme(preferredTheme);
    }, 0);

    setDocumentTheme(preferredTheme);

    return () => {
      window.clearTimeout(updateTimer);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    storeTheme(nextTheme);
    setDocumentTheme(nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Activa el tema clar" : "Activa el tema fosc"}
      aria-pressed={isDark}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-soft text-ink shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-action hover:text-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
      onClick={toggleTheme}
      suppressHydrationWarning
      type="button"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function setDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage?.getItem?.(THEME_STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // Storage can be unavailable in privacy-focused browser contexts.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function storeTheme(theme: Theme) {
  try {
    window.localStorage?.setItem?.(THEME_STORAGE_KEY, theme);
  } catch {
    // The visual switch still works when local storage is unavailable.
  }
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <path
        d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
