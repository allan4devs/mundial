import { NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/constants/db";
import { getDb } from "@/lib/helpers/mongodb";

const DEFAULT_DJ_TRACKS = [
  {
    slug: "rainforest-breaks",
    title: "Rainforest Breaks",
    artist: "La Vieja Lab",
    bpm: 124,
    musicalKey: "8A",
    energy: 88,
    color: "#22c55e",
    duration: 246,
    genre: "Organic Breaks",
    source: "demo",
    isActive: true,
    sortOrder: 10,
  },
  {
    slug: "volcanic-house",
    title: "Volcanic House",
    artist: "Arenal Systems",
    bpm: 128,
    musicalKey: "9A",
    energy: 92,
    color: "#f59e0b",
    duration: 318,
    genre: "Peak House",
    source: "demo",
    isActive: true,
    sortOrder: 20,
  },
  {
    slug: "midnight-cumbia-tech",
    title: "Midnight Cumbia Tech",
    artist: "Central Valley",
    bpm: 102,
    musicalKey: "4B",
    energy: 74,
    color: "#38bdf8",
    duration: 282,
    genre: "Latin Electronic",
    source: "demo",
    isActive: true,
    sortOrder: 30,
  },
  {
    slug: "jungle-dnb-field-test",
    title: "Jungle DnB Field Test",
    artist: "MIT Sound Crew",
    bpm: 172,
    musicalKey: "11A",
    energy: 96,
    color: "#a855f7",
    duration: 212,
    genre: "Drum and Bass",
    source: "demo",
    isActive: true,
    sortOrder: 40,
  },
  {
    slug: "quantum-sync-tool",
    title: "Quantum Sync Tool",
    artist: "Harvard Audio Lab",
    bpm: 136,
    musicalKey: "6A",
    energy: 84,
    color: "#f43f5e",
    duration: 264,
    genre: "Techno",
    source: "demo",
    isActive: true,
    sortOrder: 50,
  },
];

function normalizeTrack(doc: Record<string, unknown>) {
  return {
    id: String(doc.slug ?? doc._id ?? ""),
    title: String(doc.title ?? "Untitled Track"),
    artist: String(doc.artist ?? "Unknown Artist"),
    bpm: Number(doc.bpm ?? 120),
    key: String(doc.musicalKey ?? doc.key ?? "8A"),
    energy: Number(doc.energy ?? 70),
    color: String(doc.color ?? "#22c55e"),
    duration: Number(doc.duration ?? 240),
    genre: String(doc.genre ?? "Electronic"),
    source: "demo" as const,
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.DJ_TRACKS);

    const existingCount = await collection.countDocuments({});

    if (existingCount === 0) {
      const now = new Date();
      await collection.insertMany(
        DEFAULT_DJ_TRACKS.map((track) => ({
          ...track,
          createdAt: now,
          updatedAt: now,
        })),
      );
      await collection.createIndex({ slug: 1 }, { unique: true });
      await collection.createIndex({ isActive: 1, sortOrder: 1 });
    }

    const tracks = await collection
      .find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, bpm: 1 })
      .toArray();

    return NextResponse.json({
      tracks: tracks.map((track) => normalizeTrack(track)),
    });
  } catch (error) {
    console.error("Failed to load DJ tracks", error);
    return NextResponse.json({ error: "Failed to load DJ tracks" }, { status: 500 });
  }
}
