import type { TourPackageOption } from "@/lib/types/index";

type PackageSchedule = "weekday" | "weekend" | "any";

export const CIUDAD_ESMERALDA_PACKAGES: TourPackageOption[] = [
  {
    id: "essential-package",
    name: "Essential Package",
    nameEs: "Paquete Esencial",
    price: 40,
    priceCRC: 21000,
    descriptionEn: "Complete canyon hike with safety equipment and professional guide",
    descriptionEs: "Caminata completa por el canon con equipo de seguridad y guia profesional",
    includes: [
      "Entrance fee",
      "Bilingual professional guide",
      "Safety equipment (helmet, life vest, harness)",
      "3-4 hour canyoneering experience",
    ],
    groupTour: true,
    departureTimes: ["08:00", "09:00", "10:00"],
    scheduleNote: "All groups are combined in the same departure time",
  },
  {
    id: "lunch-package",
    name: "Lunch Package",
    nameEs: "Paquete con Almuerzo",
    price: 60,
    priceCRC: 31500,
    descriptionEn: "Essential package plus traditional Costa Rican lunch",
    descriptionEs: "Paquete Esencial + almuerzo tipico costarricense",
    includes: [
      "Everything in Essential Package",
      "Typical Costa Rican casado (chicken, beef or vegetarian)",
      "Natural drink and dessert",
    ],
    groupTour: true,
    departureTimes: ["08:00", "09:00", "10:00"],
    scheduleNote: "All groups are combined in the same departure time",
  },
  {
    id: "private-package",
    name: "Private Package",
    nameEs: "Paquete Privado",
    price: 80,
    priceCRC: 42000,
    descriptionEn: "Private canyon adventure with lunch and personalized attention",
    descriptionEs: "Aventura privada por el canon con almuerzo y atencion personalizada",
    includes: [
      "Everything in Lunch Package",
      "Private guide for your group only",
      "Flexible schedule",
      "Professional photos during the tour",
      "Personalized guidance",
    ],
    groupTour: false,
    departureTimes: ["Flexible"],
    scheduleNote: "Flexible departure time - please check availability with the operator",
  },
];

export const BIRDWATCHING_PACKAGES: TourPackageOption[] = [
  {
    id: "essential-package",
    name: "Essential Package",
    nameEs: "Paquete Esencial",
    price: 45,
    priceCRC: 24990,
    descriptionEn: "Guided birdwatching tour with an expert naturalist",
    descriptionEs: "Tour guiado de avistamiento de aves con naturalista experto",
    includes: ["Naturalist guide", "Shared binoculars", "Observed species checklist"],
    groupTour: true,
    departureTimes: ["05:30", "06:00"],
    scheduleNote: "Early departures are recommended for best bird activity",
  },
  {
    id: "birder-plus-package",
    name: "Birder Plus Package",
    nameEs: "Paquete Avistador Plus",
    price: 65,
    priceCRC: 34990,
    descriptionEn: "Essential package plus breakfast and photography guidance",
    descriptionEs: "Paquete Esencial + desayuno y guia de fotografia",
    includes: ["Everything in Essential Package", "Breakfast", "Photography guidance"],
    groupTour: true,
    departureTimes: ["05:30", "06:00"],
    scheduleNote: "Early departures are recommended for best bird activity",
  },
  {
    id: "private-birdwatching-package",
    name: "Private Birdwatching Package",
    nameEs: "Paquete Avistamiento Privado",
    price: 92,
    priceCRC: 49990,
    descriptionEn: "Private birdwatching tour with photos and a personalized focus",
    descriptionEs: "Tour privado exclusivo con fotos profesionales y enfoque personalizado",
    includes: ["Private guide", "Flexible focus by species or photography", "Professional photos"],
    groupTour: false,
    departureTimes: ["Flexible"],
    scheduleNote: "Flexible departure time - please check availability with the operator",
  },
];

// ─────────────────────────────────────────────────────────────────────────
//  Standard 3-tier package builder (Essential / Plus / Private) so every tour
//  offers bookable packages, matching the shape of the curated sets above.
// ─────────────────────────────────────────────────────────────────────────

