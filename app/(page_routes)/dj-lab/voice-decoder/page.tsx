import type { Metadata } from "next";
import VoiceDecoderClient from "./VoiceDecoderClient";

export const metadata: Metadata = {
  title: "Voice Decoder | DJ Sound Science Lab",
  description: "Upload an audio file, visualize the waveform, and test basic voice effects in the browser.",
};

export default function VoiceDecoderPage() {
  return <VoiceDecoderClient />;
}
