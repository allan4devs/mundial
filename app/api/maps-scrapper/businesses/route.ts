import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// Email enrichment (site scrape + public linked pages) can run long for many leads.
export const runtime = "nodejs";
export const maxDuration = 60;

const LEAD_LIMIT = 10;
const LEADS_COLLECTION = "maps_scrapper_leads";

type NearbyPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  types?: string[];
};

type WebsiteEvaluation = {
  url: string;
  reachable: boolean;
  needsModernization: boolean;
  score: number;
  verdict: string;
  reasons: string[];
};

type ContactIntel = {
  emails: string[];
  emailSources: Record<string, string[]>;
  scannedUrls: string[];
  externalProfiles: string[];
  notes: string[];
};

type NearbyResponse = {
  places?: NearbyPlace[];
  error?: {
    message?: string;
    status?: string;
  };
};

const ALL_BUSINESS_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "store",
  "beauty_salon",
  "gym",
  "car_repair",
  "lodging",
  "dentist",
  "doctor",
  "hair_care",
  "clothing_store",
  "electronics_store",
  "furniture_store",
  "hardware_store",
  "home_goods_store",
  "pharmacy",
  "real_estate_agency",
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.types",
].join(",");

const EMAIL_PATTERN =
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9-]+\.)+[a-z]{2,}/gi;

const PUBLIC_PROFILE_HOSTS = [
  "facebook.com",
  "instagram.com",
  "airbnb.com",
  "booking.com",
  "tripadvisor.",
  "wixsite.com",
  "linktr.ee",
  "wa.me",
  "whatsapp.com",
  "yelp.",
  "foursquare.com",
];

const INTERNAL_CONTACT_HINTS = [
  "contact",
  "contacto",
  "about",
  "acerca",
  "nosotros",
  "reserv",
  "booking",
  "airbnb",
  "facebook",
  "instagram",
];

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getApiKey() {
  return process.env.MAPS_KEY?.trim();
}

function hasPattern(html: string, pattern: RegExp) {
  return pattern.test(html);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&commat;/gi, "@")
    .replace(/&period;/gi, ".")
    .replace(/&amp;/gi, "&");
}

function normalizeEmail(email: string) {
  return decodeHtmlEntities(email)
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/[),.;:'"\]}>]+$/g, "")
    .toLowerCase();
}

function extractEmails(text: string) {
  const decoded = decodeHtmlEntities(text)
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".");

  return Array.from(decoded.matchAll(EMAIL_PATTERN))
    .map((match) => normalizeEmail(match[0]))
    .filter((email) => !email.endsWith(".png") && !email.endsWith(".jpg"))
    .filter((email, index, emails) => emails.indexOf(email) === index);
}

function isHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isPublicProfileUrl(url: string) {
  const hostname = getHostname(url);
  return PUBLIC_PROFILE_HOSTS.some((host) => hostname.includes(host));
}

function getLinks(html: string, baseUrl: string) {
  const links = new Set<string>();

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const rawHref = decodeHtmlEntities(match[1]);

    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
      continue;
    }

    try {
      const absoluteUrl = new URL(rawHref, baseUrl);
      absoluteUrl.hash = "";

      if (["http:", "https:"].includes(absoluteUrl.protocol)) {
        links.add(absoluteUrl.toString());
      }
    } catch {
      continue;
    }
  }

  return [...links];
}

function pickFollowUpLinks(links: string[], baseUrl: string) {
  const baseHost = getHostname(baseUrl);
  const internal: string[] = [];
  const externalProfiles: string[] = [];

  links.forEach((link) => {
    const hostname = getHostname(link);
    const lowerLink = link.toLowerCase();

    if (hostname === baseHost) {
      if (INTERNAL_CONTACT_HINTS.some((hint) => lowerLink.includes(hint))) {
        internal.push(link);
      }
      return;
    }

    if (isPublicProfileUrl(link)) {
      externalProfiles.push(link);
    }
  });

  return {
    followUpUrls: [...new Set([...internal.slice(0, 5), ...externalProfiles.slice(0, 5)])],
    externalProfiles: [...new Set(externalProfiles)].slice(0, 10),
  };
}

