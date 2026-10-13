import type { OrderDetails } from "@/lib/types/index";
import { PHONE_COUNTRIES } from "@/app/components/reservation/phoneCountries";

const DEFAULT_BUYER_COUNTRY = "CR";

export function getBuyerCountryFromPhone(phone: string) {
  const normalizedPhone = phone.trim().replace(/[^\d+]/g, "");
  if (!normalizedPhone.startsWith("+")) return DEFAULT_BUYER_COUNTRY;

  const matchingCountry = PHONE_COUNTRIES
    .filter((country) => normalizedPhone.startsWith(country.code))
    .sort((a, b) => b.code.length - a.code.length)[0];

  return matchingCountry?.flag ?? DEFAULT_BUYER_COUNTRY;
}

export function buildCheckoutKey(orderDetails: OrderDetails, lang: string) {
  return [
    orderDetails.name,
    orderDetails.email,
    orderDetails.phone,
    orderDetails.tickets,
    orderDetails.total,
    orderDetails.dateIso ?? orderDetails.date,
    orderDetails.tourTime,
    orderDetails.packageId,
    orderDetails.tourPackage,
    orderDetails.tourSlug,
    orderDetails.tourName,
    orderDetails.packagePrice,
    (orderDetails.addonIds ?? []).join(","),
    JSON.stringify(orderDetails.addonDetails ?? {}),
    orderDetails.specialRequests ?? "",
    lang,
  ].join("|");
}

export function buildBookingAnalyticsMetadata(orderDetails: OrderDetails, lang: string) {
  return {
    tickets: orderDetails.tickets,
    date: orderDetails.dateIso ?? orderDetails.date,
    tourTime: orderDetails.tourTime,
    packageId: orderDetails.packageId,
    tourPackage: orderDetails.tourPackage,
    tourSlug: orderDetails.tourSlug,
    tourName: orderDetails.tourName,
    packagePrice: orderDetails.packagePrice,
    addons: orderDetails.addons,
    addonIds: orderDetails.addonIds,
    addonDetails: orderDetails.addonDetails,
    specialRequests: orderDetails.specialRequests,
    amount: orderDetails.total,
    currency: "USD",
    language: lang,
  };
}
