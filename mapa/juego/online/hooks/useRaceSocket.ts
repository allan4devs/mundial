'use client';
import { useCallback, useEffect, useRef } from 'react';
import { WS_URL } from '../../constants/online';
import type { RaceRoomView } from '../types';

export function useRaceSocket(applyRoom: (nextRoom: RaceRoomView) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  const subscribeWs = useCallback((code: string) => {
    wsRef.current?.close();
    wsRef.current = null;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ action: 'subscribe_race', code }));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'race_room' && msg.room) applyRoom(msg.room);
      } catch {}
    };
    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [applyRoom]);

  const closeWs = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => closeWs, [closeWs]);

  return { closeWs, subscribeWs };
}
