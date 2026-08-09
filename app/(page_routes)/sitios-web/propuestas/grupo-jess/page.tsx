import type { Metadata, Viewport } from "next";
import GrupoJessClient from "./GrupoJessClient";

export const metadata: Metadata = {
  title: "JESS Group | Tienda, academia, banda, eventos y producción",
  description:
    "Propuesta de sitio web para JESS Group en Ciudad Quesada: tienda de instrumentos, academia eXpression, Jess Band, Sound Systems, estudio y servicio técnico. Ecosistema musical de la Zona Norte desde 2010.",
  manifest: "/propuestas/grupo-jess/site.webmanifest",
  icons: {
    icon: [{ url: "/propuestas/grupo-jess/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/propuestas/grupo-jess/favicon.svg",
    apple: "/propuestas/grupo-jess/apple-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b20",
};

export default function Page() {
  return <GrupoJessClient />;
}
