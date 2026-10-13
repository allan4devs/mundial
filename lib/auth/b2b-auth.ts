import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { B2B_COOKIE_NAME, TOKEN_EXPIRY } from "@/lib/constants/auth";

const JWT_SECRET = process.env.B2B_JWT_SECRET || "b2b-secret-change-in-production";
const COOKIE_NAME = B2B_COOKIE_NAME;

export interface OperatorTokenPayload {
  id: string;
  email: string;
  name: string;
  company: string;
  commissionRate: number;
  status: string;
}

export function signToken(payload: OperatorTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): OperatorTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as OperatorTokenPayload;
  } catch {
    return null;
  }
}

export async function getOperatorFromCookies(): Promise<OperatorTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getOperatorFromRequest(req: NextRequest): OperatorTokenPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
