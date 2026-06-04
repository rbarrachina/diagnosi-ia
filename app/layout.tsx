import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diagnosi IA",
  description: "Diagnosi anonima i agregada sobre l'us educatiu de la IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
