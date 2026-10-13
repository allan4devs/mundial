import type { Metadata } from "next";
import { Anton, Oswald } from "next/font/google";
import "./theme.css";

/**
 * /traa — propuesta (demo) de tienda en línea para TRAA Repuestos.
 *
 * Clona el look del catálogo de traarepuestos.com/catalogo (negro + naranja,
 * titulares condensados en mayúscula) y lo lleva más allá del "Consulte su
 * precio": precios reales, imágenes de producto, carrito, pago en línea
 * (SINPE / tarjeta / transferencia) y envíos a todo el país.
 *
 * No es un sitio oficial; es material de pitch. Todo corre en el navegador y
 * ningún pago se procesa de verdad.
 */

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRAA Repuestos · Catálogo en línea con carrito, pago y envíos (demo)",
  description:
    "Propuesta de tienda en línea para TRAA Repuestos: el mismo catálogo, ahora con precios, imágenes de producto, carrito, pago por SINPE Móvil o tarjeta y envíos a todo Costa Rica. Demostración interactiva.",
  robots: { index: false, follow: false },
};

export default function TraaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${oswald.variable} ${anton.variable}`}>{children}</div>;
}
