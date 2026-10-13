import { NextResponse } from "next/server";
import { readActiveStoreCatalog } from "@/lib/store/products";

export async function GET() {
  try {
    const catalog = await readActiveStoreCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    console.error("GET /api/store/products error:", err);
    return NextResponse.json({ error: "Failed to fetch store products" }, { status: 500 });
  }
}