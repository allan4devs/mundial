import type { Metadata } from "next";
import PanaderiaSite from "./PanaderiaSite";

export const metadata: Metadata = {
  title: "Panadería Inocente Hidalgo | Tradición en Ciudad Quesada",
  description:
    "Panadería Inocente Hidalgo, fundada en 1933 en Ciudad Quesada, San Carlos. Pan artesanal, repostería, queques y café frente al Mercado Municipal.",
};

export default function PanaderiaProposalPage() {
  return <PanaderiaSite />;
}
