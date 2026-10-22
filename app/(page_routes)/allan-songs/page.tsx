import type { Metadata } from "next";

import AllanSongsClient from "./AllanSongsClient";

export const metadata: Metadata = {
  title: "Allan Songs | Mundial",
  description: "A small songwriting sketchpad for drums, bass, synth and voice.",
};

export default function AllanSongsPage() {
  return <AllanSongsClient />;
}
