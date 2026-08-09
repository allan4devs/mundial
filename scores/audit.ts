import type { Db } from "mongodb";
import { SCORES_COLLECTIONS } from "./db";

export async function writeAdminAudit(
  db: Db,
  entry: {
    adminId: string;
    adminUsername: string;
    action: string;
    matchId?: string;
    before?: unknown;
    after?: unknown;
    source?: "manual" | "provider";
  }
) {
  await db.collection(SCORES_COLLECTIONS.ADMIN_AUDIT).insertOne({
    ...entry,
    source: entry.source ?? "manual",
    createdAt: new Date(),
  });
}