async function fetchPublicHtml(url: string) {
  if (!isHttpUrl(url)) {
    throw new Error("URL no soportada");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LaViejaAdventuresLeadAudit/1.0; +https://www.laviejaadventures.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const html = contentType.includes("text/html")
    ? (await response.text()).slice(0, 350_000)
    : "";

  return { response, html };
}

async function discoverPublicContacts(url: string): Promise<ContactIntel> {
  const emails = new Set<string>();
  const emailSources = new Map<string, Set<string>>();
  const scannedUrls = new Set<string>();
  const externalProfiles = new Set<string>();
  const notes = new Set<string>();

  const addEmail = (email: string, sourceUrl: string) => {
    emails.add(email);
    const sources = emailSources.get(email) ?? new Set<string>();
    sources.add(sourceUrl);
    emailSources.set(email, sources);
  };

  const queue = [url];
  const maxScans = 8;

  while (queue.length > 0 && scannedUrls.size < maxScans) {
    const currentUrl = queue.shift();

    if (!currentUrl || scannedUrls.has(currentUrl) || !isHttpUrl(currentUrl)) {
      continue;
    }

    try {
      const { response, html } = await fetchPublicHtml(currentUrl);
      scannedUrls.add(response.url || currentUrl);

      if (!html) {
        notes.add(`Sin HTML publico en ${getHostname(currentUrl) || currentUrl}.`);
        continue;
      }

      extractEmails(html).forEach((email) => addEmail(email, response.url || currentUrl));

      const links = getLinks(html, response.url || currentUrl);
      const pickedLinks = pickFollowUpLinks(links, response.url || currentUrl);
      pickedLinks.externalProfiles.forEach((profileUrl) => externalProfiles.add(profileUrl));
      pickedLinks.followUpUrls.forEach((link) => {
        if (!scannedUrls.has(link) && queue.length + scannedUrls.size < maxScans) {
          queue.push(link);
        }
      });
    } catch (error) {
      scannedUrls.add(currentUrl);
      notes.add(
        error instanceof Error
          ? `No se pudo revisar ${getHostname(currentUrl) || currentUrl}: ${error.message}.`
          : `No se pudo revisar ${getHostname(currentUrl) || currentUrl}.`,
      );
    }
  }

  if ([...externalProfiles].some((profileUrl) => /airbnb|booking/i.test(profileUrl))) {
    notes.add("Airbnb/Booking suelen ocultar emails publicos; se registran enlaces encontrados.");
  }

  return {
    emails: [...emails],
    emailSources: Object.fromEntries(
      [...emailSources.entries()].map(([email, sources]) => [email, [...sources]]),
    ),
    scannedUrls: [...scannedUrls],
    externalProfiles: [...externalProfiles],
    notes: [...notes],
  };
}

async function evaluateWebsite(url: string): Promise<WebsiteEvaluation> {
  const reasons: string[] = [];
  let score = 100;

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL no soportada");
    }

    if (parsedUrl.protocol !== "https:") {
      score -= 18;
      reasons.push("No usa HTTPS.");
    }

    const { response, html: fetchedHtml } = await fetchPublicHtml(parsedUrl.toString());
    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      score -= 35;
      reasons.push(`Responde con HTTP ${response.status}.`);
    }

    if (!contentType.includes("text/html")) {
      score -= 15;
      reasons.push("No parece servir HTML de pagina web.");
    }

    const html = fetchedHtml;
    const lowerHtml = html.toLowerCase();

    if (!hasPattern(lowerHtml, /<meta[^>]+name=["']viewport["']/i)) {
      score -= 18;
      reasons.push("No declara viewport responsive.");
    }

    if (!hasPattern(lowerHtml, /<title[^>]*>[^<]{8,}<\/title>/i)) {
      score -= 10;
      reasons.push("Titulo SEO ausente o muy pobre.");
    }

    if (!hasPattern(lowerHtml, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i)) {
      score -= 12;
      reasons.push("Meta description ausente o debil.");
    }

    if (hasPattern(lowerHtml, /jquery-1\.|jquery-2\.|bootstrap\.min\.css\?ver=3|generator["'][^>]+wordpress\s[1-4]\./i)) {
      score -= 14;
      reasons.push("Detecta tecnologia o librerias antiguas.");
    }

    if (!hasPattern(lowerHtml, /schema\.org|application\/ld\+json/i)) {
      score -= 8;
      reasons.push("Sin datos estructurados visibles.");
    }

    if (!hasPattern(lowerHtml, /wa\.me|whatsapp|tel:|mailto:/i)) {
      score -= 8;
      reasons.push("Llamadas de contacto rapidas no visibles.");
    }

    if (html.length < 3500) {
      score -= 10;
      reasons.push("Contenido muy limitado.");
    }

    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      url: response.url || parsedUrl.toString(),
      reachable: response.ok,
      needsModernization: normalizedScore < 72,
      score: normalizedScore,
      verdict:
        normalizedScore < 55
          ? "Necesita modernizacion alta"
          : normalizedScore < 72
            ? "Conviene modernizar"
            : "Se ve razonablemente moderno",
      reasons:
        reasons.length > 0
          ? reasons
          : ["No se detectaron problemas fuertes en una revision automatica."],
    };
  } catch (error) {
    return {
      url,
      reachable: false,
      needsModernization: true,
      score: 20,
      verdict: "Sitio no auditable o caido",
      reasons: [
        error instanceof Error
          ? `No se pudo cargar el sitio: ${error.message}.`
          : "No se pudo cargar el sitio.",
      ],
    };
  }
}

async function evaluateWebsitesInBatches<T extends { websiteUri: string }>(
  items: T[],
) {
  const evaluations = new Map<string, WebsiteEvaluation>();
  const batchSize = 4;

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => [item.websiteUri, await evaluateWebsite(item.websiteUri)] as const),
    );

    results.forEach(([url, evaluation]) => evaluations.set(url, evaluation));
  }

  return evaluations;
}

