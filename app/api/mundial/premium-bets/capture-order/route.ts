import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

interface CaptureBetRequest {
  orderID?: string;
  playerKey?: string;
  playerName?: string;
  betId?: string;
  betTitle?: string;
  pick?: unknown;
  price?: number;
}

interface PayPalCaptureResponse {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }>;
    };
  }>;
}

export async function POST(req: Request) {
  try {
    const body: CaptureBetRequest = await req.json();
    const { orderID, playerKey, playerName, betId, betTitle, pick, price } = body;

    if (!orderID || !playerKey || !betId) {
      return NextResponse.json({ success: false, message: "Faltan datos requeridos." }, { status: 400 });
    }

    // Prevent duplicate bets for the same betId
    const db = await getDb();
    const existing = await db.collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).findOne({ playerKey, betId });
    if (existing) {
      return NextResponse.json({ success: false, message: "Ya tenés una apuesta registrada para esta categoría." }, { status: 409 });
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
      return NextResponse.json({ success: false, message: "El pago no se completó.", status: data.status }, { status: 402 });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id;
    const amountPaid = Number(capture?.amount?.value ?? price ?? 0);

    await db.collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).insertOne({
      playerKey,
      playerName: playerName || playerKey,
      betId,
      betTitle: betTitle || betId,
      pick,
      amountPaid,
      currency: capture?.amount?.currency_code ?? "USD",
      paypalOrderId: orderID,
      paypalCaptureId: captureId,
      paidAt: new Date(),
      resolved: false,
      result: null,
    });

    return NextResponse.json({ captureID: captureId, status: data.status, orderID, betId });
  } catch (err) {
    console.error("MUNDIAL PREMIUM-BETS capture-order error:", err);
    return NextResponse.json({ success: false, message: "Error al procesar el pago." }, { status: 500 });
  }
}
