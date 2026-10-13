import type { Metadata } from "next";
import CafeteriaPos from "@/app/components/cafeteria/pos/CafeteriaPos";

export const metadata: Metadata = {
  title: "Caja de cafetería | La Vieja Adventures",
  description:
    "Punto de venta interno de la cafetería: arma la orden, desglosa el IVA y calcula el vuelto.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CafeteriaPosPage() {
  return <CafeteriaPos />;
}
