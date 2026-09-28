"use client";

import { GitHubIcon } from "@/components/brand/github-icon";
import packageJson from "@/package.json";
import { AppLogoMark } from "@/components/brand/app-logo";
import { useTranslations } from "@/components/i18n/language-settings-provider";

export function SiteFooter() {
  const messages = useTranslations();
  return (
    <footer className="border-t border-line bg-surface-soft px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6">
        <div className="flex items-center gap-3">
          <AppLogoMark />
          <p className="whitespace-nowrap font-semibold text-ink">
            Diagnosi IA <span className="px-1 text-muted">·</span>
            <span>v{packageJson.version}</span>
          </p>
        </div>

        <p className="whitespace-nowrap">
          {messages.common.author}:{" "}
          <span className="font-medium text-ink">
            Rafa Barrachina
          </span>
        </p>

        <nav
          aria-label={messages.common.projectInformation}
          className="flex flex-wrap gap-x-5 gap-y-2 font-medium"
        >
          <a
            aria-label={messages.common.accessibility}
            className="inline-flex items-center gap-2 text-action transition hover:text-action-hover"
            href="https://www.w3.org/TR/WCAG22/"
            rel="noreferrer"
            target="_blank"
          >
            <AccessibilityIcon />
          </a>
          <a
            className="text-action transition hover:text-action-hover"
            href="https://www.apache.org/licenses/LICENSE-2.0"
            rel="noreferrer"
            target="_blank"
          >
            {messages.common.license}
          </a>
          <a
            className="text-action transition hover:text-action-hover"
            href="/THIRD_PARTY_NOTICES.txt"
          >
            {messages.common.thirdPartyLicenses}
          </a>
          <a
            aria-label={messages.common.sourceCodeGithub}
            className="inline-flex items-center gap-2 text-action transition hover:text-action-hover"
            href="https://github.com/rbarrachina/diagnosi-ia"
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon />
            {messages.common.sourceCode}
          </a>
        </nav>
      </div>
    </footer>
  );
}

function AccessibilityIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="7.5" fill="currentColor" r="1.5" />
      <path
        d="M7.5 10.5h9M12 10.5v7M9.5 18l2.5-4 2.5 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
