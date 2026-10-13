import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export interface LoginLog {
  userType: "admin" | "operator" | "user";
  userId?: string;
  emailOrUsername: string;
  device: string;
  ip?: string;
  createdAt: Date;
}

async function getLoginLogsCollection() {
  const db = await getDb();
  return db.collection<LoginLog>(COLLECTIONS.LOGIN_LOGS);
}

export async function createLoginLog(log: LoginLog) {
  const col = await getLoginLogsCollection();
  return col.insertOne(log);
}

export async function listLoginLogs(limit = 300) {
  const col = await getLoginLogsCollection();
  return col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
}
