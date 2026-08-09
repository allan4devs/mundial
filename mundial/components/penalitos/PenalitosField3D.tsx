"use client";

import { memo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PenalitosScene, type PenalitosScenePhase } from "./PenalitosScene";
import type { PenalitosDirection } from "../../types";

export type PenalitosField3DProps = {
  phase: PenalitosScenePhase;
  shooterChoice: PenalitosDirection | null;
  goalkeeperChoice: PenalitosDirection | null;
  outcome: "goal" | "save" | null;
  animStartMs: number | null;
  nowMs: number;
  compact?: boolean;
};

const COMPACT_H = "h-32 min-[380px]:h-36 sm:h-44";
const FULL_H = "h-60 sm:h-80";

function FieldFallback({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center bg-[#04070f] ${compact ? COMPACT_H : FULL_H}`}
    >
      <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">
        Cargando estadio…
      </span>
    </div>
  );
}

export const PenalitosField3D = memo(function PenalitosField3D({
  phase,
  shooterChoice,
  goalkeeperChoice,
  outcome,
  animStartMs,
  nowMs,
  compact = false,
}: PenalitosField3DProps) {
  return (
    <div className={`relative ${compact ? COMPACT_H : FULL_H}`}>
      <Canvas
        shadows
        camera={{ position: [-0.45, 2.2, 9.3], fov: 44, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <PenalitosScene
            phase={phase}
            shooterChoice={shooterChoice}
            goalkeeperChoice={goalkeeperChoice}
            outcome={outcome}
            animStartMs={animStartMs}
            nowMs={nowMs}
          />
        </Suspense>
      </Canvas>

      {/* Broadcast-style vignette + top gloss */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 95% at 50% 38%, transparent 58%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-10"
        style={{ background: "linear-gradient(rgba(2,6,16,0.4), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
        style={{ background: "linear-gradient(transparent, rgba(2,6,16,0.45))" }}
      />
    </div>
  );
});

export { FieldFallback };
