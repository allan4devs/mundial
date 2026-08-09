import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { PAYPAL_CURRENCY } from "@/lib/constants/paypal";

type CartItem = {
  betId?: string;
  betTitle?: string;
  pick?: unknown;
  price?: number;
};

type CreateCartOrderRequest = {
  playerKey?: string;
  playerName?: string;
  items?: CartItem[];
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
    const body: CreateCartOrderRequest = await req.json();
    const playerKey = String(body.playerKey ?? "").trim().toUpperCase();
    const items = cleanItems(body.items);

    if (!playerKey || !items.length) {
      return NextResponse.json({ success: false, message: "El carrito está vacío." }, { status: 400 });
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);
    if (total < 1 || total > 250) {
      return NextResponse.json({ success: false, message: "Total de carrito inválido." }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalApiBaseUrl();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: total.toFixed(2),
          },
          description: `Quiniela Premium · Cart extras (${items.length}) — ${body.playerName ?? playerKey}`,
          custom_id: JSON.stringify({ playerKey, count: items.length }).slice(0, 127),
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
      return NextResponse.json({ success: false, message: "Error al crear la orden del carrito." }, { status: 502 });
    }

    return NextResponse.json({ orderID: data.id, total });
  } catch (error) {
    console.error("MUNDIAL PREMIUM-BETS cart create-order error:", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