interface TourPackageSeed {
  essential: { price: number; priceCRC: number; descriptionEn: string; descriptionEs: string; includes: string[] };
  plus: { id: string; name: string; nameEs: string; price: number; priceCRC: number; descriptionEn: string; descriptionEs: string; includes: string[] };
  privatePkg: { price: number; priceCRC: number; descriptionEn: string; descriptionEs: string; includes: string[] };
  departureTimes: string[];
  privateDepartureTimes?: string[];
  scheduleNote: string;
}

function expandSeed(seed: TourPackageSeed): TourPackageOption[] {
  return [
    {
      id: "essential-package",
      name: "Essential Package",
      nameEs: "Paquete Esencial",
      price: seed.essential.price,
      priceCRC: seed.essential.priceCRC,
      descriptionEn: seed.essential.descriptionEn,
      descriptionEs: seed.essential.descriptionEs,
      includes: seed.essential.includes,
      groupTour: true,
      departureTimes: seed.departureTimes,
      scheduleNote: seed.scheduleNote,
    },
    {
      id: seed.plus.id,
      name: seed.plus.name,
      nameEs: seed.plus.nameEs,
      price: seed.plus.price,
      priceCRC: seed.plus.priceCRC,
      descriptionEn: seed.plus.descriptionEn,
      descriptionEs: seed.plus.descriptionEs,
      includes: seed.plus.includes,
      groupTour: true,
      departureTimes: seed.departureTimes,
      scheduleNote: seed.scheduleNote,
    },
    {
      id: "private-package",
      name: "Private Package",
      nameEs: "Paquete Privado",
      price: seed.privatePkg.price,
      priceCRC: seed.privatePkg.priceCRC,
      descriptionEn: seed.privatePkg.descriptionEn,
      descriptionEs: seed.privatePkg.descriptionEs,
      includes: seed.privatePkg.includes,
      groupTour: false,
      departureTimes: seed.privateDepartureTimes ?? ["Flexible"],
      scheduleNote: "Flexible departure time - please check availability with the operator",
    },
  ];
}