async function discoverContactsInBatches<T extends { websiteUri: string }>(
  items: T[],
) {
  const contacts = new Map<string, ContactIntel>();
  const batchSize = 3;

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(
        async (item) =>
          [item.websiteUri, await discoverPublicContacts(item.websiteUri)] as const,
      ),
    );

    results.forEach(([url, contactIntel]) => contacts.set(url, contactIntel));
  }

  return contacts;
}

// ---- AI web-search fallback (the last step to get the email) --------------

const EMAIL_SEARCH_SYSTEM = `Sos un investigador de contactos B2B para una agencia de sitios web en Costa Rica.

Te doy un negocio local. Usá la herramienta de búsqueda web para encontrar su correo electrónico PÚBLICO de contacto (página oficial, Facebook/Instagram "Información", directorios como PáginasAmarillas, etc.).

Reglas:
- Buscá el correo real del negocio; NO inventes ninguno. Si dudás, no lo incluyas.
- Ignorá correos genéricos de plataformas (noreply@, correos de Wix/Facebook, ejemplos).
- Podés devolver perfiles públicos (Facebook/Instagram/WhatsApp) que hayas confirmado.

Devolvé ÚNICAMENTE un objeto JSON con esta forma exacta, sin texto adicional ni bloques de código:
{"emails": ["correo@dominio.com"], "profiles": ["https://..."], "sources": ["https://fuente..."], "note": "de dónde salió o por qué no se encontró"}`;

function buildEmailSearchPrompt(business: {
  name: string;
  address: string;
  phone: string;
  websiteUri: string;
  types: string[];
}) {
  const lines = [`Negocio: ${business.name}`];
  if (business.address) lines.push(`Dirección: ${business.address}`);
  if (business.phone) lines.push(`Teléfono: ${business.phone}`);
  if (business.websiteUri) lines.push(`Sitio web: ${business.websiteUri}`);
  if (business.types.length) lines.push(`Rubro: ${business.types.slice(0, 3).join(", ")}`);
  lines.push("");
  lines.push("Encontrá su correo de contacto público.");
  return lines.join("\n");
}

function isValidPublicEmail(candidate: string) {
  const email = normalizeEmail(candidate);
  if (email.length < 6 || email.length > 96) return false;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return false;
  if (/(example\.(com|org)|noreply|no-reply|@sentry|wixpress|@facebook|@instagram)/i.test(email)) {
    return false;
  }
  return true;
}

function parseEmailSearchJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      emails?: unknown;
      profiles?: unknown;
      sources?: unknown;
      note?: unknown;
    };
    const toStrings = (value: unknown) =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

    return {
      emails: toStrings(parsed.emails),
      profiles: toStrings(parsed.profiles),
      sources: toStrings(parsed.sources),
      note: typeof parsed.note === "string" ? parsed.note : "",
    };
  } catch {
    return null;
  }
}

