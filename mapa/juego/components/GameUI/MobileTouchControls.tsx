'use client';
import { memo, useCallback, useEffect, useState, type MutableRefObject, type PointerEvent } from 'react';
import type { KeyState } from '../../hooks/useKeyboard';
import type { GameState } from '../../types';

interface MobileTouchControlsProps {
  keys: MutableRefObject<KeyState>;
  status: GameState['status'];
}

export const MobileTouchControls = memo(function MobileTouchControls({
  keys,
  status,
}: MobileTouchControlsProps) {
  const [showTouchControls, setShowTouchControls] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: none) and (pointer: coarse)');
    const update = () => setShowTouchControls(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const releaseJump = useCallback(() => {
    keys.current.jump = false;
  }, [keys]);

  const handleJumpStart = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    keys.current.jump = true;
  }, [keys]);

  const handleJumpEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    releaseJump();
  }, [releaseJump]);

  useEffect(() => {
    if (status === 'playing') return;
    releaseJump();
  }, [releaseJump, status]);

  useEffect(() => releaseJump, [releaseJump]);

  if (!showTouchControls || status !== 'playing') return null;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 16,
          bottom: 24,
          maxWidth: '48vw',
          color: 'rgba(255,255,255,0.46)',
          fontSize: 10,
          lineHeight: 1.45,
          textShadow: '0 2px 10px rgba(0,0,0,0.75)',
          pointerEvents: 'none',
        }}
      >
        Presiona el canvas para avanzar
      </div>
      <button
        type="button"
        aria-label="Saltar"
        onPointerDown={handleJumpStart}
        onPointerUp={handleJumpEnd}
        onPointerCancel={handleJumpEnd}
        onPointerLeave={handleJumpEnd}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 82,
          height: 82,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.72)',
          background: 'rgba(0, 230, 118, 0.22)',
          color: '#fff',
          boxShadow: '0 12px 34px rgba(0,0,0,0.36), inset 0 0 24px rgba(79,195,247,0.25)',
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: 1,
          pointerEvents: 'auto',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        SALTO
      </button>
    </>
  );
});
