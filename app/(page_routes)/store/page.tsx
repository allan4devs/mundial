"use client";

import DynamicHeroHeader from "@/app/components/sections/DynamicHeroHeader";
import SiteFooter from "@/app/components/sections/SiteFooter";
import { useLanguage, type Lang } from "@/lib/LanguageContext";
import { useStoreProducts } from "@/lib/hooks/useStoreProducts";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Backpack,
  Check,
  CloudRain,
  Footprints,
  Layers3,
  MapPin,
  MessageCircle,
  Mountain,
  PackageCheck,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { StoreInterestDrawer, type InterestLine } from "./StoreInterestDrawer";
import { StoreProductCard } from "./StoreProductCard";
import {
  buildCartWhatsAppHref,
  filterProductsByQuery,
  trackStoreAction,
} from "./store-conversion";
import {
  CART_STORAGE_KEY,
  type CartItem,
  type Product,
  type ProductCategory,
} from "./store-data";

const HERO_IMAGE = "/store/apparel-hero-v1.webp";

const categoryMeta: Record<
  ProductCategory,
  { icon: ComponentType<{ size?: number; className?: string }>; es: string; en: string }
> = {
  all: { icon: Sparkles, es: "Toda la colección", en: "Full collection" },
  apparel: { icon: Shirt, es: "Ropa", en: "Apparel" },
  footwear: { icon: Footprints, es: "Calzado", en: "Footwear" },
  accessories: { icon: Sun, es: "Accesorios", en: "Accessories" },
  packs: { icon: Backpack, es: "Bolsos", en: "Bags" },
  essentials: { icon: PackageCheck, es: "Esenciales", en: "Essentials" },
  hydration: { icon: PackageCheck, es: "Hidratación", en: "Hydration" },
  safety: { icon: Mountain, es: "Seguridad", en: "Safety" },
  camping: { icon: Mountain, es: "Camping", en: "Camping" },
};

const useCases = [
  {
    icon: CloudRain,
    titleEs: "Lluvia y bosque",
    titleEn: "Rain and forest",
    textEs: "Capas ligeras, manga larga y prendas fáciles de empacar.",
    textEn: "Light layers, long sleeves, and easy-to-pack garments.",
  },
  {
    icon: Footprints,
    titleEs: "Sendero y cañón",
    titleEn: "Trail and canyon",
    textEs: "Pantalones flexibles, camisetas técnicas y calzado para consultar según la ruta.",
    textEn: "Flexible pants, technical tops, and footwear to match to the route.",
  },
  {
    icon: Sun,
    titleEs: "Río y días de sol",
    titleEn: "River and sunny days",
    textEs: "Shorts, gorras, sombreros y accesorios para completar el equipo personal.",
    textEn: "Shorts, caps, hats, and accessories to complete your personal kit.",
  },
] as const;

function collectionWhatsAppHref(phone: string, lang: Lang) {
  const message = encodeURIComponent(
    lang === "es"
      ? "Hola La Vieja Adventures 👋 Quiero conocer la colección de indumentaria outdoor. ¿Me cuentan cuándo abren pedidos y qué opciones están preparando?"
      : "Hi La Vieja Adventures 👋 I'd like to learn about the outdoor apparel collection. When will orders open, and which options are you preparing?",
  );
  return `https://wa.me/${phone}?text=${message}`;
}

