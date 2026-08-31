import type { Metadata } from "next";
import SongBuilderClient from "./SongBuilderClient";

export const metadata: Metadata = {
  title: "Song Builder | DJ Sound Science Lab",
  description:
    "Upload your own MP3s, chop slices, stack looping layers per instrument, and bounce the mix to a WAV — all in the browser with the Web Audio API.",
};

export default function SongBuilderPage() {
  return <SongBuilderClient />;
}
