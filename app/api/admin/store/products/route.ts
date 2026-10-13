import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import {
  createStoreProduct,
  readAllStoreProducts,
} from "@/lib/store/products";
import { getStoreSettings, upsertStoreSettings } from "@/lib/models/store-settings";

function isAuthorized(req: NextRequest) {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [products, settings] = await Promise.all([
      readAllStoreProducts(),
      getStoreSettings(),
    ]);
    return NextResponse.json({ products, settings });
  } catch (err) {
    console.error("GET /api/admin/store/products error:", err);
    return NextResponse.json({ error: "Failed to fetch store products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body?.type === "settings") {
      const settings = await upsertStoreSettings({
        shippingFeeUSD: body.shippingFeeUSD,
        freeShippingThresholdUSD: body.freeShippingThresholdUSD,
        currency: body.currency,
        whatsappPhone: body.whatsappPhone,
      });
      return NextResponse.json({ message: "Store settings updated.", settings });
    }

    const result = await createStoreProduct(body);
    if ("error" in result) {
      const message = result.error ?? "Invalid product payload";
      const status = message.includes("already exists") ? 409 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ message: "Product created." });
  } catch (err) {
    console.error("POST /api/admin/store/products error:", err);
    return NextResponse.json({ error: "Failed to create store product" }, { status: 500 });
  }
}