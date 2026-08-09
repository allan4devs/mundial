"use client";

import { useSearchParams } from "next/navigation";
import { LobbyView } from "./components/LobbyView";
import { MainMenu } from "./components/MainMenu";
import { NameStep } from "./components/NameStep";
import { RaceView } from "./components/RaceView";
import { ResultsView } from "./components/ResultsView";
import { useOnlineRace } from "./hooks/useOnlineRace";

export default function OnlineGameClient() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams?.get("code")?.toUpperCase() ?? "";
  const race = useOnlineRace(inviteCode);

  if (!race.nameSubmitted) {
    return (
      <NameStep
        name={race.name}
        onNameChange={race.setName}
        onSubmit={race.submitName}
      />
    );
  }

  if (!race.room) {
    return (
      <MainMenu
        name={race.name}
        joinCode={race.joinCode}
        error={race.error}
        loading={race.loading}
        onJoinCodeChange={race.setJoinCode}
        onCreate={race.createRoom}
        onJoin={race.joinRoom}
        onEditName={race.editName}
      />
    );
  }

  if (race.room.status === "lobby") {
    return (
      <LobbyView
        room={race.room}
        playerId={race.playerId}
        error={race.error}
        loading={race.loading}
        onToggleReady={race.toggleReady}
        onStart={race.startRace}
        onLeave={race.leaveRoom}
      />
    );
  }

  if (race.room.status === "racing") {
    return (
      <RaceView
        room={race.room}
        playerId={race.playerId}
        name={race.name}
        myPct={race.myPct}
        sharedPosRef={race.sharedPosRef}
        onFinish={race.finishRace}
      />
    );
  }

  return <ResultsView room={race.room} playerId={race.playerId} onLeave={race.leaveRoom} />;
}
