import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

import { resolveRuntimeSecret } from "./security/runtime-secret";

export const ADMIN_COOKIE = "b2b_admin_token";

export type AdminTokenPayload = {
  id: string;
  username: string;
};

function adminSecret() {
  return resolveRuntimeSecret(
    "ADMIN_JWT_SECRET",
    process.env.ADMIN_JWT_SECRET,
    "development-only-admin-jwt-secret"
  );
}

export function signAdminToken(payload: AdminTokenPayload, expiresIn = "12h") {
  return jwt.sign(payload, adminSecret(), { expiresIn } as jwt.SignOptions);
}

/**
 * Reads the admin JWT from the `b2b_admin_token` cookie (falling back to an
 * `Authorization: Bearer` header). Returns null when absent or invalid.
 */
export function getAdminFromRequest(req: NextRequest): AdminTokenPayload | null {
  const bearer = req.headers.get("authorization");
  const token =
    req.cookies.get(ADMIN_COOKIE)?.value ??
    (bearer?.toLowerCase().startsWith("bearer ") ? bearer.slice(7).trim() : undefined);

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, adminSecret());
    if (typeof decoded === "string" || !decoded) return null;

    const { id, username } = decoded as Partial<AdminTokenPayload>;
    if (!id || !username) return null;

    return { id, username };
  } catch {
    return null;
  }
}
