import type { Db } from "mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { getB2BSettings } from "@/lib/models/b2b-settings";
import { getPackageSchedule, isPackageAvailableOnDate } from "@/lib/tour-packages";
import {
  AddonPricingError,
  validateSelectedAddons,
} from "./addons";
import { resolveAddonsPricing } from "./addons-server";
import { getRemainingCapacityForTourDate } from "./capacity";
import { normalizeReservationDate } from "./dates";
import {
  getPackageLabel,
  resolveReservationPackage,
} from "./packages";
import { DEFAULT_DEPARTURE_TIMES } from "./constants";
import { getPackageDepartureTimes } from "./pricing";
import type { ReservationAddonDetails } from "./types";

export type ReservationQuoteInput = {
  bookingAttemptId?: string;
  name?: string;
  email?: string;
  phone?: string;
  tickets?: number | string;
  date?: string;
  dateIso?: string;
  tourTime?: string;
  packageId?: string;
  tourPackage?: string;
  tourSlug?: string;
  tourName?: string;
  addons?: string[];
  addonIds?: string[];
  addonDetails?: ReservationAddonDetails;
  specialRequests?: string;
  language?: string;
};

export type ReservationQuote = {
  normalizedDate: string;
  safeTickets: number;
  selectedPackage: NonNullable<ReturnType<typeof resolveReservationPackage>>;
  packageLabel: string;
  packagePrice: number;
  addonsPricePerPerson: number;
  addonsPrice: number;
  addonsBreakdown: Array<{ id: string; pricePerPerson: number }>;
  transportQuote: import("./transport").TransportQuoteResult | null;
  subtotal: number;
  totalWithTax: number;
  formattedTotal: string;
  ivaRatePercent: number;
  language: "es" | "en";
  remainingCapacity: number;
  tour: Record<string, unknown> | null;
};

export type ReservationQuoteErrorCode =
  | "invalid_tickets"
  | "invalid_contact"
  | "invalid_time"
  | "invalid_request"
  | "invalid_date"
  | "package_unavailable"
  | "package_schedule"
  | "capacity"
  | "addon_config"
  | "addon_pricing"
  | "total_mismatch";

export class ReservationQuoteError extends Error {
  status: number;
  code: ReservationQuoteErrorCode;
  details: Record<string, unknown>;

