import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest, type AdminTokenPayload } from "@/lib/admin-auth";

export function requireAdmin(req: NextRequest): AdminTokenPayload | NextResponse {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return admin;
}

export function isAdminResult(
  value: AdminTokenPayload | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
