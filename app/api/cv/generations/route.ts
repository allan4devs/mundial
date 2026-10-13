import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { listGenerations } from "@/lib/cv/store";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Sign in to view saved CVs." }, { status: 401 });
  try {
    return NextResponse.json({ generations: await listGenerations(admin.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Saved CVs could not be loaded. Please try again." }, { status: 503 });
  }
}
