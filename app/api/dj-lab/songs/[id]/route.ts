import { NextRequest, NextResponse } from "next/server";

import { deleteSong, getSong } from "@/lib/song-builder/songs";
import { OWNER_HEADER } from "@/lib/song-builder/types";
import { SongBuilderError, isSongId, requireOwnerKey } from "@/lib/song-builder/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function fail(error: unknown, where: string) {
  if (error instanceof SongBuilderError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`[dj-lab/songs/:id ${where}]`, error);
  return NextResponse.json({ error: "The song library is unavailable." }, { status: 500 });
}

function requireId(id: string) {
  if (!isSongId(id)) throw new SongBuilderError("Malformed song id.", 404);
  return id;
}

/** GET /api/dj-lab/songs/:id — load one song into the studio. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const song = await getSong(requireId((await ctx.params).id));
    if (!song) return NextResponse.json({ error: "Song not found." }, { status: 404 });
    return NextResponse.json({ song });
  } catch (error) {
    return fail(error, "GET");
  }
}

/** DELETE /api/dj-lab/songs/:id — only the browser that saved it may remove it. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const ownerKey = requireOwnerKey(req.headers.get(OWNER_HEADER));
    await deleteSong(requireId((await ctx.params).id), ownerKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, "DELETE");
  }
}
