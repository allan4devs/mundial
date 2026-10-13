"use client";

import { useEffect, useState } from "react";
import type { StoreProduct } from "@/lib/store/products";

export type StoreCatalogSettings = {
  shippingFeeUSD: number;
  freeShippingThresholdUSD: number;
  currency: "USD" | "CRC";
  whatsappPhone: string;
};

const DEFAULT_SETTINGS: StoreCatalogSettings = {
  shippingFeeUSD: 12,
  freeShippingThresholdUSD: 75,
  currency: "USD",
  whatsappPhone: "50662332535",
};

export function useStoreProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [settings, setSettings] = useState<StoreCatalogSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/store/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load store catalog");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data?.products) ? data.products : []);
        setSettings({
          shippingFeeUSD: Number(data?.settings?.shippingFeeUSD) || DEFAULT_SETTINGS.shippingFeeUSD,
          freeShippingThresholdUSD:
            Number(data?.settings?.freeShippingThresholdUSD) || DEFAULT_SETTINGS.freeShippingThresholdUSD,
          currency: data?.settings?.currency === "CRC" ? "CRC" : "USD",
          whatsappPhone: String(data?.settings?.whatsappPhone || DEFAULT_SETTINGS.whatsappPhone),
        });
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProducts([]);
        setError(err instanceof Error ? err.message : "Failed to load store catalog");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, settings, loading, error };
}