import type { Metadata } from "next";

import MundialClient from "./MundialClient";

export const metadata: Metadata = {
  title: "Mundial 2026 | Quiniela",
  description: "Quiniela del Mundial 2026 con partidos, llaves y predicciones guardadas en Mongo.",
};

export default function MundialPage() {
  return <MundialClient />;
}
