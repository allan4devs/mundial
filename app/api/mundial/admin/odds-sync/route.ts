import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "Odds deshabilitado." }, { status: 410 });
}
