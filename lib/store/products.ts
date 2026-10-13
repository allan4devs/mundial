import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { getStoreSettings, type StoreSettings } from "@/lib/models/store-settings";

export type StoreProductCategory =
  | "packs"
  | "footwear"
  | "apparel"
  | "essentials"
  | "hydration"
  | "safety"
  | "camping"
  | "accessories";

export type StoreProductStatus = "preview" | "available" | "made_to_order";

export type StoreProductDoc = {
  _id?: unknown;
  slug: string;
  category: StoreProductCategory;
  brand?: string;
  image: string;
  price: number;
  priceCRC?: number;
  currency?: "USD" | "CRC";
  rating: number;
  featured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  stock?: number | null;
  status?: StoreProductStatus;
  optionsEs?: string[];
  optionsEn?: string[];
  tagEs: string;
  tagEn: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  useCaseEs: string;
  useCaseEn: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  category: StoreProductCategory;
  brand?: string;
  image: string;
  price: number;
  priceCRC?: number;
  currency: "USD" | "CRC";
  rating: number;
  featured: boolean;
  inStock: boolean;
  stockCount: number | null;
  status: StoreProductStatus;
  optionsEs: string[];
  optionsEn: string[];
  tag: { es: string; en: string };
  name: { es: string; en: string };
  description: { es: string; en: string };
  useCase: { es: string; en: string };
};

export type StoreCatalogResponse = {
  products: StoreProduct[];
  settings: Pick<StoreSettings, "shippingFeeUSD" | "freeShippingThresholdUSD" | "currency" | "whatsappPhone">;
};

const LEGACY_DEMO_PRODUCT_IDENTITIES = [
  {
    slug: "mochila-rio-28l",
    nameEs: "Mochila Río 28L",
    image: "/image/IMG_6814.jpg",
  },
  {
    slug: "bota-grip-la-vieja",
    nameEs: "Bota Grip La Vieja",
    image: "/image/IMG_5592.jpg",
  },
  {
    slug: "capa-esmeralda",
    nameEs: "Capa Esmeralda",
    image: "/image/IMG_6810.jpg",
  },
  {
    slug: "kit-explorador",
    nameEs: "Kit Explorador",
    image: "/image/IMG_6806.jpg",
  },
  {
    slug: "sandalia-pozas",
    nameEs: "Sandalia Pozas",
    image: "/image/IMG_4523.jpg",
  },
  {
    slug: "rinonera-sendero",
    nameEs: "Riñonera Sendero",
    image: "/image/IMG_4672.jpg",
  },
  {
    slug: "nike-pegasus-trail",
    nameEs: "Nike Pegasus Trail",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "adidas-terrex-swift",
    nameEs: "Adidas Terrex Swift R3",
    image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "hitec-altitude-vii",
    nameEs: "Hi-Tec Altitude VII WP",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "merrell-moab-3",
    nameEs: "Merrell Moab 3 Ventilador",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "tnf-borealis-28",
    nameEs: "The North Face Borealis 28L",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "columbia-trail-30",
    nameEs: "Columbia Trail Elite 30L",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "patagonia-torrentshell",
    nameEs: "Patagonia Torrentshell 3L",
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "columbia-watertight-ii",
    nameEs: "Columbia Watertight II",
    image: "https://images.unsplash.com/photo-1516575150278-77136aed6920?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "adidas-terrex-fleece",
    nameEs: "Adidas Terrex Fleece",
    image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "nike-drifit-trail-tee",
    nameEs: "Nike Dri-FIT Trail Tee",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "camelbak-hydrobak",
    nameEs: "CamelBak HydroBak 1.5L",
    image: "https://images.unsplash.com/photo-1622260614153-03223fb72052?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "hydroflask-32oz",
    nameEs: "Hydro Flask 32oz",
    image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "nalgene-wide-1l",
    nameEs: "Nalgene Boca Ancha 1L",
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "petzl-tikka-headlamp",
    nameEs: "Linterna frontal Petzl Tikka",
    image: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "bd-trail-poles",
    nameEs: "Bastones Black Diamond Trail",
    image: "https://images.unsplash.com/photo-1517398823963-c2dc6fc3e837?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "kit-primeros-auxilios",
    nameEs: "Kit Primeros Auxilios Montaña",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "tnf-stormbreak-2",
    nameEs: "Carpa The North Face Stormbreak 2",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "columbia-sleeping-bag",
    nameEs: "Sleeping Columbia 10°C",
    image: "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "hamaca-toldo-rio",
    nameEs: "Hamaca + Toldo Río",
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "patagonia-p6-cap",
    nameEs: "Gorra Patagonia P-6",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "gafas-polarizadas-rio",
    nameEs: "Gafas Polarizadas Río",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "reloj-gps-outdoor",
    nameEs: "Reloj GPS Outdoor",
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=70",
  },
  {
    slug: "medias-merino-trail",
    nameEs: "Medias Merino Trail (2 pares)",
    image: "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=900&q=70",
  },
] satisfies Array<Pick<StoreProductDoc, "slug" | "nameEs" | "image">>;

