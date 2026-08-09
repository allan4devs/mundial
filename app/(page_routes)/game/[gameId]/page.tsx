import RaceClient from "@/components/game/RaceClient";

export default async function Page({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Carrera — {gameId}</h2>
      <RaceClient gameId={gameId} />
    </div>
  );
}
