import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { PAYPAL_CURRENCY } from "@/lib/constants/paypal";

interface CreateBetOrderRequest {
  playerKey?: string;
  playerName?: string;
  betId?: string;
  betTitle?: string;
  pick?: unknown;
  price?: number;
}

export async function POST(req: Request) {
  try {
    const body: CreateBetOrderRequest = await req.json();
    const { playerKey, playerName, betId, betTitle, pick, price } = body;

    if (!playerKey || !betId || !price || pick === undefined) {
      return NextResponse.json({ success: false, message: "Faltan datos de la apuesta." }, { status: 400 });
    }

    if (price < 1 || price > 50) {
      return NextResponse.json({ success: false, message: "Precio de apuesta inválido." }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalApiBaseUrl();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: Number(price).toFixed(2),
          },
          description: `Quiniela Premium · ${betTitle ?? betId} — ${playerName ?? playerKey}`,
          custom_id: JSON.stringify({ playerKey, betId }).slice(0, 127),
        },
      ],
    };

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json() as { id?: string };

    if (!res.ok || !data.id) {
      return NextResponse.json({ success: false, message: "Error al crear la orden en PayPal." }, { status: 502 });
    }

    return NextResponse.json({ orderID: data.id });
  } catch (err) {
    console.error("MUNDIAL PREMIUM-BETS create-order error:", err);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
