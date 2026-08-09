'use client';
import { useEffect, useRef } from 'react';

export interface KeyState {
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean; // Control only — used for sapphire shooting
}

export function useKeyboard() {
  const keys = useRef<KeyState>({ left: false, right: false, jump: false, fire: false });

  useEffect(() => {
    const GAME_KEYS = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'KeyA',
      'KeyD',
      'KeyW',
      'Space',
      'ControlLeft',
      'ControlRight',
    ];

    const onDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.includes(e.code)) e.preventDefault();
      switch (e.code) {
        case 'ArrowLeft':  case 'KeyA': keys.current.left  = true; break;
        case 'ArrowRight': case 'KeyD': keys.current.right = true; break;
        case 'Space': case 'ArrowUp': case 'KeyW': keys.current.jump = true; break;
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') keys.current.fire = true;
    };
    const onUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':  case 'KeyA': keys.current.left  = false; break;
        case 'ArrowRight': case 'KeyD': keys.current.right = false; break;
        case 'Space': case 'ArrowUp': case 'KeyW': keys.current.jump = false; break;
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') keys.current.fire = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  return keys;
}
