"use client";

import type { JSX } from "react";
import ImmersiveHero from "@/app/components/selva/ImmersiveHero";

export default function SelvaPage(): JSX.Element {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4F0E4] font-sans text-[#1b2b26]">
      {/* Swap the bird for a photoreal cutout later:
          drop a transparent PNG at /public/hero/toucan.png and pass
          imageSrc="/hero/toucan.png" below. */}
      <ImmersiveHero />
    </main>
  );
}
