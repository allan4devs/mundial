import type { Metadata } from "next";
import CafeteriaSigns from "@/app/components/cafeteria/CafeteriaSigns";

export const metadata: Metadata = {
  title: "Rótulos de cafetería | La Vieja Adventures",
  description:
    "Propuesta interna de siete rótulos bilingües para la cafetería de La Vieja Adventures, con precios de ejemplo y los avisos legales de Costa Rica.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CafeteriaPage() {
  return <CafeteriaSigns />;
}
