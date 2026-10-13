import { NextResponse } from "next/server";
import { readPublicTours } from "@/lib/tours/public-catalog";

export async function GET() {
  try {
    const tours = await readPublicTours();
    return NextResponse.json({ tours });
  } catch (err) {
    console.error("GET /api/tours error:", err);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}