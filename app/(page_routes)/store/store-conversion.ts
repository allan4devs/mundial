import type { Product } from "./store-data";

type CartLine = Product & {
  quantity: number;
  lineTotal: number;
};

export function getStoreOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function productStoreUrl(slug: string) {
  const origin = getStoreOrigin();
  return origin ? `${origin}/store#product-${slug}` : `/store#product-${slug}`;
}

export function filterProductsByQuery(products: Product[], query: string, lang: "es" | "en") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products;

  return products.filter((product) => {
    const haystack = [
      product.name[lang],
      product.name.es,
      product.name.en,
      product.description[lang],
      product.useCase[lang],
      product.tag[lang],
      product.brand ?? "",
      ...product.optionsEs,
      ...product.optionsEn,
      product.slug,
      product.category,
    ]
      .join(" ")
      .toLowerCase();

    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}

export function buildCartWhatsAppHref(
  cartDetails: CartLine[],
  _total: number,
  lang: "es" | "en",
  phone: string,
) {
  const isEs = lang === "es";
  const lines = cartDetails.map((item) => `• ${item.name[lang]} x${item.quantity}`).join("\n");
  const storeLink = getStoreOrigin() ? `${getStoreOrigin()}/store` : "/store";
  const message = encodeURIComponent(
    `${
      isEs
        ? "Hola La Vieja Adventures 👋 Quiero consultar estas opciones de la colección outdoor:"
        : "Hi La Vieja Adventures 👋 I'd like to ask about these outdoor collection options:"
    }\n\n${lines}\n\n${
      isEs ? "Catálogo" : "Catalog"
    }: ${storeLink}\n\n${
      isEs
        ? "¿Me confirman opciones de talla y color, precio, disponibilidad y fecha? Entiendo que esta lista no reserva ni genera un cobro. ¡Pura vida!"
        : "Can you confirm size and color options, price, availability, and timing? I understand this list does not reserve anything or create a charge. Thanks!"
    }`,
  );
  return `https://wa.me/${phone}?text=${message}`;
}

export function buildSingleProductWhatsAppHref(
  product: Product,
  lang: "es" | "en",
  phone: string,
  quantity = 1,
) {
  const isEs = lang === "es";
  const message = encodeURIComponent(
    `${
      isEs
        ? "Hola La Vieja Adventures 👋 Me interesa esta familia de la colección outdoor:"
        : "Hi La Vieja Adventures 👋 I'm interested in this outdoor collection family:"
    }\n\n• ${product.name[lang]} x${quantity}\n${
      isEs ? "Ver en tienda" : "View in store"
    }: ${productStoreUrl(product.slug)}\n\n${
      isEs
        ? "¿Qué estilos, tallas, colores, precio y fecha están confirmados?"
        : "Which styles, sizes, colors, price, and timing are confirmed?"
    }`,
  );
  return `https://wa.me/${phone}?text=${message}`;
}

export function trackStoreAction(action: string, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  void import("@/lib/analytics/client").then(({ trackAnalyticsEvent }) => {
    trackAnalyticsEvent("click", {
      path: "/store",
      metadata: { surface: "store", action, ...metadata },
    });
  });
}
