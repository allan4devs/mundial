import { NextRequest, NextResponse } from "next/server";

import { listSongs, saveSong } from "@/lib/song-builder/songs";
import { OWNER_HEADER } from "@/lib/song-builder/types";
import { SongBuilderError, parseSongInput, requireOwnerKey } from "@/lib/song-builder/validate";

export const dynamic = "force-dynamic";

function fail(error: unknown, where: string) {
  if (error instanceof SongBuilderError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`[dj-lab/songs ${where}]`, error);
  return NextResponse.json({ error: "The song library is unavailable." }, { status: 500 });
}

/** GET /api/dj-lab/songs — recent songs, or `?mine=1` for this browser's own. */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const mine = params.get("mine") === "1";
    const songs = await listSongs({
      ownerKey: mine ? requireOwnerKey(req.headers.get(OWNER_HEADER)) : undefined,
      limit: Number(params.get("limit")) || undefined,
    });
    return NextResponse.json({ songs });
  } catch (error) {
    return fail(error, "GET");
  }
}

/** POST /api/dj-lab/songs — create or overwrite one of this browser's songs. */
export async function POST(req: NextRequest) {
  try {
    const ownerKey = requireOwnerKey(req.headers.get(OWNER_HEADER));
    const song = await saveSong(parseSongInput(await req.json()), ownerKey);
    return NextResponse.json({ song });
  } catch (error) {
    return fail(error, "POST");
  }
}
