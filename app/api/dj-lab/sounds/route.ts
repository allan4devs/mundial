import { NextRequest, NextResponse } from "next/server";

import { getStylePack, isStyle } from "@/lib/song-builder/styles";

export const dynamic = "force-dynamic";

/**
 * GET /api/dj-lab/sounds?style=rock
 *
 * Returns the whole style pack: its tuning and every sound each row can be
 * played through. The collection is seeded on first read.
 */
export async function GET(req: NextRequest) {
  const style = req.nextUrl.searchParams.get("style");
  if (!isStyle(style)) {
    return NextResponse.json({ error: "Unknown style." }, { status: 400 });
  }

  try {
    const pack = await getStylePack(style);
    if (!pack) return NextResponse.json({ error: "That style has no sounds." }, { status: 404 });
    return NextResponse.json({ pack });
  } catch (error) {
    console.error("[dj-lab/sounds GET]", error);
    return NextResponse.json({ error: "The sound library is unavailable." }, { status: 500 });
  }
}
