"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateId, getSavedName } from "../../lib/onlineId";
import { getRaceRoom } from "../lib/raceApi";
import { useRaceProgress } from "./useRaceProgress";
import { useRaceRoomActions } from "./useRaceRoomActions";
import { useRaceSocket } from "./useRaceSocket";
import type { RaceRoomView } from "../types";

export function useOnlineRace(inviteCode: string) {
  const [playerId] = useState<string>(() => getOrCreateId());
  const [name, setName] = useState<string>(() => getSavedName());
  const [nameSubmitted, setNameSubmitted] = useState(() => !!getSavedName());
  const [room, setRoom] = useState<RaceRoomView | null>(null);
  const [joinCode, setJoinCode] = useState(inviteCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const applyRoom = useCallback((nextRoom: RaceRoomView) => {
    setRoom(nextRoom);
  }, []);
  const { closeWs, subscribeWs } = useRaceSocket(applyRoom);
  const { myPct, resetProgress, sharedPosRef, startProgressPolling, stopProgressPolling } = useRaceProgress(playerId);
  const { createRoom, finishRace, joinRoom, leaveRoom, startRace, toggleReady } = useRaceRoomActions({
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
  });

  useEffect(() => {
    if (inviteCode && nameSubmitted && !room) {
      setJoinCode(inviteCode);
    }
  }, [inviteCode, nameSubmitted, room]);

  useEffect(() => {
    if (room?.status === "racing") {
      startProgressPolling(room.code, room.levelIndex);
      return;
    }

    stopProgressPolling();
  }, [room?.status, room?.code, room?.levelIndex, startProgressPolling, stopProgressPolling]);

  useEffect(() => {
    if (!room?.code) return;

    let cancelled = false;
    const pollRoom = async () => {
      const json = await getRaceRoom(room.code);
      if (cancelled || !json.ok || !json.room) return;
      applyRoom(json.room);
    };

    const interval = window.setInterval(() => {
      void pollRoom();
    }, room.status === "racing" ? 350 : 1200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyRoom, room?.code, room?.status]);

  const submitName = useCallback((nextName: string) => {
    const safeName = nextName.trim();
    if (!safeName) return;
    localStorage.setItem("race_player_name", safeName);
    setName(safeName);
    setNameSubmitted(true);
  }, []);

  return {
    playerId,
    name,
    setName,
    nameSubmitted,
    room,
    joinCode,
    setJoinCode,
    error,
    loading,
    myPct,
    sharedPosRef,
    submitName,
    createRoom,
    joinRoom,
    toggleReady,
    startRace,
    finishRace,
    leaveRoom,
    editName: () => setNameSubmitted(false),
  };
}
