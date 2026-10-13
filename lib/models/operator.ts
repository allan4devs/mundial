import { ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export interface OperatorAccount {
  _id?: ObjectId;
  name: string;
  company: string;
  email: string;
  password: string;
  status: "pending" | "approved" | "active";
  commissionRate: number;
  createdAt: Date;
  // Email verification
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationExpiry?: Date | null;
  // Password reset
  resetToken?: string | null;
  resetExpiry?: Date | null;
  notificationPreferences?: {
    bookingCreated: boolean;
    bookingReminder24h: boolean;
    bookingStatusChanges: boolean;
    weeklyPerformanceDigest: boolean;
    partnerNetworkUpdates: boolean;
  };
}

export async function getOperatorsCollection() {
  const db = await getDb();
  return db.collection<OperatorAccount>(COLLECTIONS.OPERATORS);
}

export async function findOperatorByEmail(email: string) {
  const col = await getOperatorsCollection();
  return col.findOne({ email: email.toLowerCase() });
}

export async function findOperatorById(id: string) {
  const col = await getOperatorsCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function findOperatorByVerificationToken(token: string) {
  const col = await getOperatorsCollection();
  return col.findOne({ verificationToken: token, verificationExpiry: { $gt: new Date() } });
}

export async function findOperatorByResetToken(token: string) {
  const col = await getOperatorsCollection();
  return col.findOne({ resetToken: token, resetExpiry: { $gt: new Date() } });
}

export async function createOperator(data: Omit<OperatorAccount, "_id">) {
  const col = await getOperatorsCollection();
  const result = await col.insertOne(data);
  return result;
}

export async function updateOperator(id: string, update: Partial<OperatorAccount>) {
  const col = await getOperatorsCollection();
  return col.updateOne({ _id: new ObjectId(id) }, { $set: update });
}

export async function verifyOperatorEmail(id: string) {
  const col = await getOperatorsCollection();
  return col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { emailVerified: true, verificationToken: null, verificationExpiry: null } }
  );
}

export async function setVerificationToken(id: string, token: string, expiry: Date) {
  const col = await getOperatorsCollection();
  return col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { verificationToken: token, verificationExpiry: expiry } }
  );
}

export async function setResetToken(id: string, token: string, expiry: Date) {
  const col = await getOperatorsCollection();
  return col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { resetToken: token, resetExpiry: expiry } }
  );
}

export async function clearResetToken(id: string) {
  const col = await getOperatorsCollection();
  return col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { resetToken: null, resetExpiry: null } }
  );
}

export async function listOperators() {
  const col = await getOperatorsCollection();
  return col.find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
}