export const DEFAULT_STORE_PRODUCTS: Omit<StoreProductDoc, "_id">[] = [
  {
    slug: "coleccion-tops-aventura",
    category: "apparel",
    brand: "La Vieja Adventures",
    image: "/store/collection-tops-v1.webp",
    price: 0,
    rating: 0,
    featured: true,
    isActive: true,
    sortOrder: 1,
    stock: null,
    status: "preview",
    optionsEs: ["Camiseta técnica", "Camisa de manga larga", "Top ligero"],
    optionsEn: ["Technical tee", "Long-sleeve shirt", "Lightweight top"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Camisetas y camisas de aventura",
    nameEn: "Adventure tees and shirts",
    descriptionEs:
      "Familia en desarrollo para explorar camisetas, camisas y tops La Vieja. Diseños, materiales, colores y precio se confirmarán antes de abrir pedidos.",
    descriptionEn:
      "A developing family of La Vieja tees, shirts, and tops. Designs, materials, colors, and pricing will be confirmed before orders open.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
  {
    slug: "coleccion-capas-aventura",
    category: "apparel",
    brand: "La Vieja Adventures",
    image: "/store/collection-rain-v1.webp",
    price: 0,
    rating: 0,
    featured: false,
    isActive: true,
    sortOrder: 2,
    stock: null,
    status: "preview",
    optionsEs: ["Rompevientos ligero", "Poncho de aventura", "Chaqueta exterior"],
    optionsEn: ["Light wind layer", "Adventure poncho", "Outer jacket"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Capas para lluvia y viento",
    nameEn: "Rain and wind layers",
    descriptionEs:
      "Conceptos de capas exteriores para el clima cambiante de San Carlos. Materiales, nivel de protección, colores y precio todavía están por definirse.",
    descriptionEn:
      "Outer-layer concepts for San Carlos' changing weather. Materials, protection level, colors, and pricing are still to be defined.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
  {
    slug: "coleccion-bottoms-aventura",
    category: "apparel",
    brand: "La Vieja Adventures",
    image: "/store/collection-bottoms-v1.webp",
    price: 0,
    rating: 0,
    featured: false,
    isActive: true,
    sortOrder: 3,
    stock: null,
    status: "preview",
    optionsEs: ["Short ligero", "Pantalón convertible", "Pantalón de sendero"],
    optionsEn: ["Lightweight shorts", "Convertible pants", "Trail pants"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Shorts y pantalones de aventura",
    nameEn: "Adventure shorts and pants",
    descriptionEs:
      "Familia prevista de prendas inferiores para movimiento al aire libre. Cortes, telas, acabados, colores y precio se confirmarán antes de vender.",
    descriptionEn:
      "A planned family of bottoms for outdoor movement. Fits, fabrics, finishes, colors, and pricing will be confirmed before sale.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
  {
    slug: "coleccion-calzado-aventura",
    category: "footwear",
    brand: "La Vieja Adventures",
    image: "/store/collection-footwear-v1.webp",
    price: 0,
    rating: 0,
    featured: false,
    isActive: true,
    sortOrder: 4,
    stock: null,
    status: "preview",
    optionsEs: ["Zapato de sendero", "Calzado para agua", "Bota ligera"],
    optionsEn: ["Trail shoe", "Water shoe", "Lightweight boot"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Calzado para sendero y agua",
    nameEn: "Trail and water footwear",
    descriptionEs:
      "Línea conceptual de calzado La Vieja para distintos terrenos. Hormas, materiales, agarre, colores y precio requieren validación antes de ofrecerse.",
    descriptionEn:
      "A conceptual La Vieja footwear line for varied terrain. Fit, materials, grip, colors, and pricing require validation before release.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
  {
    slug: "coleccion-accesorios-aventura",
    category: "accessories",
    brand: "La Vieja Adventures",
    image: "/store/collection-accessories-v1.webp",
    price: 0,
    rating: 0,
    featured: false,
    isActive: true,
    sortOrder: 5,
    stock: null,
    status: "preview",
    optionsEs: ["Gorra", "Sombrero de ala", "Bandana tubular"],
    optionsEn: ["Cap", "Brimmed hat", "Tube bandana"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Accesorios para sol y sendero",
    nameEn: "Sun and trail accessories",
    descriptionEs:
      "Ideas iniciales de accesorios La Vieja para completar la indumentaria. Diseños, materiales, colores y precio se definirán antes de recibir pedidos.",
    descriptionEn:
      "Early La Vieja accessory ideas to complete the apparel collection. Designs, materials, colors, and pricing will be defined before orders open.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
  {
    slug: "coleccion-bolsos-aventura",
    category: "packs",
    brand: "La Vieja Adventures",
    image: "/store/collection-packs-v1.webp",
    price: 0,
    rating: 0,
    featured: false,
    isActive: true,
    sortOrder: 6,
    stock: null,
    status: "preview",
    optionsEs: ["Mochila de día", "Bolso enrollable", "Canguro de sendero"],
    optionsEn: ["Day pack", "Roll-top bag", "Trail waist pack"],
    tagEs: "Vista previa",
    tagEn: "Preview",
    nameEs: "Mochilas y bolsos de aventura",
    nameEn: "Adventure packs and bags",
    descriptionEs:
      "Familia conceptual de mochilas y bolsos La Vieja. Capacidades, materiales, acabados, colores y precio se confirmarán antes de su lanzamiento.",
    descriptionEn:
      "A conceptual family of La Vieja packs and bags. Capacity, materials, finishes, colors, and pricing will be confirmed before launch.",
    useCaseEs: "Colección futura · Estilos previstos",
    useCaseEn: "Future collection · Planned styles",
  },
];

const VALID_CATEGORIES = new Set<StoreProductCategory>([
  "packs",
  "footwear",
  "apparel",
  "essentials",
  "hydration",
  "safety",
  "camping",
  "accessories",
]);

const VALID_STATUSES = new Set<StoreProductStatus>([
  "preview",
  "available",
  "made_to_order",
]);

function normalizeStoreProductStatus(value: unknown): StoreProductStatus {
  const status = String(value ?? "preview").trim() as StoreProductStatus;
  return VALID_STATUSES.has(status) ? status : "preview";
}

function normalizeStoreProductOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((option) => String(option).trim())
        .filter(Boolean),
    ),
  );
}

export function serializeStoreProduct(doc: StoreProductDoc): StoreProduct {
  const stock = doc.stock;
  const status = normalizeStoreProductStatus(doc.status);
  const inStock = status !== "preview" && (stock == null || stock > 0);

  return {
    id: String(doc._id ?? doc.slug),
    slug: doc.slug,
    category: doc.category,
    brand: doc.brand?.trim() || undefined,
    image: doc.image,
    price: Number(doc.price) || 0,
    priceCRC: typeof doc.priceCRC === "number" ? doc.priceCRC : undefined,
    currency: doc.currency === "CRC" ? "CRC" : "USD",
    rating: Number(doc.rating) || 0,
    featured: Boolean(doc.featured),
    inStock,
    stockCount: stock == null ? null : Math.max(0, stock),
    status,
    optionsEs: normalizeStoreProductOptions(doc.optionsEs),
    optionsEn: normalizeStoreProductOptions(doc.optionsEn),
    tag: { es: doc.tagEs, en: doc.tagEn },
    name: { es: doc.nameEs, en: doc.nameEn },
    description: { es: doc.descriptionEs, en: doc.descriptionEn },
    useCase: { es: doc.useCaseEs, en: doc.useCaseEn },
  };
}

export function normalizeStoreProductInput(body: Record<string, unknown>) {
  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) return { error: "slug is required" as const };

  const category = String(body.category ?? "").trim() as StoreProductCategory;
  if (!VALID_CATEGORIES.has(category)) {
    return { error: "category must be one of: packs, footwear, apparel, essentials, hydration, safety, camping, accessories" as const };
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "price must be a non-negative number" as const };
  }

  const rating = Number(body.rating ?? 5);
  const priceCRC = body.priceCRC == null ? undefined : Number(body.priceCRC);
  const stock = body.stock == null ? null : Number(body.stock);
  const status = normalizeStoreProductStatus(body.status);
  const optionsEs = normalizeStoreProductOptions(body.optionsEs);
  const optionsEn = normalizeStoreProductOptions(body.optionsEn);
  const now = new Date().toISOString();

  return {
    slug,
    category,
    brand: String(body.brand ?? "").trim() || undefined,
    image: String(body.image ?? "/store/collection-tops-v1.webp").trim(),
    price,
    priceCRC: Number.isFinite(priceCRC) ? priceCRC : undefined,
    currency: body.currency === "CRC" ? "CRC" : "USD",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 5,
    featured: Boolean(body.featured),
    isActive: body.isActive !== false,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 100,
    stock: stock == null || !Number.isFinite(stock) ? null : Math.max(0, stock),
    status,
    optionsEs,
    optionsEn,
    tagEs: String(body.tagEs ?? "").trim(),
    tagEn: String(body.tagEn ?? body.tagEs ?? "").trim(),
    nameEs: String(body.nameEs ?? "").trim(),
    nameEn: String(body.nameEn ?? body.nameEs ?? "").trim(),
    descriptionEs: String(body.descriptionEs ?? "").trim(),
    descriptionEn: String(body.descriptionEn ?? body.descriptionEs ?? "").trim(),
    useCaseEs: String(body.useCaseEs ?? "").trim(),
    useCaseEn: String(body.useCaseEn ?? body.useCaseEs ?? "").trim(),
    updatedAt: now,
  } satisfies Omit<StoreProductDoc, "_id">;
}

async function getProductsCollection() {
  const db = await getDb();
  return db.collection<StoreProductDoc>(COLLECTIONS.STORE_PRODUCTS);
}

export async function seedStoreProductsIfEmpty() {
  const collection = await getProductsCollection();
  const now = new Date().toISOString();

  await collection.bulkWrite(
    LEGACY_DEMO_PRODUCT_IDENTITIES.map(({ slug, nameEs, image }) => ({
      updateOne: {
        filter: {
          slug,
          nameEs,
          image,
          isActive: { $ne: false },
        },
        update: {
          $set: {
            isActive: false,
            updatedAt: now,
          },
        },
      },
    })),
    { ordered: false },
  );

  // Preserve admin-created or admin-edited products. New collection families are
  // inserted only when their slug does not already exist.
  const existing = await collection
    .find({}, { projection: { slug: 1 } })
    .toArray();
  const existingSlugs = new Set(existing.map((doc) => doc.slug));
  const missing = DEFAULT_STORE_PRODUCTS.filter((product) => !existingSlugs.has(product.slug));
  if (missing.length === 0) return;

  await collection.insertMany(
    missing.map((product) => ({
      ...product,
      currency: "USD" as const,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function readActiveStoreCatalog(): Promise<StoreCatalogResponse> {
  await seedStoreProductsIfEmpty();

  const [collection, settings] = await Promise.all([
    getProductsCollection(),
    getStoreSettings(),
  ]);

  const docs = await collection
    .find({ isActive: { $ne: false } })
    .sort({ featured: -1, sortOrder: 1, price: 1 })
    .toArray();

  return {
    products: docs.map(serializeStoreProduct),
    settings: {
      shippingFeeUSD: settings.shippingFeeUSD,
      freeShippingThresholdUSD: settings.freeShippingThresholdUSD ?? 75,
      currency: settings.currency,
      whatsappPhone: settings.whatsappPhone,
    },
  };
}

export async function readAllStoreProducts() {
  await seedStoreProductsIfEmpty();
  const collection = await getProductsCollection();
  const docs = await collection.find({}).sort({ sortOrder: 1, price: 1 }).toArray();
  return docs.map((doc) => ({
    ...doc,
    _id: String(doc._id),
    status: normalizeStoreProductStatus(doc.status),
    optionsEs: normalizeStoreProductOptions(doc.optionsEs),
    optionsEn: normalizeStoreProductOptions(doc.optionsEn),
  }));
}

export async function createStoreProduct(body: Record<string, unknown>) {
  const normalized = normalizeStoreProductInput(body);
  if ("error" in normalized) return normalized;

  const collection = await getProductsCollection();
  const existing = await collection.findOne({ slug: normalized.slug });
  if (existing) return { error: "Product slug already exists." as const };

  const now = new Date().toISOString();
  await collection.insertOne({
    ...normalized,
    createdAt: now,
  });

  return { ok: true as const };
}

export async function updateStoreProduct(slug: string, body: Record<string, unknown>) {
  const collection = await getProductsCollection();
  const existing = await collection.findOne({ slug });
  if (!existing) return { error: "Product not found." as const };

  const patch = normalizeStoreProductInput({ ...existing, ...body, slug });
  if ("error" in patch) return patch;

  await collection.updateOne({ slug }, { $set: patch });
  return { ok: true as const };
}

export async function deleteStoreProduct(slug: string) {
  const collection = await getProductsCollection();
  const result = await collection.updateOne(
    { slug },
    { $set: { isActive: false, updatedAt: new Date().toISOString() } },
  );

  if (result.matchedCount === 0) return { error: "Product not found." as const };
  return { ok: true as const };
}
