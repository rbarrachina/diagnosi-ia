import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/questionnaire.css";
import "./styles/workspace.css";
import "./styles/admin.css";

const themeInitializer = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem("diagnosi-theme");
      var theme =
        storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;

      var storedSidebar = window.localStorage.getItem(
        "diagnosi-ia:centre-sidebar-expanded"
      );
      document.documentElement.dataset.centreSidebar =
        storedSidebar === "false" ? "collapsed" : "expanded";

      var storedAdminSidebar = window.localStorage.getItem(
        "diagnosi-ia:admin-sidebar-expanded"
      );
      document.documentElement.dataset.adminSidebar =
        storedAdminSidebar === "false" ? "collapsed" : "expanded";
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
      document.documentElement.dataset.centreSidebar = "expanded";
      document.documentElement.dataset.adminSidebar = "expanded";
    }
  })();
`;

export const metadata: Metadata = {
  title: "Diagnosi IA",
  description: "Diagnosi anònima de conjunt sobre l'ús educatiu de la IA.",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
