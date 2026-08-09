import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "weights";
const MIN_REASONABLE_WEIGHT_KG = 25;
const MAX_REASONABLE_WEIGHT_KG = 250;

function normalizeWeightKg(value: unknown): number | null {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  // Some saved entries are coming in as grams (91450 => 91.45kg).
  return numericValue > 1000 ? numericValue / 1000 : numericValue;
}

function toIsoString(value: unknown): string | null {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getEntryId(req: NextRequest): string | null {
  const id = req.nextUrl.searchParams.get("id");
  return id && ObjectId.isValid(id) ? id : null;
}

export async function POST(req: NextRequest) {
  try {
    const { name, weight, timestamp } = await req.json();
    const normalizedWeight = normalizeWeightKg(weight);
    const recordedAt = toIsoString(timestamp);

    if (!name || normalizedWeight === null || !recordedAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      normalizedWeight < MIN_REASONABLE_WEIGHT_KG ||
      normalizedWeight > MAX_REASONABLE_WEIGHT_KG
    ) {
      return NextResponse.json(
        { error: `Weight must be between ${MIN_REASONABLE_WEIGHT_KG}kg and ${MAX_REASONABLE_WEIGHT_KG}kg` },
        { status: 400 }
      );
    }

    const db = await getDb();

    const entry = {
      name: String(name).trim().toUpperCase(),
      weight: normalizedWeight,
      timestamp: new Date(recordedAt),
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(entry);

    return NextResponse.json({
      id: result.insertedId.toString(),
      name: entry.name,
      weight: entry.weight,
      timestamp: entry.timestamp.toISOString(),
      createdAt: entry.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to save weight entry", error);
    return NextResponse.json({ error: "Failed to save weight entry" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = getEntryId(req);
    const { name, weight, timestamp } = await req.json();
    const normalizedWeight = normalizeWeightKg(weight);
    const recordedAt = toIsoString(timestamp);

    if (!id) {
      return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
    }

    if (!name || normalizedWeight === null || !recordedAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      normalizedWeight < MIN_REASONABLE_WEIGHT_KG ||
      normalizedWeight > MAX_REASONABLE_WEIGHT_KG
    ) {
      return NextResponse.json(
        { error: `Weight must be between ${MIN_REASONABLE_WEIGHT_KG}kg and ${MAX_REASONABLE_WEIGHT_KG}kg` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: String(name).trim().toUpperCase(),
          weight: normalizedWeight,
          timestamp: new Date(recordedAt),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: result._id.toString(),
      name: String(result.name ?? "").trim().toUpperCase(),
      weight: normalizeWeightKg(result.weight),
      timestamp: toIsoString(result.timestamp),
      createdAt: toIsoString(result.createdAt),
    });
  } catch (error) {
    console.error("Failed to update weight entry", error);
    return NextResponse.json({ error: "Failed to update weight entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = getEntryId(req);

    if (!id) {
      return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete weight entry", error);
    return NextResponse.json({ error: "Failed to delete weight entry" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();

    const docs = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ timestamp: 1 })
      .toArray();

    const entries = docs
      .map((doc) => {
        const timestamp = toIsoString(doc.timestamp);
        const weight = normalizeWeightKg(doc.weight);

        if (!timestamp || weight === null) {
          return null;
        }

        return {
          id: doc._id.toString(),
          name: String(doc.name ?? "").trim().toUpperCase(),
          weight,
          rawWeight: doc.weight,
          timestamp,
          createdAt: toIsoString(doc.createdAt),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to load weight entries", error);
    return NextResponse.json({ error: "Failed to load weight entries" }, { status: 500 });
  }
}