async function findEmailViaWebSearch(business: {
  name: string;
  address: string;
  phone: string;
  websiteUri: string;
  types: string[];
}): Promise<ContactIntel | null> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;

  try {
    const response = await Promise.resolve({
      content: [] as Array<{ type: string; text?: string }>,
      model: "disabled",
      max_tokens: 700,
      system: EMAIL_SEARCH_SYSTEM,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
          user_location: {
            type: "approximate",
            country: "CR",
            timezone: "America/Costa_Rica",
          },
        },
      ],
      messages: [{ role: "user", content: buildEmailSearchPrompt(business) }],
    });

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    const parsed = parseEmailSearchJson(text);
    if (!parsed) return null;

    const emails = [
      ...new Set(parsed.emails.map(normalizeEmail).filter(isValidPublicEmail)),
    ];
    const externalProfiles = [
      ...new Set(parsed.profiles.filter((url) => isHttpUrl(url) && isPublicProfileUrl(url))),
    ];
    const sources = parsed.sources.filter((url) => isHttpUrl(url));

    if (emails.length === 0 && externalProfiles.length === 0) return null;

    const emailSources: Record<string, string[]> = {};
    for (const email of emails) emailSources[email] = sources;

    return {
      emails,
      emailSources,
      scannedUrls: sources,
      externalProfiles,
      notes: [
        emails.length > 0
          ? `Correo hallado con búsqueda web IA${parsed.note ? `: ${parsed.note}` : "."}`
          : `IA sin correo${parsed.note ? `: ${parsed.note}` : "."}`,
      ],
    };
  } catch (error) {
    void error;
    return null;
  }
}

function mergeContactIntel(base: ContactIntel | null, extra: ContactIntel): ContactIntel {
  if (!base) return extra;
  return {
    emails: [...new Set([...base.emails, ...extra.emails])],
    emailSources: { ...base.emailSources, ...extra.emailSources },
    scannedUrls: [...new Set([...base.scannedUrls, ...extra.scannedUrls])],
    externalProfiles: [...new Set([...base.externalProfiles, ...extra.externalProfiles])],
    notes: [...base.notes, ...extra.notes],
  };
}

async function searchNearby({
  apiKey,
  lat,
  lng,
  radius,
  type,
}: {
  apiKey: string;
  lat: number;
  lng: number;
  radius: number;
  type: string;
}) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius,
        },
      },
    }),
  });

  const payload = (await response.json()) as NearbyResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `Places API fallo para ${type}`);
  }

  return payload.places ?? [];
}

async function getLeadCollection() {
  const db = await getDb();
  const collection = db.collection(LEADS_COLLECTION);
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ createdAt: -1 });
  return collection;
}

async function getExistingLeadIds(ids: string[]) {
  if (ids.length === 0) return new Set<string>();

  const collection = await getLeadCollection();
  const existing = await collection
    .find({ id: { $in: ids } })
    .project<{ id: string }>({ id: 1 })
    .toArray();

  return new Set(existing.map((lead) => lead.id));
}

