import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";
import { VisualPreferencesInitializer } from "@/components/layout/visual-preferences-initializer";
import { getLanguageSettings } from "@/lib/admin/language-settings";
import { getCurrentLanguage } from "@/lib/i18n/locale";
import "./globals.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/questionnaire.css";
import "./styles/workspace.css";
import "./styles/admin.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerInterfaceTranslator();
  return {
    title: {
      default: "Diagnosi IA",
      template: "%s | Diagnosi IA",
    },
    description: t("diagnosiPseudonimitzadaSobreLUsEducatiuDeLaIa"),
    referrer: "no-referrer",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [languageSettings, language] = await Promise.all([
    getLanguageSettings(),
    getCurrentLanguage(),
  ]);

  return (
    <html lang={language.toLowerCase()} suppressHydrationWarning>
      <body>
        <VisualPreferencesInitializer />
        <LanguageSettingsProvider language={language} settings={languageSettings}>
          {children}
        </LanguageSettingsProvider>
      </body>
    </html>
  );
}
