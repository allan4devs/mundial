import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { BCRYPT_SALT_ROUNDS } from "@/lib/constants/auth";

export interface AdminAccount {
  _id?: ObjectId;
  username: string;
  password: string;
  createdAt: Date;
}

export async function getAdminsCollection() {
  const db = await getDb();
  return db.collection<AdminAccount>(COLLECTIONS.ADMINS);
}

async function ensureDefaultAdmin() {
  const col = await getAdminsCollection();
  const total = await col.estimatedDocumentCount();

  if (total > 0) return;

  const hashedPassword = await bcrypt.hash("admin", BCRYPT_SALT_ROUNDS);
  await col.insertOne({
    username: "admin",
    password: hashedPassword,
    createdAt: new Date(),
  });
}

export async function findAdminByUsername(username: string) {
  await ensureDefaultAdmin();
  const col = await getAdminsCollection();
  return col.findOne({ username: username.toLowerCase() });
}

