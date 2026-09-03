import type { Metadata } from "next";
import SongBuilderClient from "./SongBuilderClient";

export const metadata: Metadata = {
  title: "Song Builder | DJ Sound Science Lab",
  description:
    "Beat-box a rhythm into any of five rows and hear it played back as a guitar, a bass or a drum kit. The studio decodes your voice into a step pattern and saves it to MongoDB.",
};

export default function SongBuilderPage() {
  return <SongBuilderClient />;
}
