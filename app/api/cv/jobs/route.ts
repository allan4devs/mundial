import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { loadCvJobs } from "@/lib/cv/jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const result = await loadCvJobs();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("CV jobs load failed", error);
    return NextResponse.json({ error: "Could not load CV jobs" }, { status: 500 });
  }
}
