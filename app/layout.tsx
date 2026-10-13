import type { Metadata } from "next";

import "./globals.css";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "Allan — Portafolio de proyectos",
    template: "%s | Allan",
  },
  description:
    "Portafolio personal: quinielas, juegos, mapas interactivos, scrapers y sitios web hechos con Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
