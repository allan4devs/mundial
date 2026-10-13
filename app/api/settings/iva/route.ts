import { NextResponse } from "next/server";
import { getB2BSettings } from "@/lib/models/b2b-settings";

export async function GET() {
  try {
    const settings = await getB2BSettings();
    return NextResponse.json({ ivaRate: settings?.ivaRate ?? 13 });
  } catch (error) {
    console.error("Public IVA settings GET error", error);
    return NextResponse.json({ ivaRate: 13 });
  }
}
