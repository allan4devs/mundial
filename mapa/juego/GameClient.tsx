'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060c10',
        color: '#00e676',
        fontFamily: '"Courier New", monospace',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 32, filter: 'drop-shadow(0 0 12px #4fc3f7)' }}>👻</span>
      <span style={{ fontSize: 14, letterSpacing: 3, textShadow: '0 0 10px #00e676' }}>
        CARGANDO EL CAÑÓN…
      </span>
    </div>
  ),
});

export default function GameClient() {
  const params = useSearchParams();
  const levelParam = params?.get('level');
  const startLevel = levelParam !== null ? parseInt(levelParam, 10) : undefined;

  return <Game startLevel={isNaN(startLevel as number) ? undefined : startLevel} />;
}