export default function StorePage() {
  const { lang } = useLanguage();
  const isEs = lang === "es";
  const { products, settings, loading, error } = useStoreProducts();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [toastProduct, setToastProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      if (Array.isArray(parsed)) {
        setCart(
          parsed.filter(
            (item): item is CartItem =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as CartItem).productId === "string" &&
              Number.isInteger((item as CartItem).quantity) &&
              (item as CartItem).quantity > 0,
          ),
        );
      }
    } catch {
      setCart([]);
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (products.length === 0) return;
    setCart((current) =>
      current.filter((item) => products.some((product) => product.id === item.productId)),
    );
  }, [products]);

  useEffect(() => {
    trackStoreAction("page_view", { catalog: "apparel-preview" });
  }, []);

  useEffect(() => {
    if (!toastProduct) return;
    const timer = window.setTimeout(() => setToastProduct(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastProduct]);

  const closeCart = useCallback(() => setCartOpen(false), []);

  const availableCategories = useMemo(() => {
    const counts = new Map<ProductCategory, number>([["all", products.length]]);
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const byCategory =
      activeCategory === "all"
        ? products
        : products.filter((product) => product.category === activeCategory);
    return filterProductsByQuery(byCategory, searchQuery, lang);
  }, [activeCategory, lang, products, searchQuery]);

  const cartDetails = useMemo<InterestLine[]>(
    () =>
      cart
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          return product
            ? { ...product, quantity: item.quantity, lineTotal: 0 }
            : null;
        })
        .filter((item): item is InterestLine => Boolean(item)),
    [cart, products],
  );

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const whatsappHref = buildCartWhatsAppHref(
    cartDetails,
    0,
    lang,
    settings.whatsappPhone,
  );
  const generalWhatsAppHref = collectionWhatsAppHref(settings.whatsappPhone, lang);

  const addToCart = (productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { productId, quantity: 1 }];
    });
    setToastProduct(product);
    trackStoreAction("interest_list_add", { slug: product.slug });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4F1EA] text-[#2E2A25]">
      <DynamicHeroHeader showHeroSlider={false} />

      <section className="relative isolate min-h-[720px] overflow-hidden bg-[#2E2A25] pt-20 md:min-h-[780px] md:pt-24">
        <Image
          src={HERO_IMAGE}
          alt={
            isEs
              ? "Personas con indumentaria outdoor en un sendero de San Carlos"
              : "People in outdoor apparel on a San Carlos trail"
          }
          fill
          priority
          sizes="100vw"
          className="object-cover object-[67%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(46,42,37,0.97)_0%,rgba(46,42,37,0.88)_38%,rgba(46,42,37,0.38)_68%,rgba(46,42,37,0.20)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(46,42,37,0.20),rgba(46,42,37,0.06)_55%,rgba(46,42,37,0.72))]" />

        <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-5 py-14 sm:px-8 md:min-h-[690px] lg:px-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#2E2A25]/55 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur">
              <MapPin size={14} className="text-[#41E3D2]" />
              {isEs ? "Diseñada desde San Carlos" : "Designed from San Carlos"}
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.28em] text-[#41E3D2]">
              {isEs ? "Colección outdoor · vista previa" : "Outdoor collection · preview"}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[clamp(3.1rem,8.5vw,7rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">
              {isEs ? "Vestirse para la aventura." : "Dress for the adventure."}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/85 sm:text-lg sm:leading-8">
              {isEs
                ? "Estamos preparando camisetas, capas para lluvia, pantalones, shorts, calzado, gorras y bolsos inspirados en el clima y los caminos de La Vieja. Arme su lista y confirmamos cada detalle antes de comprar."
                : "We are preparing shirts, rain layers, pants, shorts, footwear, caps, and bags inspired by La Vieja's weather and trails. Build your list and we will confirm every detail before purchase."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#coleccion"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-7 py-3.5 text-sm font-black text-[#17322E] transition hover:bg-[#20D9C5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {isEs ? "Explorar la colección" : "Explore the collection"}
                <ArrowDown size={17} />
              </a>
              <a
                href={generalWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackStoreAction("hero_collection_whatsapp_click")}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-black text-[#052E16] transition hover:bg-[#39DF76] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <MessageCircle size={17} />
                {isEs ? "Consultar por WhatsApp" : "Ask on WhatsApp"}
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-2.5 text-xs font-bold text-white/90">
              {[
                isEs ? "Sin cobro en línea" : "No online charge",
                isEs ? "Precio y tallas por confirmar" : "Price and sizes to confirm",
                isEs ? "Imágenes conceptuales" : "Concept images",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-2 backdrop-blur"
                >
                  <Check size={13} className="text-[#41E3D2]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#2E2A25]/10 bg-[#00C4B0] px-5 py-4">
        <div className="mx-auto grid max-w-7xl gap-3 text-sm font-extrabold text-[#17322E] sm:grid-cols-3 sm:text-center">
          <span className="inline-flex items-center justify-center gap-2">
            <Layers3 size={16} />
            {isEs ? "Seis familias para empezar" : "Six starting families"}
          </span>
          <span className="inline-flex items-center justify-center gap-2">
            <MessageCircle size={16} />
            {isEs ? "Confirmación humana" : "Human confirmation"}
          </span>
          <span className="inline-flex items-center justify-center gap-2">
            <MapPin size={16} />
            {isEs ? "Identidad La Vieja" : "La Vieja identity"}
          </span>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0C766C]">
                {isEs ? "Primero, el contexto" : "Start with the setting"}
              </p>
              <h2 className="mt-3 max-w-xl text-balance text-4xl font-black leading-[0.96] tracking-[-0.04em] sm:text-5xl">
                {isEs
                  ? "No toda aventura pide la misma ropa."
                  : "Not every adventure calls for the same clothes."}
              </h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#5D564E] lg:justify-self-end">
              {isEs
                ? "Esta primera colección organiza la indumentaria por necesidades del clima tropical. Cuando elija una familia, el equipo le ayudará a aterrizar talla, color y uso previsto."
                : "This first collection organizes apparel around tropical-weather needs. Once you choose a family, the team will help narrow down size, color, and intended use."}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {useCases.map(({ icon: Icon, titleEs, titleEn, textEs, textEn }, index) => (
              <article
                key={titleEs}
                className={`rounded-[1.75rem] p-6 ${
                  index === 1
                    ? "bg-[#00C4B0] text-[#17322E]"
                    : "bg-[#2E2A25] text-white"
                }`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    index === 1 ? "bg-white/45" : "bg-white/10"
                  }`}
                >
                  <Icon size={23} />
                </span>
                <h3 className="mt-6 text-2xl font-black">{isEs ? titleEs : titleEn}</h3>
                <p
                  className={`mt-3 text-sm font-semibold leading-6 ${
                    index === 1 ? "text-[#24534D]" : "text-white/72"
                  }`}
                >
                  {isEs ? textEs : textEn}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-6 rounded-2xl border border-[#2E2A25]/10 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#5D564E]">
            <strong className="text-[#2E2A25]">
              {isEs ? "Seguridad primero:" : "Safety first:"}
            </strong>{" "}
            {isEs
              ? "la indumentaria personal complementa la preparación, pero no sustituye casco, arnés, equipo técnico ni la valoración del guía."
              : "personal apparel complements preparation, but it does not replace a helmet, harness, technical gear, or the guide's assessment."}
          </p>
        </div>
      </section>

      <section
        id="coleccion"
        className="scroll-mt-20 border-y border-[#2E2A25]/10 bg-[#EAE6DE] px-5 py-16 sm:px-8 md:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0C766C]">
                {isEs ? "Colección de lanzamiento" : "Launch collection"}
              </p>
              <h2 className="mt-3 text-balance text-4xl font-black leading-none tracking-[-0.04em] sm:text-5xl">
                {isEs ? "Elija por familia, no a ciegas." : "Choose by family, not blindly."}
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#5D564E] sm:text-base sm:leading-7">
                {isEs
                  ? "Las imágenes representan la dirección visual de productos en desarrollo; no prometen diseño, material o disponibilidad exacta."
                  : "Images represent the visual direction of products in development; they do not promise an exact design, material, or availability."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#2E2A25]/20 bg-white px-5 text-sm font-black text-[#2E2A25] transition hover:border-[#08796D] hover:bg-[#E7FAF6]"
            >
              <ShoppingBag size={17} />
              {isEs ? "Ver mi lista" : "View my list"}
              <span className="rounded-full bg-[#00C4B0] px-2 py-0.5 text-xs text-[#17322E]">
                {cartCount}
              </span>
            </button>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-[#2E2A25]/10 bg-white p-3 sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(240px,0.8fr)_1.2fr] lg:items-center">
              <label className="relative block">
                <span className="sr-only">
                  {isEs ? "Buscar en la colección" : "Search the collection"}
                </span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6C645B]"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={
                    isEs
                      ? "Buscar lluvia, calzado, gorra…"
                      : "Search rain, footwear, cap…"
                  }
                  className="min-h-12 w-full rounded-full border border-[#2E2A25]/15 bg-[#F4F1EA] py-3 pl-11 pr-4 text-sm font-semibold text-[#2E2A25] placeholder:text-[#756D64] focus:border-[#08796D] focus:outline-none focus:ring-2 focus:ring-[#00C4B0]/30"
                />
              </label>

              <div
                className="flex gap-2 overflow-x-auto pb-1 lg:justify-end"
                aria-label={isEs ? "Filtrar por categoría" : "Filter by category"}
              >
                {Array.from(availableCategories.entries())
                  .filter(([, count]) => count > 0)
                  .map(([category, count]) => {
                    const meta = categoryMeta[category];
                    const Icon = meta.icon;
                    const active = activeCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveCategory(category)}
                        className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08796D] ${
                          active
                            ? "bg-[#2E2A25] text-white"
                            : "border border-[#2E2A25]/12 bg-white text-[#514B44] hover:bg-[#E7FAF6]"
                        }`}
                      >
                        <Icon size={15} />
                        {meta[lang]}
                        <span className={active ? "text-white/65" : "text-[#756D64]"}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {loading ? (
            <div
              className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
              aria-label={isEs ? "Cargando colección" : "Loading collection"}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] bg-white">
                  <div className="aspect-[4/5] animate-pulse bg-[#D8D2C9] motion-reduce:animate-none" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#D8D2C9] motion-reduce:animate-none" />
                    <div className="h-7 w-4/5 animate-pulse rounded bg-[#D8D2C9] motion-reduce:animate-none" />
                    <div className="h-16 animate-pulse rounded bg-[#EEEAE4] motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="mt-8 rounded-[1.75rem] border border-red-900/15 bg-white p-8 text-center"
            >
              <h3 className="text-xl font-black">
                {isEs ? "La colección no cargó" : "The collection did not load"}
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#5D564E]">
                {isEs
                  ? "Puede intentarlo otra vez o consultarnos directamente."
                  : "You can try again or ask us directly."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-[#2E2A25] px-5 py-3 text-sm font-black text-white"
                >
                  {isEs ? "Reintentar" : "Try again"}
                </button>
                <a
                  href={generalWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-[#052E16]"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-[#2E2A25]/20 bg-white p-10 text-center">
              <Search size={24} className="mx-auto text-[#08796D]" />
              <h3 className="mt-4 text-xl font-black">
                {isEs ? "No encontramos esa opción" : "We could not find that option"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-4 text-sm font-black text-[#0C766C] underline underline-offset-4"
              >
                {isEs ? "Ver toda la colección" : "View the full collection"}
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  whatsappPhone={settings.whatsappPhone}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#2E2A25] px-5 py-16 text-white sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#41E3D2]">
            {isEs ? "Cómo funciona esta etapa" : "How this stage works"}
          </p>
          <h2 className="mt-3 max-w-2xl text-balance text-4xl font-black leading-none tracking-[-0.04em] sm:text-5xl">
            {isEs ? "Tres pasos. Cero sorpresas." : "Three steps. Zero surprises."}
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[1.75rem] bg-white/10 md:grid-cols-3">
            {[
              {
                number: "01",
                title: isEs ? "Explore" : "Explore",
                text: isEs
                  ? "Revise las familias y agregue las que le interesan."
                  : "Review the families and add the ones that interest you.",
              },
              {
                number: "02",
                title: isEs ? "Envíe su lista" : "Send your list",
                text: isEs
                  ? "WhatsApp abre con un resumen claro, sin cobrarle nada."
                  : "WhatsApp opens with a clear summary and no charge.",
              },
              {
                number: "03",
                title: isEs ? "Confirme" : "Confirm",
                text: isEs
                  ? "El equipo valida talla, color, precio, fecha y condiciones antes del pedido."
                  : "The team validates size, color, price, timing, and terms before the order.",
              },
            ].map((step) => (
              <article key={step.number} className="bg-[#2E2A25] p-7 sm:p-8">
                <span className="text-sm font-black tracking-[0.18em] text-[#41E3D2]">
                  {step.number}
                </span>
                <h3 className="mt-8 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/70">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0C766C]">
              {isEs ? "Antes de preguntar" : "Before you ask"}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.04em]">
              {isEs ? "Lo que ya sabemos." : "What we know so far."}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: isEs ? "¿Ya puedo comprar?" : "Can I buy now?",
                a: isEs
                  ? "Todavía estamos preparando la colección. Puede enviar una lista de interés y el equipo le dirá qué opción, precio y fecha están confirmados antes de cualquier compra."
                  : "The collection is still in preparation. You can send an interest list, and the team will tell you which option, price, and timing are confirmed before any purchase.",
              },
              {
                q: isEs ? "¿Qué tallas y colores habrá?" : "Which sizes and colors will be offered?",
                a: isEs
                  ? "Las tallas, cortes y colores no se publican como disponibles hasta validarlos. Díganos qué necesita y lo revisamos con usted."
                  : "Sizes, fits, and colors are not published as available until validated. Tell us what you need, and we will review it with you.",
              },
              {
                q: isEs ? "¿Las fotos son del producto final?" : "Are these photos of the final product?",
                a: isEs
                  ? "No. Son imágenes conceptuales creadas para mostrar la dirección de cada familia. Las fotos reales, materiales y acabados se publicarán cuando estén confirmados."
                  : "No. They are concept images showing the direction of each family. Real photos, materials, and finishes will be published once confirmed.",
              },
              {
                q: isEs ? "¿Cómo se coordina pago y entrega?" : "How are payment and delivery arranged?",
                a: isEs
                  ? "El equipo confirma por WhatsApp el producto, precio, disponibilidad, entrega y condiciones aplicables. Esta página no procesa pagos."
                  : "The team confirms the product, price, availability, delivery, and applicable terms on WhatsApp. This page does not process payments.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-[#2E2A25]/10 bg-white px-5 py-1 open:shadow-[0_14px_45px_rgba(46,42,37,0.08)]"
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-black marker:content-none">
                  {item.q}
                  <Plus
                    size={18}
                    className="shrink-0 text-[#08796D] transition group-open:rotate-45"
                  />
                </summary>
                <p className="border-t border-[#2E2A25]/10 pb-5 pt-4 text-sm font-medium leading-6 text-[#5D564E]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 md:pb-24 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#00C4B0] p-7 sm:p-10 md:p-14">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[40px] border-[#2E2A25]/8" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#24534D]">
              {isEs ? "¿Primero la aventura?" : "Adventure first?"}
            </p>
            <h2 className="mt-3 text-balance text-4xl font-black leading-none tracking-[-0.04em] text-[#17322E] sm:text-5xl">
              {isEs
                ? "Elija la ruta y luego armamos la lista."
                : "Choose the route, then build the list."}
            </h2>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#24534D]">
              {isEs
                ? "Cada experiencia pide una preparación distinta. Conozca los tours y consulte al equipo qué indumentaria personal conviene llevar."
                : "Each experience calls for different preparation. Explore the tours and ask the team which personal apparel makes sense to bring."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tours"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2E2A25] px-6 text-sm font-black text-white transition hover:bg-[#171512]"
              >
                {isEs ? "Ver tours" : "View tours"}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/reservar"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#2E2A25]/25 px-6 text-sm font-black text-[#17322E] transition hover:bg-white/35"
              >
                {isEs ? "Ir a reservar" : "Book an adventure"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {toastProduct && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-3 top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-[70] mx-auto max-w-md rounded-2xl border border-[#00C4B0]/35 bg-[#2E2A25]/95 p-3.5 text-white shadow-2xl backdrop-blur md:top-24"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
              <Image src={toastProduct.image} alt="" fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#41E3D2]">
                {isEs ? "Agregado a su lista" : "Added to your list"}
              </p>
              <p className="truncate text-sm font-bold">{toastProduct.name[lang]}</p>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="shrink-0 rounded-full bg-[#00C4B0] px-3 py-2 text-xs font-black text-[#17322E]"
            >
              {isEs ? "Ver" : "View"}
            </button>
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={
            isEs
              ? `Abrir lista con ${cartCount} artículos`
              : `Open list with ${cartCount} items`
          }
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-3 z-40 inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-[#2E2A25] p-0 text-sm font-black text-white shadow-[0_16px_45px_rgba(46,42,37,0.35)] transition hover:-translate-y-0.5 md:bottom-7 md:right-7 md:h-auto md:w-auto md:min-h-12 md:px-5"
        >
          <ShoppingBag size={17} className="text-[#41E3D2]" />
          <span className="hidden md:inline">{isEs ? "Mi lista" : "My list"}</span>
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#00C4B0] px-1 text-[0.65rem] text-[#17322E] md:static md:block md:min-h-0 md:min-w-0 md:px-2 md:py-0.5 md:text-xs">
            {cartCount}
          </span>
        </button>
      )}

      <StoreInterestDrawer
        open={cartOpen}
        lang={lang}
        lines={cartDetails}
        whatsappHref={whatsappHref}
        onClose={closeCart}
        onChangeQuantity={changeQuantity}
        onRemove={removeFromCart}
      />
    </main>
  );
}
