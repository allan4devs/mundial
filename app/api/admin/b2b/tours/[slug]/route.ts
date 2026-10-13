import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { fallbackPackagesForTour, normalizeTourPackages } from "@/lib/tour-packages";
import { ObjectId } from "mongodb";

function isAuthorized(req: NextRequest): boolean { return Boolean(getAdminFromRequest(req)); }

function normalizeTour(body: Record<string, unknown>, fallbackSlug: string) {
  const slug = String(body.slug ?? fallbackSlug).trim();
  const packages = normalizeTourPackages(body.packages);

  return {
    slug,
    name: String(body.name ?? "").trim(),
    operator: String(body.operator ?? "").trim(),
    titleEs: String(body.titleEs ?? "").trim(),
    titleEn: String(body.titleEn ?? "").trim(),
    descriptionEs: String(body.descriptionEs ?? "").trim(),
    descriptionEn: String(body.descriptionEn ?? "").trim(),
    details: String(body.details ?? "").trim(),
    duration: String(body.duration ?? "").trim(),
    difficulty: String(body.difficulty ?? "").trim(),
    location: String(body.location ?? "").trim(),
    price: String(body.price ?? "").trim(),
    priceCRC: Number(body.priceCRC ?? 0),
    retailPricePerPax: Number(body.retailPricePerPax ?? body.priceCRC ?? 0),
    minPax: Number(body.minPax ?? 1),
    maxPax: Number(body.maxPax ?? 20),
    includes: Array.isArray(body.includes) ? body.includes.map((item) => String(item)) : [],
    inclusions: Array.isArray(body.inclusions) ? body.inclusions.map((item) => String(item)) : [],
    exclusions: Array.isArray(body.exclusions) ? body.exclusions.map((item) => String(item)) : [],
    cancellationPolicy: String(body.cancellationPolicy ?? "").trim(),
    restrictions: String(body.restrictions ?? "").trim(),
    packages: packages.length > 0 ? packages : fallbackPackagesForTour(slug),
    contact: body.contact && typeof body.contact === "object" ? body.contact : {},
    type: String(body.type ?? "both"),
    isActive: body.isActive !== false,
    isFeatured: Boolean(body.isFeatured),
    isMain: Boolean(body.isMain),
    currency: String(body.currency ?? "USD"),
    accent: String(body.accent ?? "").trim(),
    border: String(body.border ?? "").trim(),
    iconName: String(body.iconName ?? "").trim(),
    tagEs: String(body.tagEs ?? "").trim(),
    tagEn: String(body.tagEn ?? "").trim(),
    whatToBring: Array.isArray(body.whatToBring) ? body.whatToBring.map((item) => String(item)) : [],
    ageRequirement: String(body.ageRequirement ?? "").trim(),
    meetingPoint: String(body.meetingPoint ?? "").trim(),
    transportInfo: String(body.transportInfo ?? "").trim(),
    weatherPolicy: String(body.weatherPolicy ?? "").trim(),
    updatedAt: new Date().toISOString(),
  };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params; const body = await req.json(); const normalized = normalizeTour(body, slug);
  const bodyId = String(body?._id ?? "").trim();
  const filter = ObjectId.isValid(bodyId)
    ? { $or: [{ _id: new ObjectId(bodyId) }, { slug }] }
    : { slug };
  const db = await getDb(); const result = await db.collection(COLLECTIONS.TOURS).updateOne(filter, { $set: normalized });
  if (result.matchedCount === 0) return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  return NextResponse.json({ message: "Tour updated.", slug: normalized.slug });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params; const db = await getDb(); const result = await db.collection(COLLECTIONS.TOURS).deleteOne({ slug });
  if (result.deletedCount === 0) return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  return NextResponse.json({ message: "Tour deleted." });
}
