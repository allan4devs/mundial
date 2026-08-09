import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

type CartItem = {
  betId?: string;
  betTitle?: string;
  pick?: unknown;
  price?: number;
};

type CaptureCartRequest = {
  orderID?: string;
  playerKey?: string;
  playerName?: string;
  items?: CartItem[];
};

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }>;
    };
  }>;
};

function cleanItems(items: CartItem[] | undefined) {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      betId: String(item.betId ?? "").trim(),
      betTitle: String(item.betTitle ?? "").trim(),
      pick: item.pick,
      price: Number(item.price ?? 0),
    }))
    .filter((item) => {
      if (!item.betId || item.pick === undefined || item.price < 1 || item.price > 50 || seen.has(item.betId)) return false;
      seen.add(item.betId);
      return true;
    });
}

export async function POST(req: Request) {
  try {
    const body: CaptureCartRequest = await req.json();
    const orderID = String(body.orderID ?? "").trim();
    const playerKey = String(body.playerKey ?? "").trim().toUpperCase();
    const items = cleanItems(body.items);

    if (!orderID || !playerKey || !items.length) {
      return NextResponse.json({ success: false, message: "Faltan datos del carrito." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS)
      .find({ playerKey, betId: { $in: items.map((item) => item.betId) } }, { projection: { _id: 0, betId: 1 } })
      .toArray();

    if (existing.length) {
      return NextResponse.json(
        { success: false, message: "Uno o más picks del carrito ya estaban registrados." },
        { status: 409 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalApiBaseUrl();

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data: PayPalCaptureResponse = await res.json();
    if (!res.ok || data.status !== "COMPLETED") {
      return NextResponse.json({ success: false, message: "El pago del carrito no se completó.", status: data.status }, { status: 402 });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id;
    const currency = capture?.amount?.currency_code ?? "USD";
    const paidAt = new Date();

    await db.collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).insertMany(
      items.map((item) => ({
        playerKey,
        playerName: body.playerName || playerKey,
        betId: item.betId,
        betTitle: item.betTitle || item.betId,
        pick: item.pick,
        amountPaid: item.price,
        currency,
        paypalOrderId: orderID,
        paypalCaptureId: captureId,
        paidAt,
        resolved: false,
        result: null,
      }))
    );

    return NextResponse.json({ captureID: captureId, status: data.status, orderID, count: items.length });
  } catch (error) {
    console.error("MUNDIAL PREMIUM-BETS cart capture-order error:", error);
    return NextResponse.json({ success: false, message: "Error al procesar el carrito." }, { status: 500 });
  }
}