export const CUADRA_TOURS_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 38, priceCRC: 19990,
    descriptionEn: "Guided ATV ride through exclusive northern-zone trails",
    descriptionEs: "Recorrido guiado en cuadra por senderos exclusivos de la zona norte",
    includes: ["Local guide", "Single ATV rental", "Safety equipment (helmet)", "1.5-2 hour trail ride"],
  },
  plus: {
    id: "adventure-plus-package",
    name: "Adventure Plus Package", nameEs: "Paquete Aventura Plus",
    price: 53, priceCRC: 27990,
    descriptionEn: "Extended route with scenic viewpoints, refreshment and photo stops",
    descriptionEs: "Ruta extendida con miradores escenicos, refrigerio y paradas fotograficas",
    includes: ["Everything in Essential Package", "Extended trail route", "Refreshment stop", "Scenic viewpoint photos"],
  },
  privatePkg: {
    price: 76, priceCRC: 39990,
    descriptionEn: "Private ATV adventure with a dedicated guide and flexible pace",
    descriptionEs: "Aventura privada en cuadra con guia dedicado y ritmo flexible",
    includes: ["Everything in Adventure Plus Package", "Private guide for your group only", "Flexible route and pace", "Professional photos"],
  },
  departureTimes: ["08:00", "09:00", "10:00", "14:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const CASCADAS_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 38, priceCRC: 19990,
    descriptionEn: "Guided hike to hidden waterfalls of the La Vieja River",
    descriptionEs: "Caminata guiada hacia cascadas escondidas del Rio La Vieja",
    includes: ["Local guide", "Trail access", "Photo stops", "2-3 hour hiking experience"],
  },
  plus: {
    id: "explorer-package",
    name: "Explorer Package", nameEs: "Paquete Explorador",
    price: 57, priceCRC: 29990,
    descriptionEn: "Waterfall hike plus a riverside picnic and photography guidance",
    descriptionEs: "Caminata a cascadas + picnic junto al rio y guia de fotografia",
    includes: ["Everything in Essential Package", "Riverside picnic snack", "Photography guidance", "Extra viewpoints"],
  },
  privatePkg: {
    price: 76, priceCRC: 39990,
    descriptionEn: "Private waterfall adventure with photos and a personalized focus",
    descriptionEs: "Aventura privada a las cascadas con fotos y enfoque personalizado",
    includes: ["Everything in Explorer Package", "Private guide for your group only", "Flexible schedule", "Professional photos"],
  },
  departureTimes: ["07:00", "08:00", "09:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const GASTRONOMICO_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 48, priceCRC: 24990,
    descriptionEn: "Guided tasting of traditional dishes prepared by local cooks",
    descriptionEs: "Degustacion guiada de platillos tradicionales preparados por cocineros locales",
    includes: ["Local host", "Traditional dish tasting", "Natural drink", "Cultural experience"],
  },
  plus: {
    id: "full-tasting-package",
    name: "Full Tasting Package", nameEs: "Paquete Degustacion Completa",
    price: 65, priceCRC: 33990,
    descriptionEn: "Complete tasting menu with dessert and drink pairing",
    descriptionEs: "Menu de degustacion completo con postre y maridaje de bebidas",
    includes: ["Everything in Essential Package", "Full tasting menu", "Traditional dessert", "Drink pairing"],
  },
  privatePkg: {
    price: 86, priceCRC: 44990,
    descriptionEn: "Private culinary experience with a dedicated host and menu",
    descriptionEs: "Experiencia culinaria privada con anfitrion y menu dedicados",
    includes: ["Everything in Full Tasting Package", "Private host for your group only", "Personalized menu", "Flexible schedule"],
  },
  departureTimes: ["11:00", "12:00", "17:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const LLUVIA_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 38, priceCRC: 19990,
    descriptionEn: "Sensory forest walk in the rain with special gear",
    descriptionEs: "Caminata sensorial por el bosque bajo la lluvia con equipo especial",
    includes: ["Local guide", "Special rain gear", "Sensory route", "1 hour experience"],
  },
  plus: {
    id: "sensory-plus-package",
    name: "Sensory Plus Package", nameEs: "Paquete Sensorial Plus",
    price: 53, priceCRC: 27990,
    descriptionEn: "Rain walk plus a warm drink and guided photography",
    descriptionEs: "Caminata bajo la lluvia + bebida caliente y fotografia guiada",
    includes: ["Everything in Essential Package", "Hot natural drink", "Photography guidance", "Extended sensory route"],
  },
  privatePkg: {
    price: 72, priceCRC: 37990,
    descriptionEn: "Private rain experience with a dedicated guide and photos",
    descriptionEs: "Experiencia privada bajo la lluvia con guia dedicado y fotos",
    includes: ["Everything in Sensory Plus Package", "Private guide for your group only", "Flexible schedule", "Professional photos"],
  },
  departureTimes: ["09:00", "10:00", "14:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const NOCTURNO_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 44, priceCRC: 22990,
    descriptionEn: "Guided night walk to discover the forest's nightlife",
    descriptionEs: "Caminata nocturna guiada para descubrir la vida nocturna del bosque",
    includes: ["Local guide", "Night route", "Safety briefing", "1.5 hour experience"],
  },
  plus: {
    id: "night-explorer-package",
    name: "Night Explorer Package", nameEs: "Paquete Explorador Nocturno",
    price: 61, priceCRC: 31990,
    descriptionEn: "Night tour plus wildlife photography guidance and a snack",
    descriptionEs: "Tour nocturno + guia de fotografia de fauna y un refrigerio",
    includes: ["Everything in Essential Package", "Night photography guidance", "Snack and hot drink", "Extra observation points"],
  },
  privatePkg: {
    price: 82, priceCRC: 42990,
    descriptionEn: "Private night adventure with a dedicated guide and photos",
    descriptionEs: "Aventura nocturna privada con guia dedicado y fotos",
    includes: ["Everything in Night Explorer Package", "Private guide for your group only", "Flexible schedule", "Professional night photos"],
  },
  departureTimes: ["18:00", "19:00", "20:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const RAPEL_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 57, priceCRC: 29990,
    descriptionEn: "Controlled canyon rappel with certified guides and pro equipment",
    descriptionEs: "Descenso controlado en el canon con guias certificados y equipo profesional",
    includes: ["Certified guide", "Professional rappelling equipment", "Safety briefing", "2 hour experience"],
  },
  plus: {
    id: "extreme-package",
    name: "Extreme Package", nameEs: "Paquete Extremo",
    price: 76, priceCRC: 39990,
    descriptionEn: "Extended multi-drop descent with action photos",
    descriptionEs: "Descenso extendido de varias secciones con fotos de accion",
    includes: ["Everything in Essential Package", "Extended multi-drop route", "Action photos", "Extra canyon sections"],
  },
  privatePkg: {
    price: 101, priceCRC: 52990,
    descriptionEn: "Private canyon rappel with a dedicated certified guide",
    descriptionEs: "Rapel privado en el canon con guia certificado dedicado",
    includes: ["Everything in Extreme Package", "Private certified guide for your group only", "Flexible schedule", "Professional photos"],
  },
  departureTimes: ["08:00", "09:00", "10:00"],
  scheduleNote: "All groups are combined in the same departure time",
});

