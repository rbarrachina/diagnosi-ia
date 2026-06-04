import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