async function saveLeads(
  businesses: Array<Record<string, unknown> & { id: string }>,
  searchMeta: Record<string, unknown>,
) {
  if (businesses.length === 0) return 0;

  const collection = await getLeadCollection();
  const now = new Date();
  const result = await collection.bulkWrite(
    businesses.map((business) => ({
      updateOne: {
        filter: { id: business.id },
        update: {
          $set: {
            ...business,
            searchMeta,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return result.upsertedCount + result.modifiedCount;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      Math.max(asNumber(limitParam || undefined, 200), 1),
      500,
    );

    const collection = await getLeadCollection();
    const savedLeads = await collection
      .find({})
      .project<Record<string, unknown>>({ _id: 0, searchMeta: 0 })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      businesses: savedLeads,
      savedTotal: await collection.countDocuments({}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los leads guardados.",
        businesses: [],
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Falta el id del negocio." }, { status: 400 });
    }

    const hasEmailedPatch = Object.prototype.hasOwnProperty.call(body ?? {}, "emailed");
    const hasNoImprovementPatch = Object.prototype.hasOwnProperty.call(body ?? {}, "noImprovementNeeded");
    const emailed = Boolean(body?.emailed);
    const noImprovementNeeded = Boolean(body?.noImprovementNeeded);
    const emailedTo =
      typeof body?.emailedTo === "string" ? body.emailedTo.trim().toLowerCase() : "";

    const collection = await getLeadCollection();
    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now };

    if (hasEmailedPatch) {
      Object.assign(
        $set,
        emailed
          ? { emailedAt: now, emailedTo }
          : { emailedAt: null, emailedTo: "" },
      );
    }

    if (hasNoImprovementPatch) {
      Object.assign(
        $set,
        noImprovementNeeded
          ? { noImprovementNeededAt: now }
          : { noImprovementNeededAt: null },
      );
    }

    const result = await collection.updateOne({ id }, { $set });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Ese negocio no está guardado en MongoDB." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      emailed,
      emailedAt: hasEmailedPatch ? (emailed ? now.toISOString() : null) : undefined,
      emailedTo: emailed ? emailedTo : "",
      noImprovementNeeded,
      noImprovementNeededAt: hasNoImprovementPatch
        ? noImprovementNeeded
          ? now.toISOString()
          : null
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo actualizar el estado.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return NextResponse.json({ error: "Falta MAPS_KEY en .env." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const lat = asNumber(body?.location?.lat, Number.NaN);
    const lng = asNumber(body?.location?.lng, Number.NaN);
    const radius = Math.min(Math.max(asNumber(body?.radius, 1500), 100), 5000);
    const category = String(body?.category || "all");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Seleccione un punto valido en el mapa." },
        { status: 400 },
      );
    }

    const searchedTypes =
      category === "all" ? ALL_BUSINESS_TYPES : [category.replace(/[^a-z_]/g, "")];
    const placesByKey = new Map<string, NearbyPlace>();
    const skippedTypes: { type: string; error: string }[] = [];

    await Promise.all(
      searchedTypes.map(async (type) => {
        try {
          const places = await searchNearby({ apiKey, lat, lng, radius, type });

          places.forEach((place) => {
            const latKey = place.location?.latitude?.toFixed(6) ?? "";
            const lngKey = place.location?.longitude?.toFixed(6) ?? "";
            const dedupeKey = [
              place.displayName?.text ?? "",
              place.formattedAddress ?? "",
              latKey,
              lngKey,
            ].join("|");

            if (place.id || dedupeKey.trim() !== "|||") {
              placesByKey.set(place.id ?? dedupeKey, place);
            }
          });
        } catch (error) {
          skippedTypes.push({
            type,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }),
    );

    const baseBusinesses = Array.from(placesByKey.entries())
      .map(([id, place]) => ({
        id,
        name: place.displayName?.text ?? "Negocio sin nombre",
        address: place.formattedAddress ?? "",
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? "",
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
        businessStatus: place.businessStatus ?? "UNKNOWN",
        googleMapsUri: place.googleMapsUri ?? "",
        websiteUri: place.websiteUri ?? "",
        hasWebsite: Boolean(place.websiteUri),
        websiteEvaluation: null as WebsiteEvaluation | null,
        contactIntel: null as ContactIntel | null,
        types: place.types ?? [],
        location:
          typeof place.location?.latitude === "number" &&
          typeof place.location?.longitude === "number"
            ? {
                lat: place.location.latitude,
                lng: place.location.longitude,
              }
            : null,
      }))
      .sort((a, b) => {
        if (a.websiteUri && !b.websiteUri) return 1;
        if (!a.websiteUri && b.websiteUri) return -1;
        return (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0);
      });

    const existingLeadIds = await getExistingLeadIds(
      baseBusinesses.map((business) => business.id),
    );
    const selectedBaseBusinesses = baseBusinesses
      .filter((business) => !existingLeadIds.has(business.id))
      .slice(0, LEAD_LIMIT);

    const businessesWithWebsite = selectedBaseBusinesses.filter((business) => business.websiteUri);
    const [websiteEvaluations, contactIntelByUrl] = await Promise.all([
      evaluateWebsitesInBatches(businessesWithWebsite),
      discoverContactsInBatches(businessesWithWebsite),
    ]);
    const businesses = selectedBaseBusinesses.map((business) => ({
      ...business,
      websiteEvaluation: business.websiteUri
        ? websiteEvaluations.get(business.websiteUri) ?? null
        : null,
      contactIntel: business.websiteUri
        ? contactIntelByUrl.get(business.websiteUri) ?? null
        : null,
    }));

    const savedCount = await saveLeads(businesses, {
      location: { lat, lng },
      radius,
      category,
      searchedTypes,
      searchedAt: new Date(),
    });

    if (businesses.length === 0 && skippedTypes.length === searchedTypes.length) {
      const firstError = skippedTypes[0]?.error || "Places API (New) no respondio.";

      return NextResponse.json(
        {
          error:
            `${firstError} Active Places API (New) en Google Cloud para MAPS_KEY ` +
            "y revise que las restricciones de la key permitan places.googleapis.com.",
          businesses,
          searchedTypes,
          skippedTypes,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      businesses,
      limit: LEAD_LIMIT,
      savedCount,
      alreadySavedCount: existingLeadIds.size,
      totalCandidatesCount: baseBusinesses.length,
      withoutWebsiteCount: businesses.filter((business) => !business.websiteUri).length,
      needsModernizationCount: businesses.filter(
        (business) => business.websiteEvaluation?.needsModernization,
      ).length,
      emailsFoundCount: businesses.reduce(
        (total, business) => total + (business.contactIntel?.emails.length ?? 0),
        0,
      ),
      searchedTypes,
      skippedTypes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo completar la busqueda.",
      },
      { status: 500 },
    );
  }
}
