import RaceClient from "../../components/game/RaceClient";

export default function Page({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Carrera — {gameId}</h2>
      <RaceClient gameId={gameId} />
    </div>
  );
}
