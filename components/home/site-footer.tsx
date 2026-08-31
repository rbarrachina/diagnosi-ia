import packageJson from "@/package.json";
import { AppLogoMark } from "@/components/brand/app-logo";

export function SiteFooter() {
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
          Autor:{" "}
          <span className="font-medium text-ink">
            Rafa Barrachina
          </span>
        </p>

        <nav
          aria-label="Informació del projecte"
          className="flex flex-wrap gap-x-5 gap-y-2 font-medium"
        >
          <a
            className="text-action transition hover:text-action-hover"
            href="https://www.apache.org/licenses/LICENSE-2.0"
            rel="noreferrer"
            target="_blank"
          >
            Llicència Apache 2.0
          </a>
          <a
            aria-label="Codi font a GitHub"
            className="inline-flex items-center gap-2 text-action transition hover:text-action-hover"
            href="https://github.com/rbarrachina/diagnosi-ia"
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon />
            Codi font
          </a>
        </nav>
      </div>
    </footer>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.61.07-.61 1 .07 1.52 1.03 1.52 1.03.88 1.52 2.32 1.08 2.89.82.09-.64.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.55 9.55 0 0 1 12 6.46c.85 0 1.7.11 2.5.34 1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.65.65.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.69-4.57 4.94.36.31.68.91.68 1.84v2.72c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
