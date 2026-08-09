import { NextResponse } from "next/server";

export async function readRaceBody(request: Request) {
  return request.json().catch(() => ({}));
}

export function raceRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const isMongoConfig =
    message.includes("MONGODB_URI") ||
    message.includes("MongoParseError") ||
    message.includes("Invalid scheme") ||
    message.includes("connection string");

  console.error("Race API failed", error);

  return NextResponse.json(
    {
      ok: false,
      error: isMongoConfig ? "race_storage_unavailable" : "race_server_error",
    },
    { status: 500 }
  );
}
