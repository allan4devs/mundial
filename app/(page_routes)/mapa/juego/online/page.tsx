import type { Metadata } from "next";
import { Suspense } from "react";
import OnlineGameClient from "./OnlineGameClient";

export const metadata: Metadata = {
  title: "Carrera Online | Fantasma de la Ciudad Esmeralda",
  description: "Compite contra otros jugadores en tiempo real.",
};

export default function OnlinePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#060c10", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e676", fontFamily: '"Courier New", monospace', fontSize: 14, letterSpacing: 3 }}>
        CARGANDO…
      </div>
    }>
      <OnlineGameClient />
    </Suspense>
  );
}