export const VOLCANES_PACKAGES: TourPackageOption[] = expandSeed({
  essential: {
    price: 67, priceCRC: 34990,
    descriptionEn: "Guided hike to ancient craters of Juan Castro Blanco park",
    descriptionEs: "Caminata guiada a crateres antiguos del parque Juan Castro Blanco",
    includes: ["Local guide", "Route to ancient craters", "Natural viewpoints", "3-4 hour hiking experience"],
  },
  plus: {
    id: "summit-package",
    name: "Summit Package", nameEs: "Paquete Cumbre",
    price: 86, priceCRC: 44990,
    descriptionEn: "Full-summit hike with a traditional lunch and photography",
    descriptionEs: "Caminata a la cumbre completa con almuerzo tipico y fotografia",
    includes: ["Everything in Essential Package", "Typical Costa Rican lunch", "Full summit route", "Photography guidance"],
  },
  privatePkg: {
    price: 110, priceCRC: 57990,
    descriptionEn: "Private volcano hike with lunch, photos and a dedicated guide",
    descriptionEs: "Caminata privada al volcan con almuerzo, fotos y guia dedicado",
    includes: ["Everything in Summit Package", "Private guide for your group only", "Flexible schedule", "Professional photos"],
  },
  departureTimes: ["06:00", "07:00", "08:00"],
  scheduleNote: "Early departures are recommended before midday clouds",
});

// Generic 3-tier packages derived from a tour's base price — the last-resort
// fallback so that ANY tour (even a brand-new one) always has bookable packages.
export function buildStandardPackagesFromPrice(
  priceCRC?: number | null,
  departureTimes: string[] = ["08:00", "09:00", "10:00"],
): TourPackageOption[] {
  const base = Number.isFinite(Number(priceCRC)) && Number(priceCRC) > 0 ? Number(priceCRC) : 19990;
  const plusCRC = Math.round((base * 1.4) / 10) * 10;
  const privateCRC = Math.round((base * 1.85) / 10) * 10;
  const usd = (crc: number) => Math.round(crc / 525);
  const groupNote = "All groups are combined in the same departure time";

  return [
    {
      id: "essential-package",
      name: "Essential Package",
      nameEs: "Paquete Esencial",
      price: usd(base),
      priceCRC: base,
      descriptionEn: "Guided group experience with a local guide and essential equipment",
      descriptionEs: "Experiencia guiada en grupo con guia local y equipo esencial",
      includes: ["Local guide", "Essential equipment", "Group experience"],
      groupTour: true,
      departureTimes,
      scheduleNote: groupNote,
    },
    {
      id: "plus-package",
      name: "Plus Package",
      nameEs: "Paquete Plus",
      price: usd(plusCRC),
      priceCRC: plusCRC,
      descriptionEn: "Essential experience plus a refreshment and photography guidance",
      descriptionEs: "Experiencia esencial + refrigerio y guia de fotografia",
      includes: ["Everything in Essential Package", "Refreshment", "Photography guidance"],
      groupTour: true,
      departureTimes,
      scheduleNote: groupNote,
    },
    {
      id: "private-package",
      name: "Private Package",
      nameEs: "Paquete Privado",
      price: usd(privateCRC),
      priceCRC: privateCRC,
      descriptionEn: "Private experience with a dedicated guide and a flexible schedule",
      descriptionEs: "Experiencia privada con guia dedicado y horario flexible",
      includes: ["Everything in Plus Package", "Private guide for your group only", "Flexible schedule", "Professional photos"],
      groupTour: false,
      departureTimes: ["Flexible"],
      scheduleNote: "Flexible departure time - please check availability with the operator",
    },
  ];
}

