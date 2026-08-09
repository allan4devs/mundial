import type { Metadata } from "next";
import ScoresClient from "./ScoresClient";

export const metadata: Metadata = {
  title: "Scores | Quiniela multi-liga",
  description: "Predicciones de Premier League, Serie A, NBA, FCL, NBL y más.",
};

export default function ScoresPage() {
  return <ScoresClient />;
}
