import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { defaultCvProfile, getCvProfile, saveCvProfile, validateCvProfile } from "@/lib/cv/profile";
import { buildCvSources } from "@/lib/cv/sources";
import { CvInputError } from "@/lib/cv/jd";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Sign in to edit your experience." }, { status: 401 });
  try {
    const sources = buildCvSources();
    return NextResponse.json({ profile: await getCvProfile(admin.id) ?? defaultCvProfile(sources), jobs: sources.jobs.map((job) => ({ id: job.id, ...sources.base.experience[job.index], bullets: undefined })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Your experience could not be loaded. Check the database connection." }, { status: 503 }); }
}
export async function PUT(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Sign in to save your experience." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const bodyText = await request.text();
    if (bodyText.length > 150_000) throw new CvInputError("The profile is too large.");
    let body: unknown;
    try { body = JSON.parse(bodyText); } catch { throw new CvInputError("Send a valid profile."); }
    const profile = validateCvProfile(body);
    await saveCvProfile(admin.id, profile);
    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CvInputError ? error.message : "Your changes could not be saved. Keep this page open and try again." }, { status: error instanceof CvInputError ? 400 : 503 });
  }
}
