'use client';
import { useCallback } from 'react';
import {
  createRaceRoom,
  finishRaceRoom,
  joinRaceRoom,
  setRaceReady,
  startRaceRoom,
} from '../lib/raceApi';
import { getRaceError } from '../lib/raceErrors';
import type { RaceRoomView } from '../types';

interface RaceRoomActionsParams {
  applyRoom: (nextRoom: RaceRoomView) => void;
  closeWs: () => void;
  joinCode: string;
  name: string;
  playerId: string;
  resetProgress: () => void;
  room: RaceRoomView | null;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  setRoom: (room: RaceRoomView | null) => void;
  stopProgressPolling: () => void;
  subscribeWs: (code: string) => void;
}

export function useRaceRoomActions({
  applyRoom,
  closeWs,
  joinCode,
  name,
  playerId,
  resetProgress,
  room,
  setError,
  setLoading,
  setRoom,
  stopProgressPolling,
  subscribeWs,
}: RaceRoomActionsParams) {
  const createRoom = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const json = await createRaceRoom(playerId, name);
      if (!json.ok || !json.room || !json.code) {
        setError(getRaceError(json.error ?? 'Error al crear'));
        return;
      }
      applyRoom(json.room);
      subscribeWs(json.code);
    } catch (error) {
      setError(getRaceError(error instanceof Error ? error.message : 'network_unavailable'));
    } finally {
      setLoading(false);
    }
  }, [applyRoom, name, playerId, setError, setLoading, subscribeWs]);

  const joinRoom = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError('Ingresa el codigo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const json = await joinRaceRoom(code, playerId, name);
      if (!json.ok || !json.room) {
        setError(getRaceError(json.error));
        return;
      }
      applyRoom(json.room);
      subscribeWs(code);
    } catch (error) {
      setError(getRaceError(error instanceof Error ? error.message : 'network_unavailable'));
    } finally {
      setLoading(false);
    }
  }, [applyRoom, joinCode, name, playerId, setError, setLoading, subscribeWs]);

  const toggleReady = useCallback(async () => {
    if (!room) return;
    const me = room.players.find((player) => player.id === playerId);
    const ready = !(me?.ready ?? false);

    setLoading(true);
    try {
      const json = await setRaceReady(room.code, playerId, ready);
      if (!json.ok || !json.room) {
        setError(getRaceError(json.error));
        return;
      }
      applyRoom(json.room);
    } catch (error) {
      setError(getRaceError(error instanceof Error ? error.message : 'network_unavailable'));
    } finally {
      setLoading(false);
    }
  }, [applyRoom, playerId, room, setError, setLoading]);

  const startRace = useCallback(async () => {
    if (!room) return;

    setLoading(true);
    setError('');
    try {
      const json = await startRaceRoom(room.code, room.hostId);
      if (!json.ok || !json.room) {
        setError(getRaceError(json.error));
        return;
      }
      applyRoom(json.room);
    } catch (error) {
      setError(getRaceError(error instanceof Error ? error.message : 'network_unavailable'));
    } finally {
      setLoading(false);
    }
  }, [applyRoom, playerId, room, setError, setLoading]);

  const finishRace = useCallback(async () => {
    if (!room) return;
    stopProgressPolling();

    try {
      await finishRaceRoom(room.code, playerId);
    } catch {}
  }, [playerId, room, stopProgressPolling]);

  const leaveRoom = useCallback(() => {
    stopProgressPolling();
    closeWs();
    setRoom(null);
    resetProgress();
    setError('');
  }, [closeWs, resetProgress, setError, setRoom, stopProgressPolling]);

  return { createRoom, finishRace, joinRoom, leaveRoom, startRace, toggleReady };
}
