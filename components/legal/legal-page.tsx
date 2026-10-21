import type { ReactNode } from "react";
import { SiteFooter } from "@/components/home/site-footer";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";

export function LegalPage({ title, children, draft = true }: { title: string; children: ReactNode; draft?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <AppHeader brandHref="/" showBrandLabelOnMobile><ThemeToggle /></AppHeader>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-32 sm:px-8" id="inici" lang="ca">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Text en català · Revisió: 21 d’octubre de 2026</p>
        {draft ? <aside className="my-8 rounded-xl border border-line bg-surface-soft p-5 text-sm leading-relaxed">
          <strong>Esborrany pendent de validació per a ús real.</strong> Encara cal
          confirmar el responsable del tractament, la base jurídica, els proveïdors
          d’allotjament i els terminis de les còpies de seguretat. Aquest text
          descriu el funcionament actual i no acredita que el servei estigui
          preparat per recollir dades en producció.
        </aside> : <div className="mt-8" />}
        <div className="space-y-8 text-base leading-relaxed [&_a]:text-action [&_a]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
