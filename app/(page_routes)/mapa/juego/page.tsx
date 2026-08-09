import type { Metadata } from 'next';
import { Suspense } from 'react';
import GameClient from './GameClient';

export const metadata: Metadata = {
  title: 'Fantasma de la Ciudad Esmeralda | La Vieja Adventures',
  description: 'Juego 2.5D ambientado en el Cañón del Río La Vieja, Costa Rica.',
};

export default function JuegoPage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100vw', height: '100vh', background: '#060c10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e676', fontFamily: '"Courier New", monospace', letterSpacing: 3, fontSize: 14 }}>
        CARGANDO…
      </div>
    }>
      <GameClient />
    </Suspense>
  );
}
