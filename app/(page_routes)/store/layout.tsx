import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda outdoor | La Vieja Adventures",
  description:
    "Conocé la colección de lanzamiento de indumentaria para lluvia, río y sendero de La Vieja Adventures. Tallas, precios y disponibilidad se confirman por WhatsApp.",
  openGraph: {
    title: "La Vieja Outdoor · Colección en preparación",
    description:
      "Ropa técnica, capas para lluvia, pantalones, calzado y accesorios inspirados en la aventura de San Carlos.",
    type: "website",
    images: [
      {
        url: "/store/apparel-hero-v1.webp",
        width: 1536,
        height: 1024,
        alt: "Indumentaria outdoor en un sendero tropical de San Carlos",
      },
    ],
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
