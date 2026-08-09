import type { Metadata } from "next";
import UfcClient from "./UfcClient";

export const metadata: Metadata = {
  title: "UFC Freedom 250 | Quiniela",
  description: "Quiniela del UFC Freedom 250 — Topuria vs. Gaethje. Pon tus picks para cada pelea.",
};

export default function UfcPage() {
  return <UfcClient />;
}
