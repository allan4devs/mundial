import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plano del gimnasio — planificador y control de inventario",
  description:
    "Editor 2D tipo CAD para dibujar el piso del gimnasio, colocar máquinas por zona y llevar el inventario (estado, activo, servicio).",
};

export default function PlanoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
