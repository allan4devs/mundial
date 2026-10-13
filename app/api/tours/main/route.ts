// app/api/tours/main/route.ts
// Returns booking tour info from MongoDB by slug (or main tour by default), seeding defaults if not found

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { fallbackPackagesForTour, normalizeTourPackages } from "@/lib/tour-packages";

const DEFAULT_MAIN_TOUR = {
  slug: "tour-ciudad-esmeralda",
  isMain: true,
  isActive: true,
  name: "Tour a Ciudad Esmeralda, Cañón del Río La Vieja",
  operator: "Operado por La Vieja Adventures",
  duration: "3-4 horas",
  price: "₡25,000 por persona",
  location: "Sucre de Ciudad Quesada, San Carlos, Alajuela, Costa Rica",
  inclusions: [
    "Entrada a instalaciones.",
    "Guía profesional bilingüe (español e inglés).",
    "Recorrido de 3.5 km entre senderos, río y cañón hacia Cascada El Zafiro.",
    "Equipo de seguridad necesario para el tour.",
  ],
  exclusions: [
    "Transporte hacia y desde el lugar del tour, alimentación y bebidas.",
  ],
  cancellationPolicy:
    "Cancelaciones con al menos 48 horas de anticipación para reembolso completo.",
  details:
    "Entrada a instalaciones, guía profesional (3-4h), recorrido 3.5 km entre senderos, río y cañón hacia Cascada El Zafiro.",
  restrictions: "Solo adultos en buenas condiciones físicas.",
  contact: {
    whatsapp: "6233-2535",
    email: "ciudadesmeraldacr@gmail.com",
    youtube: "https://www.youtube.com/@laviejaadventures",
    facebook: "https://www.facebook.com/laviejaadventures",
    twitter: "https://x.com/adventuresvieja",
    instagram: "https://www.instagram.com/laviejadventures",
  },
  type: "both",
  iconName: "Star",
  titleEs: "Tour Ciudad Esmeralda – Cañón del Río La Vieja",
  titleEn: "Ciudad Esmeralda Tour – La Vieja River Canyon",
  descriptionEs:
    "Una experiencia única en el cañón del Río La Vieja. Caminata por senderos selváticos, baño en pozas naturales y vistas impresionantes del cañón.",
  descriptionEn:
    "A unique experience in the La Vieja River Canyon. Hiking through jungle trails, swimming in natural pools and impressive canyon views.",
  difficulty: "Moderado",
  priceCRC: 25000,
  retailPricePerPax: 25000,
  currency: "CRC",
  minPax: 1,
  maxPax: 20,
  tagEs: "Aventura",
  tagEn: "Adventure",
  accent: "from-teal-900/40 to-teal-950/60",
  border: "border-teal-700/30 hover:border-teal-500/60",
  includes: ["Guía certificado", "Equipo de seguridad", "Seguro de accidentes", "Acceso al área protegida"],
  packages: fallbackPackagesForTour("tour-ciudad-esmeralda"),
  isFeatured: true,
};

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.TOURS);
    const slug = request.nextUrl.searchParams.get("slug")?.trim();

    let tour = slug
      ? await collection.findOne({ slug, isActive: { $ne: false } })
      : await collection.findOne({ isMain: true, isActive: { $ne: false } });

    if (!tour && (!slug || slug === DEFAULT_MAIN_TOUR.slug)) {
      await collection.updateOne(
        { slug: DEFAULT_MAIN_TOUR.slug },
        { $set: DEFAULT_MAIN_TOUR },
        { upsert: true }
      );
      tour = await collection.findOne({ slug: DEFAULT_MAIN_TOUR.slug, isActive: { $ne: false } });
    }

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    return NextResponse.json({
      tour: {
        name: tour.name ?? tour.titleEs ?? "Tour",
        operator: tour.operator ?? "",
        duration: tour.duration ?? "",
        price: tour.price ?? (typeof tour.priceCRC === "number" ? `₡${tour.priceCRC.toLocaleString("es-CR")} por persona` : ""),
        location: tour.location ?? "",
        inclusions: tour.inclusions ?? tour.includes ?? [],
        exclusions: tour.exclusions ?? [],
        cancellationPolicy: tour.cancellationPolicy ?? "",
        details: tour.details ?? tour.descriptionEs ?? "",
        restrictions: tour.restrictions ?? "",
        contact: tour.contact ?? {},
        packages: normalizeTourPackages(tour.packages).length > 0
          ? normalizeTourPackages(tour.packages)
          : fallbackPackagesForTour(tour.slug),
      },
    });
  } catch (err) {
    console.error("GET /api/tours/main error:", err);
    return NextResponse.json({ error: "Failed to fetch main tour" }, { status: 500 });
  }
}
