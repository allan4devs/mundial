/**
 * scrape-no-website-leads.mjs
 * ---------------------------------------------------------------------------
 * Finds local businesses that DO NOT have a website, using the official
 * Google Places API (New). This is the ToS-compliant way to "scrape" Maps —
 * raw HTML scraping of maps.google.com violates Google's terms and gets you
 * rate-limited/blocked. The Places API returns an authoritative `websiteUri`
 * field, so "no website" = that field is absent.
 *
 * Prime use-case: building a lead list for web-design proposals (businesses
 * that only have Facebook/Instagram are the best targets).
 *
 * SETUP
 *   1. Google Cloud Console → enable "Places API (New)".
 *   2. Create an API key, restrict it to Places API.
 *   3. Add to .env:   GOOGLE_MAPS_API_KEY=your_key_here
 *
 * RUN
 *   node scripts/scrape-no-website-leads.mjs
 *   node scripts/scrape-no-website-leads.mjs --radius 1500 --limit 20
 *
 * Output: prints a table and writes scripts/out/no-website-leads.csv
 * ---------------------------------------------------------------------------
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---- Load .env (no dependency on dotenv) ----------------------------------
import { readFileSync } from "node:fs";
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* .env optional */
}

// ---- Config ----------------------------------------------------------------
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error(
    "\n✖ Missing GOOGLE_MAPS_API_KEY.\n" +
      "  Enable 'Places API (New)' in Google Cloud, create a key, and add:\n" +
      "  GOOGLE_MAPS_API_KEY=your_key   (to .env)\n",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

// Ciudad Quesada centro (Parque Central / Catedral)
const CENTER = {
  latitude: Number(getArg("lat", "10.32385")),
  longitude: Number(getArg("lng", "-84.42748")),
};
const RADIUS_M = Number(getArg("radius", "1000")); // 1 km as requested
const LIMIT = Number(getArg("limit", "10"));

// Business categories worth prospecting (the Places API caps 20 per call, so
// we sweep several includedTypes and dedupe).
const TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "meal_takeaway",
  "beauty_salon",
  "hair_care",
  "barber_shop",
  "veterinary_care",
  "hardware_store",
  "clothing_store",
  "florist",
  "car_repair",
  "gym",
  "dentist",
  "pharmacy",
];

const ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.location",
].join(",");

async function searchType(includedType) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [includedType],
      maxResultCount: 20,
      languageCode: "es",
      regionCode: "CR",
      locationRestriction: {
        circle: { center: CENTER, radius: RADIUS_M },
      },
    }),
  });
  if (!res.ok) {
    console.warn(`  ! ${includedType}: HTTP ${res.status} ${await res.text()}`);
    return [];
  }
  const json = await res.json();
  return json.places ?? [];
}

// Haversine distance in metres (for reporting how far from centre)
function distM(a, b) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(h)));
}

async function main() {
  console.log(
    `\n🔎 Ciudad Quesada — businesses WITHOUT a website within ${RADIUS_M} m\n` +
      `   center: ${CENTER.latitude}, ${CENTER.longitude}\n`,
  );

  const byId = new Map();
  for (const type of TYPES) {
    const places = await searchType(type);
    for (const p of places) byId.set(p.id, p);
    process.stdout.write(`  · ${type}: ${places.length}\n`);
  }

  const noWebsite = [...byId.values()]
    .filter((p) => !p.websiteUri) // authoritative "no website"
    .map((p) => ({
      name: p.displayName?.text ?? "",
      category: p.primaryTypeDisplayName?.text ?? "",
      phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? "",
      address: p.formattedAddress ?? "",
      rating: p.rating ?? "",
      reviews: p.userRatingCount ?? 0,
      distance_m: p.location ? distM(CENTER, p.location) : "",
      maps: p.googleMapsUri ?? "",
    }))
    // Most reviews first = most established leads worth pitching
    .sort((a, b) => b.reviews - a.reviews);

  const top = noWebsite.slice(0, LIMIT);

  console.log(
    `\n✔ ${noWebsite.length} businesses without a website found — top ${top.length}:\n`,
  );
  console.table(
    top.map((r) => ({
      Name: r.name,
      Category: r.category,
      Phone: r.phone,
      "Dist(m)": r.distance_m,
      Reviews: r.reviews,
    })),
  );

  // Write CSV
  const outDir = resolve(__dirname, "out");
  mkdirSync(outDir, { recursive: true });
  const csvPath = resolve(outDir, "no-website-leads.csv");
  const headers = [
    "name",
    "category",
    "phone",
    "address",
    "rating",
    "reviews",
    "distance_m",
    "maps",
  ];
  const csv = [
    headers.join(","),
    ...noWebsite.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  writeFileSync(csvPath, csv, "utf8");
  console.log(`\n💾 Full list (${noWebsite.length}) written to ${csvPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