  constructor(code: ReservationQuoteErrorCode, message: string, status = 400, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ReservationQuoteError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isReservationQuoteError(error: unknown): error is ReservationQuoteError {
  return error instanceof ReservationQuoteError;
}

export function requiredReservationFieldsPresent(input: ReservationQuoteInput, options: { requireTourName?: boolean } = {}) {
  return Boolean(
    input.name &&
    input.email &&
    input.phone &&
    input.tickets &&
    input.date &&
    input.tourPackage &&
    (!options.requireTourName || input.tourName),
  );
}

export async function quoteReservation(db: Db, input: ReservationQuoteInput): Promise<ReservationQuote> {
  const safeTickets = Number(input.tickets);
  if (!Number.isInteger(safeTickets) || safeTickets < 1) {
    throw new ReservationQuoteError("invalid_tickets", "Invalid ticket quantity");
  }

  const normalizedName = String(input.name ?? "").trim();
  const normalizedEmail = String(input.email ?? "").trim();
  const normalizedPhoneDigits = String(input.phone ?? "").replace(/\D/g, "");
  if (
    normalizedName.length < 2 ||
    normalizedName.length > 120 ||
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedPhoneDigits.length < 6 ||
    normalizedPhoneDigits.length > 15
  ) {
    throw new ReservationQuoteError("invalid_contact", "Invalid traveler contact details");
  }

  if (typeof input.specialRequests === "string" && input.specialRequests.length > 2000) {
    throw new ReservationQuoteError("invalid_request", "Special requests are too long");
  }

  const normalizedDate = normalizeReservationDate(input.date, input.dateIso);
  if (!normalizedDate) {
    throw new ReservationQuoteError("invalid_date", "Invalid reservation date format", 400, {
      selectedDate: String(input.date ?? ""),
    });
  }

  const tour = input.tourSlug
    ? await db.collection(COLLECTIONS.TOURS).findOne({
        slug: input.tourSlug,
        isActive: { $ne: false },
      })
    : null;

  const selectedPackage = resolveReservationPackage({
    tour,
    tourSlug: input.tourSlug,
    packageId: input.packageId,
    tourPackage: input.tourPackage,
  });

  if (!selectedPackage) {
    throw new ReservationQuoteError("package_unavailable", "Selected package is no longer available", 400, {
      input: input.packageId || input.tourPackage,
      tourSlug: input.tourSlug,
    });
  }

  if (!isPackageAvailableOnDate(selectedPackage, normalizedDate)) {
    const schedule = getPackageSchedule(selectedPackage);
    const message = schedule === "weekday"
      ? "Selected package is only available on weekdays. Please choose a weekday date."
      : "Selected package is only available on weekends. Please choose a weekend date.";

    throw new ReservationQuoteError("package_schedule", message, 400, {
      selectedDate: normalizedDate,
      packageId: selectedPackage.id ?? null,
      packageSchedule: schedule,
    });
  }

  const selectedTime = String(input.tourTime ?? "").trim();
  const packageTimes = getPackageDepartureTimes(selectedPackage);
  const allowedTimes = packageTimes.length > 0 ? packageTimes : DEFAULT_DEPARTURE_TIMES;
  if (!selectedTime || !allowedTimes.includes(selectedTime)) {
    throw new ReservationQuoteError("invalid_time", "Selected departure time is not available", 400, {
      selectedTime,
      allowedTimes,
    });
  }

  const remainingCapacity = await getRemainingCapacityForTourDate({
    db,
    tourSlug: input.tourSlug,
    date: normalizedDate,
    excludeHoldId: input.bookingAttemptId,
  });

  if (safeTickets > remainingCapacity) {
    throw new ReservationQuoteError("capacity", "Not enough availability remains for this tour and date.", 400, {
      selectedDate: normalizedDate,
      tourSlug: input.tourSlug,
      requestedTickets: safeTickets,
      remainingCapacity,
    });
  }

  const settings = await getB2BSettings();
  const ivaRatePercent = Number(settings?.ivaRate ?? 13);
  const ivaRate = Number.isFinite(ivaRatePercent) ? ivaRatePercent / 100 : 0.13;
  const packagePrice = Number(selectedPackage.price);
  const addonIds = Array.isArray(input.addonIds) ? input.addonIds : [];
  const addonDetails = input.addonDetails ?? {};
  const language = input.language === "en" ? "en" : "es";

  const addonValidation = validateSelectedAddons(addonIds, addonDetails, language);
  if (!addonValidation.ok) {
    throw new ReservationQuoteError("addon_config", addonValidation.message, 400, {
      addonId: addonValidation.addonId,
    });
  }

  let addonsPricePerPerson = 0;
  let addonsBreakdown: Array<{ id: string; pricePerPerson: number }> = [];
  let transportQuote: ReservationQuote["transportQuote"] = null;

  if (addonIds.length > 0) {
    try {
      const resolvedAddons = await resolveAddonsPricing(addonIds, addonDetails, safeTickets);
      addonsPricePerPerson = resolvedAddons.pricePerPerson;
      addonsBreakdown = resolvedAddons.breakdown;
      transportQuote = resolvedAddons.transportQuote;
    } catch (error) {
      if (error instanceof AddonPricingError) {
        throw new ReservationQuoteError("addon_pricing", error.message, 400, {
          addonId: error.addonId,
          code: error.code,
        });
      }
      throw error;
    }
  }

  const subtotal = safeTickets * (packagePrice + addonsPricePerPerson);
  const totalWithTax = subtotal * (1 + ivaRate);

  return {
    normalizedDate,
    safeTickets,
    selectedPackage,
    packageLabel: getPackageLabel(input.tourPackage, selectedPackage, language),
    packagePrice,
    addonsPricePerPerson,
    addonsPrice: addonsPricePerPerson * safeTickets,
    addonsBreakdown,
    transportQuote,
    subtotal,
    totalWithTax,
    formattedTotal: totalWithTax.toFixed(2),
    ivaRatePercent: Number.isFinite(ivaRatePercent) ? ivaRatePercent : 13,
    language,
    remainingCapacity,
    tour,
  };
}
