/**
 * Seed: selectable Mundial profile avatar icons.
 *
 * Stores a curated set of football star photo options in MongoDB. The images
 * are hosted by Wikimedia Commons and the seed keeps source/license metadata
 * alongside each selectable icon.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-mundial-avatar-icons.mjs --dry-run
 *   node --env-file=.env scripts/seed-mundial-avatar-icons.mjs
 */

import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_avatar_icons";
const DRY_RUN = process.argv.includes("--dry-run");

const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function commonsImageUrl(fileName, width = 256) {
  return `${COMMONS_FILE_PATH}${encodeURIComponent(fileName)}?width=${width}`;
}

function commonsSourceUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, "_")}`;
}

const ICONS = [
  {
    id: "messi",
    name: "Messi",
    displayName: "Lionel Messi",
    country: "Argentina",
    countryCode: "AR",
    fileName: "Lionel-Messi-Argentina-2022-FIFA-World-Cup (cropped).jpg",
    license: "CC BY-SA 4.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "cr7",
    name: "C. Ronaldo",
    displayName: "Cristiano Ronaldo",
    country: "Portugal",
    countryCode: "PT",
    fileName: "Cristiano Ronaldo 2018.jpg",
    license: "CC BY-SA 3.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "ronaldinho",
    name: "Ronaldinho",
    displayName: "Ronaldinho Gaucho",
    country: "Brazil",
    countryCode: "BR",
    fileName: "Ronaldinho by Vicario.JPG",
    license: "CC BY-SA 3.0",
    attribution: "Vicario via Wikimedia Commons",
  },
  {
    id: "mbappe",
    name: "Mbappé",
    displayName: "Kylian Mbappé",
    country: "France",
    countryCode: "FR",
    fileName: "Kylian Mbappé France.jpg",
    license: "CC BY-SA 3.0",
    attribution: "Kirill Venediktov / soccer.ru via Wikimedia Commons",
  },
  {
    id: "neymar",
    name: "Neymar Jr",
    displayName: "Neymar Jr",
    country: "Brazil",
    countryCode: "BR",
    fileName: "Neymar (cropped).jpg",
    license: "CC BY-SA 3.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "pele",
    name: "Pelé",
    displayName: "Pelé",
    country: "Brazil",
    countryCode: "BR",
    fileName: "Pele.jpg",
    license: "Public domain",
    attribution: "National Archives and Records Administration via Wikimedia Commons",
  },
  {
    id: "maradona",
    name: "Maradona",
    displayName: "Diego Maradona",
    country: "Argentina",
    countryCode: "AR",
    fileName: "Maradona 2010-1.jpg",
    license: "CC BY-SA 3.0",
    attribution: "Alexandr Mysyakin / soccer.ru via Wikimedia Commons",
  },
  {
    id: "zidane",
    name: "Zidane",
    displayName: "Zinedine Zidane",
    country: "France",
    countryCode: "FR",
    fileName: "Zinedine Zidane (cropped).JPG",
    license: "CC BY 2.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "haaland",
    name: "Haaland",
    displayName: "Erling Haaland",
    country: "Norway",
    countryCode: "NO",
    fileName: "Erling Haaland 2023 (cropped square).jpg",
    license: "CC BY-SA 4.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "lewandowski",
    name: "Lewandowski",
    displayName: "Robert Lewandowski",
    country: "Poland",
    countryCode: "PL",
    fileName: "Robert Lewandowski 2018, JAP-POL (cropped).jpg",
    license: "CC BY-SA 3.0",
    attribution: "Kirill Venediktov / soccer.ru via Wikimedia Commons",
  },
  {
    id: "benzema",
    name: "Benzema",
    displayName: "Karim Benzema",
    country: "France",
    countryCode: "FR",
    fileName: "Karim Benzema during an interview in 2021 (2).jpg",
    license: "CC BY-SA 4.0",
    attribution: "Wikimedia Commons contributors",
  },
  {
    id: "beckham",
    name: "Beckham",
    displayName: "David Beckham",
    country: "England",
    countryCode: "GB-ENG",
    fileName: "David Beckham 2011.jpg",
    license: "CC BY-SA 2.0",
    attribution: "Wikimedia Commons contributors",
  },
].map((icon, index) => ({
  ...icon,
  imageUrl: commonsImageUrl(icon.fileName),
  sourceUrl: commonsSourceUrl(icon.fileName),
  provider: "Wikimedia Commons",
  active: true,
  sortOrder: index + 1,
}));

function printSummary() {
  console.log(`\nAvatar icons: ${ICONS.length}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log("\nIcons:");
  for (const icon of ICONS) {
    console.log(`  ${String(icon.sortOrder).padStart(2)}. ${icon.name.padEnd(12)} ${icon.imageUrl}`);
  }
}

async function seed() {
  printSummary();

  if (DRY_RUN) {
    console.log("\nDry run only. Mongo was not modified.");
    return;
  }

  if (!URI) {
    console.error("MONGODB_URI is not defined.");
    process.exit(1);
  }

  const client = new MongoClient(URI);
  const now = new Date();

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    await Promise.all([
      collection.createIndex({ id: 1 }, { unique: true }),
      collection.createIndex({ active: 1, sortOrder: 1 }),
    ]);

    const result = await collection.bulkWrite(
      ICONS.map((icon) => ({
        updateOne: {
          filter: { id: icon.id },
          update: {
            $set: {
              ...icon,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const stale = await collection.updateMany(
      { id: { $nin: ICONS.map((icon) => icon.id) }, active: true },
      { $set: { active: false, updatedAt: now } }
    );

    console.log("\nMongo seed completed.");
    console.log(`  Database: ${DB_NAME}`);
    console.log(`  Collection: ${COLLECTION}`);
    console.log(`  inserted: ${result.upsertedCount}`);
    console.log(`  matched:  ${result.matchedCount}`);
    console.log(`  updated:  ${result.modifiedCount}`);
    console.log(`  stale:    ${stale.modifiedCount}`);
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error("Avatar icon seed failed:", error);
  process.exit(1);
});
