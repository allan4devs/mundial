// Server-only add-on pricing: quotes transport against the database.
// Keep client components importing from ./addons instead of this module.

import type { ReservationAddonDetails } from "./types";
import { isTransportConfigComplete, type TransportQuoteResult } from "./transport";
import { quoteTransportAddon } from "./transport-server";
import {
  AddonPricingError,
  buildAddonsBreakdown,
  type ResolvedAddonsPricing,
} from "./addons";

export async function resolveAddonsPricing(
  addonIds: readonly string[] | undefined | null,
  details: ReservationAddonDetails,
  pax: number,
): Promise<ResolvedAddonsPricing> {
  const ids = Array.isArray(addonIds)
    ? addonIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  let transportQuote: TransportQuoteResult | null = null;
  let transportPricePerPerson: number | undefined;

  if (ids.includes("transporte")) {
    if (!isTransportConfigComplete(details)) {
      throw new AddonPricingError("transporte", "incomplete_config", "Transport configuration is incomplete");
    }

    transportQuote = await quoteTransportAddon(details, pax);
    if (!transportQuote?.perPerson) {
      throw new AddonPricingError("transporte", "transport_quote_failed", "Could not quote transport route");
    }

    transportPricePerPerson = transportQuote.perPerson;
  }

  const breakdown = buildAddonsBreakdown(ids, details, { transportPricePerPerson });

  return {
    pricePerPerson: breakdown.reduce((sum, item) => sum + item.pricePerPerson, 0),
    breakdown,
    transportQuote,
  };
}
