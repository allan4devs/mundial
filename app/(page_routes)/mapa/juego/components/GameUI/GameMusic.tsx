'use client';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createChiptune, type Chiptune } from '../../lib/chiptune';

// Cheerful 8-bit platformer soundtrack, synthesized on the fly (no audio files).
const STORAGE_KEY = 'juego-music-muted';

export const GameMusic = memo(function GameMusic() {
  const [muted, setMuted] = useState(false);
  const engineRef = useRef<Chiptune | null>(null);
  const mutedRef = useRef(false);

  // Restore mute preference
  useEffect(() => {
    try { setMuted(window.localStorage.getItem(STORAGE_KEY) === '1'); } catch {}
  }, []);

  // Keep the engine's volume in sync with the mute state
  useEffect(() => {
    mutedRef.current = muted;
    engineRef.current?.setMuted(muted);
  }, [muted]);

  // Boot the synth on the first user gesture (autoplay policy)
  useEffect(() => {
    const start = () => {
      if (engineRef.current) return;
      try {
        engineRef.current = createChiptune();
        engineRef.current.setMuted(mutedRef.current);
      } catch {
        engineRef.current = null;
      }
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    window.addEventListener('touchstart', start);
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('touchstart', start);
    };
  }, []);

  // Tear down the audio graph on unmount
  useEffect(() => () => {
    engineRef.current?.dispose();
    engineRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try { window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? 'Activar música' : 'Silenciar música'}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 11px',
        border: '1px solid rgba(79,195,247,0.35)',
        borderRadius: 8,
        background: muted ? 'rgba(255,255,255,0.06)' : 'rgba(79,195,247,0.14)',
        color: muted ? '#ffffff70' : '#4fc3f7',
        fontFamily: '"Courier New", monospace',
        fontWeight: 900,
        fontSize: 11,
        letterSpacing: 1,
        cursor: 'pointer',
        textShadow: muted ? 'none' : '0 0 8px #4fc3f799',
      }}
    >
      <span style={{ fontSize: 15 }}>{muted ? '🔇' : '🎵'}</span>
      MÚSICA
    </button>
  );
});
