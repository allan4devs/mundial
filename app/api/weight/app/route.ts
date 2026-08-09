import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";

const COLLECTION_NAME = "weight_app_state";
const DOCUMENT_ID = "default";

type WeightAppPayload = {
  profiles?: unknown[];
  foods?: unknown[];
  meals?: unknown[];
  water?: unknown[];
};

type WeightAppDocument = Required<WeightAppPayload> & {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection<WeightAppDocument>(COLLECTION_NAME).findOne({ _id: DOCUMENT_ID });

    return NextResponse.json({
      profiles: normalizeArray(doc?.profiles),
      foods: normalizeArray(doc?.foods),
      meals: normalizeArray(doc?.meals),
      water: normalizeArray(doc?.water),
      updatedAt: doc?.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
    });
  } catch (error) {
    console.error("Failed to load weight app state", error);
    return NextResponse.json({ error: "Failed to load weight app state" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = (await req.json()) as WeightAppPayload;
    const db = await getDb();
    const nextState = {
      profiles: normalizeArray(payload.profiles),
      foods: normalizeArray(payload.foods),
      meals: normalizeArray(payload.meals),
      water: normalizeArray(payload.water),
      updatedAt: new Date(),
    };

    await db
      .collection<WeightAppDocument>(COLLECTION_NAME)
      .updateOne({ _id: DOCUMENT_ID }, { $set: nextState, $setOnInsert: { createdAt: new Date() } }, { upsert: true });

    return NextResponse.json({
      ...nextState,
      updatedAt: nextState.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to save weight app state", error);
    return NextResponse.json({ error: "Failed to save weight app state" }, { status: 500 });
  }
}
