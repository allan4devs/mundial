import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { sendPremiumWelcomeEmail } from "@/lib/email/mundialPremiumEmail";

interface CaptureRequest {
  orderID?: string;
  playerKey?: string;
  playerName?: string;
  email?: string;
}

interface PayPalCaptureResponse {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }>;
    };
  }>;
  payer?: { email_address?: string };
}

export async function POST(req: Request) {
  try {
    const body: CaptureRequest = await req.json();
    const { orderID, playerKey, playerName, email } = body;

    if (!orderID || !playerKey) {
      return NextResponse.json({ success: false, message: "Faltan datos requeridos." }, { status: 400 });
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
    const amountPaid = Number(capture?.amount?.value ?? 0);
    const payerEmail = email || data.payer?.email_address || null;

    const db = await getDb();
    await db.collection(COLLECTIONS.MUNDIAL_PREMIUM).updateOne(
      { playerKey },
      {
        $set: {
          playerKey,
          playerName: playerName || playerKey,
          email: payerEmail,
          paypalOrderId: orderID,
          paypalCaptureId: captureId,
          amountPaid,
          currency: capture?.amount?.currency_code ?? "USD",
          payer: data.payer?.email_address ?? null,
          paidAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (payerEmail) {
      void sendPremiumWelcomeEmail({ to: payerEmail, playerName: playerName || playerKey });
    }

    return NextResponse.json({ captureID: captureId, status: data.status, orderID });
  } catch (err) {
    console.error("MUNDIAL PREMIUM capture-order error:", err);
    return NextResponse.json({ success: false, message: "Error al procesar el pago." }, { status: 500 });
  }
}
