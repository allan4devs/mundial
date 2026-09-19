import type { Metadata } from "next";
import ReelEditor from "./ReelEditor";

export const metadata: Metadata = {
  title: "Reel Studio | Crea algo que se sienta",
  description: "Arrastra, recorta y crea reels con tus videos. Edita texto, música y color y descarga tu video en MP4.",
};

export default function VideoGeneratorPage() {
  return <ReelEditor />;
}
