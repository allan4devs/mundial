"use client";

export default function ScoresError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050a08] px-4 text-center text-white">
      <p className="font-black">Algo fallo en Scores</p>
      <p className="text-sm text-white/50">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[#9dff34] px-4 py-2 text-sm font-black text-black"
      >
        Reintentar
      </button>
    </div>
  );
}
