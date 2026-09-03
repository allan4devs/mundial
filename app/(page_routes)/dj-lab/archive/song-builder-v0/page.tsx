import type { Metadata } from "next";
import SongBuilderClient from "./SongBuilderClient";

export const metadata: Metadata = {
  title: "Song Builder v0 (archived) | DJ Sound Science Lab",
  description:
    "Archived first-generation Song Builder: upload MP3s, chop slices, stack looping layers per instrument, and bounce the mix to a WAV.",
  robots: { index: false, follow: false },
};

/** Frozen v0 studio. New work happens in `../../song-builder` (v1). */
export default function SongBuilderV0Page() {
  return <SongBuilderClient />;
}
