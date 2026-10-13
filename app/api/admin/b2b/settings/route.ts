import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getB2BSettings, upsertB2BSettings } from "@/lib/models/b2b-settings";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getB2BSettings();
    return NextResponse.json({
      settings: {
        ivaRate: settings?.ivaRate ?? 13,
        tourPricing: settings?.tourPricing ?? [],
      },
    });
  } catch (error) {
    console.error("Admin settings GET error", error);
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ivaRate = Number(body.ivaRate);
    const tourPricing = Array.isArray(body.tourPricing) ? body.tourPricing : [];

    if (Number.isNaN(ivaRate) || ivaRate < 0 || ivaRate > 100) {
      return NextResponse.json({ error: "Invalid IVA rate." }, { status: 400 });
    }

    await upsertB2BSettings({ ivaRate, tourPricing });
    return NextResponse.json({ message: "Settings updated." });
  } catch (error) {
    console.error("Admin settings PUT error", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
