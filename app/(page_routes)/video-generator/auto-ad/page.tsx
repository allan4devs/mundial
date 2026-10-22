import type { Metadata } from "next";
import AutoAd from "./AutoAd";

export const metadata: Metadata = {
  title: "Auto Ad | Reel Studio",
  description: "Crea un anuncio animado desde un texto y una imagen o video.",
};

export default function AutoAdPage() {
  return <AutoAd />;
}
