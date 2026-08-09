import type { Metadata } from "next";
import DjLabClient from "./DjLabClient";

export const metadata: Metadata = {
  title: "DJ Sound Science Lab | La Vieja Adventures",
  description:
    "Professional DJ mixing lab built with Next.js, React, and the Web Audio API.",
};

export default function DjLabPage() {
  return <DjLabClient />;
}
