import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME as ADMIN_COOKIE_NAME_CONST, TOKEN_EXPIRY } from "@/lib/constants/auth";
import { resolveRuntimeSecret } from "@/lib/security/runtime-secret";

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE_NAME_CONST;

function adminJwtSecret(): string {
  return resolveRuntimeSecret(
    "ADMIN_JWT_SECRET",
    process.env.ADMIN_JWT_SECRET,
    process.env.B2B_JWT_SECRET || "development-only-admin-secret"
  );
}

export interface AdminTokenPayload {
  id: string;
  username: string;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, adminJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, adminJwtSecret()) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookies(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminFromRequest(req: NextRequest): AdminTokenPayload | null {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
