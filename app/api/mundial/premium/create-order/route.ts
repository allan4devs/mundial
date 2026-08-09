import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { PAYPAL_CURRENCY } from "@/lib/constants/paypal";
import { MUNDIAL_PREMIUM_PRICE_USD } from "@/app/(page_routes)/mundial/constants";

interface CreatePremiumOrderRequest {
  playerKey?: string;
  playerName?: string;
}

export async function POST(req: Request) {
  try {
    const body: CreatePremiumOrderRequest = await req.json();
    const { playerKey, playerName } = body;

    if (!playerKey) {
      return NextResponse.json({ success: false, message: "Falta el nombre del jugador." }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalApiBaseUrl();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: MUNDIAL_PREMIUM_PRICE_USD.toFixed(2),
          },
          description: `Mundial Pronósticos Premium — ${playerName || playerKey}`,
          custom_id: JSON.stringify({ playerKey, playerName: playerName || playerKey }),
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
    console.error("MUNDIAL PREMIUM create-order error:", err);
    return NextResponse.json({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}
