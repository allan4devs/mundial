import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV Express — Crear tu CV y carta de presentación en minutos | Costa Rica",
  description:
    "Armá tu currículum y tu carta de presentación en línea: agregás tus datos, elegís un estilo, ves la vista previa y descargás el PDF. Español e inglés. Hecho en Costa Rica.",
};

export default function CrearCvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
