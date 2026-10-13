import { ADDON_DATA } from "@/lib/reservation/addons";
import type { OrderDetails } from "@/lib/types/index";

export const RESERVATION_WHATSAPP_PHONE = "50662332535";

export type LocalPaymentMethod = "whatsapp" | "sinpe";

export function buildReservationReferenceCode(seed?: string): string {
  const base = seed ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const compact = base.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `LVA-${compact || "PENDING"}`;
}

function formatAddonLines(orderDetails: OrderDetails, lang: "es" | "en"): string {
  const ids = orderDetails.addonIds ?? [];
  if (ids.length === 0) return "";

  const isEs = lang === "es";
  const breakdown = new Map(
    (orderDetails.addonsBreakdown ?? []).map((item) => [item.id, item.pricePerPerson]),
  );

  const lines = ids.map((id) => {
    const addon = ADDON_DATA.find((item) => item.id === id);
    const label = addon ? (isEs ? addon.nameEs : addon.nameEn) : id;
    const price = breakdown.get(id);
    return price != null
      ? `• ${label} (+$${price}/${isEs ? "persona" : "person"})`
      : `• ${label}`;
  });

  return `\n${isEs ? "Extras:" : "Add-ons:"}\n${lines.join("\n")}`;
}

export function buildReservationWhatsAppMessage(
  orderDetails: OrderDetails,
  lang: "es" | "en",
  options?: {
    packageLabel?: string;
    timeLabel?: string;
    referenceCode?: string;
  },
): string {
  const isEs = lang === "es";
  const packageLabel = options?.packageLabel ?? orderDetails.tourPackage;
  const timeLabel = options?.timeLabel ?? orderDetails.tourTime;
  const guestLabel =
    orderDetails.tickets === 1
      ? isEs
        ? "1 persona"
        : "1 guest"
      : isEs
        ? `${orderDetails.tickets} personas`
        : `${orderDetails.tickets} guests`;

  const lines = [
    isEs
      ? "Hola La Vieja Adventures 👋 Quiero confirmar esta reserva:"
      : "Hi La Vieja Adventures 👋 I'd like to confirm this booking:",
    "",
    `🎫 ${orderDetails.tourName}`,
    `📅 ${orderDetails.date}`,
    `⏰ ${timeLabel}`,
    `📦 ${packageLabel} ($${orderDetails.packagePrice} USD/${isEs ? "persona" : "person"})`,
    `👥 ${guestLabel}`,
    `💵 ${isEs ? "Total" : "Total"}: $${orderDetails.total.toFixed(2)} USD`,
  ];

  const addonBlock = formatAddonLines(orderDetails, lang);
  if (addonBlock) lines.push(addonBlock.trim());

  if (orderDetails.specialRequests?.trim()) {
    lines.push(
      "",
      isEs ? "Notas:" : "Notes:",
      orderDetails.specialRequests.trim(),
    );
  }

  lines.push(
    "",
    `👤 ${orderDetails.name}`,
    `📧 ${orderDetails.email}`,
    `📱 ${orderDetails.phone}`,
  );

  if (options?.referenceCode) {
    lines.push(
      "",
      isEs
        ? `Referencia: ${options.referenceCode}`
        : `Reference: ${options.referenceCode}`,
    );
  }

  lines.push(
    "",
    isEs
      ? "¿Me confirman disponibilidad y forma de pago? ¡Pura vida!"
      : "Can you confirm availability and payment options? Thanks!",
  );

  return lines.join("\n");
}

export function buildReservationWhatsAppHref(
  orderDetails: OrderDetails,
  lang: "es" | "en",
  options?: {
    packageLabel?: string;
    timeLabel?: string;
    referenceCode?: string;
    phone?: string;
  },
): string {
  const message = encodeURIComponent(
    buildReservationWhatsAppMessage(orderDetails, lang, options),
  );
  const phone = options?.phone ?? RESERVATION_WHATSAPP_PHONE;
  return `https://wa.me/${phone}?text=${message}`;
}