const PACKAGES_BY_SLUG: Record<string, TourPackageOption[]> = {
  "tour-ciudad-esmeralda": CIUDAD_ESMERALDA_PACKAGES,
  "ciudad-esmeralda": CIUDAD_ESMERALDA_PACKAGES,
  "avistamiento-aves-norteno": BIRDWATCHING_PACKAGES,
  "avistamiento-aves": BIRDWATCHING_PACKAGES,
  "cuadra-tours-aventura": CUADRA_TOURS_PACKAGES,
  "cascadas-secretas-rio-la-vieja": CASCADAS_PACKAGES,
  "tour-gastronomico-local": GASTRONOMICO_PACKAGES,
  "lluvia-en-la-naturaleza": LLUVIA_PACKAGES,
  "tour-nocturno-la-vieja": NOCTURNO_PACKAGES,
  "rapel-canon-del-rio": RAPEL_PACKAGES,
  "caminata-volcanes-dormidos": VOLCANES_PACKAGES,
};

export function fallbackPackagesForTour(slug?: string | null): TourPackageOption[] {
  if (!slug) return [];
  return PACKAGES_BY_SLUG[slug] ?? [];
}

export function normalizeTourPackages(value: unknown): TourPackageOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((pkg): pkg is Record<string, unknown> => Boolean(pkg) && typeof pkg === "object")
    .map((pkg, index) => {
      const name = String(pkg.name ?? "").trim();
      const nameEs = String(pkg.nameEs ?? "").trim();
      const id = String(pkg.id ?? (nameEs || name || `package-${index + 1}`))
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      return {
        id: id || `package-${index + 1}`,
        name,
        nameEs: nameEs || undefined,
        price: Number(pkg.price ?? 0),
        priceCRC: pkg.priceCRC == null ? null : Number(pkg.priceCRC),
        descriptionEn: String(pkg.descriptionEn ?? "").trim() || undefined,
        descriptionEs: String(pkg.descriptionEs ?? "").trim() || undefined,
        includes: Array.isArray(pkg.includes) ? pkg.includes.map((item) => String(item)) : [],
        groupTour: pkg.groupTour === false ? false : true,
        departureTimes: Array.isArray(pkg.departureTimes)
          ? pkg.departureTimes.map((time) => String(time).trim()).filter(Boolean)
          : [],
        scheduleNote: String(pkg.scheduleNote ?? "").trim() || undefined,
      };
    })
    .filter((pkg) => pkg.name && Number.isFinite(pkg.price));
}

export function getPackageSchedule(_pkg: Pick<TourPackageOption, "id" | "name" | "nameEs" | "groupTour"> | null | undefined): PackageSchedule {
  // Package availability is confirmed separately by the operator/calendar.
  // Do not block a date based on the package label or group/private status.
  return "any";
}

export function isWeekendIsoDate(dateIso: string): boolean | null {
  const match = dateIso.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const dayOfMonth = Number(dayRaw);
  const localDate = new Date(year, month - 1, dayOfMonth);

  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== dayOfMonth
  ) {
    return null;
  }

  const day = localDate.getDay();

  return day === 0 || day === 6;
}

export function isPackageAvailableOnDate(
  pkg: Pick<TourPackageOption, "id" | "name" | "nameEs" | "groupTour"> | null | undefined,
  dateIso: string
): boolean {
  const schedule = getPackageSchedule(pkg);
  const isWeekend = isWeekendIsoDate(dateIso);

  if (schedule === "any" || isWeekend === null) return true;
  if (schedule === "weekend") return isWeekend;

  return !isWeekend;
}
