"use client";

import type { Lang } from "@/lib/LanguageContext";
import Image from "next/image";
import { Check, MessageCircle, Plus } from "lucide-react";
import { buildSingleProductWhatsAppHref, trackStoreAction } from "./store-conversion";
import type { Product } from "./store-data";

function statusLabel(product: Product, lang: Lang) {
  if (product.status === "made_to_order") {
    return lang === "es" ? "Por encargo" : "Made to order";
  }
  if (product.status === "available") {
    return lang === "es" ? "Colección activa" : "Active collection";
  }
  return lang === "es" ? "Vista previa" : "Preview";
}

const categoryLabels: Record<Product["category"], { es: string; en: string }> = {
  apparel: { es: "Ropa", en: "Apparel" },
  footwear: { es: "Calzado", en: "Footwear" },
  accessories: { es: "Accesorios", en: "Accessories" },
  packs: { es: "Bolsos", en: "Bags" },
  essentials: { es: "Esenciales", en: "Essentials" },
  hydration: { es: "Hidratación", en: "Hydration" },
  safety: { es: "Seguridad", en: "Safety" },
  camping: { es: "Camping", en: "Camping" },
};

export function StoreProductCard({
  product,
  lang,
  whatsappPhone,
  onAdd,
}: {
  product: Product;
  lang: Lang;
  whatsappPhone: string;
  onAdd: (productId: string) => void;
}) {
  const isEs = lang === "es";
  const options = isEs ? product.optionsEs : product.optionsEn;
  const whatsappHref = buildSingleProductWhatsAppHref(product, lang, whatsappPhone);

  return (
    <article
      id={`product-${product.slug}`}
      className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[1.75rem] border border-[#2E2A25]/10 bg-white shadow-[0_20px_65px_rgba(46,42,37,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(46,42,37,0.14)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#DCD8D0]">
        <Image
          src={product.image}
          alt={product.name[lang]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-700 motion-reduce:transition-none group-hover:scale-[1.025] motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full bg-[#2E2A25]/90 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
            {statusLabel(product, lang)}
          </span>
          <span className="rounded-full bg-[#00C4B0] px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-[#17322E]">
            {categoryLabels[product.category][lang]}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2E2A25]/80 to-transparent px-5 pb-5 pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/85">
            {product.useCase[lang]}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0C766C]">
          {product.brand ?? "La Vieja Adventures"}
        </p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-[#2E2A25]">
          {product.name[lang]}
        </h3>
        <p className="mt-3 text-sm font-medium leading-6 text-[#514B44]">
          {product.description[lang]}
        </p>

        {options.length > 0 && (
          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label={isEs ? "Opciones previstas" : "Planned options"}
          >
            {options.map((option) => (
              <span
                key={option}
                className="rounded-full border border-[#2E2A25]/12 bg-[#F4F1EA] px-3 py-1.5 text-xs font-bold text-[#514B44]"
              >
                {option}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5">
          <p className="flex items-start gap-2 rounded-2xl bg-[#E7FAF6] px-3.5 py-3 text-xs font-bold leading-5 text-[#24534D]">
            <Check size={15} className="mt-0.5 shrink-0 text-[#08796D]" />
            {isEs
              ? "Talla, color, precio y fecha se confirman antes de comprar."
              : "Size, color, price, and timing are confirmed before purchase."}
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-4 py-3 text-sm font-black text-[#17322E] transition hover:bg-[#20D9C5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08796D]"
            >
              <Plus size={16} />
              {isEs ? "Agregar a mi lista" : "Add to my list"}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackStoreAction("collection_whatsapp_click", { slug: product.slug })
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#2E2A25]/20 px-4 py-3 text-center text-sm font-black text-[#2E2A25] transition hover:border-[#08796D] hover:bg-[#E7FAF6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08796D]"
            >
              <MessageCircle size={16} />
              {isEs ? "Consultar" : "Ask us"}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
