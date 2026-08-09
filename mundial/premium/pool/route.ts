import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { MUNDIAL_PREMIUM_PRICE_USD } from "@/app/(page_routes)/mundial/constants";

type PremiumPaymentDoc = {
  playerKey?: string;
  playerName?: string;
  amountPaid?: number;
  paidAt?: Date | string | null;
  currency?: string;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET() {
  try {
    const db = await getDb();
    const payments = await db
      .collection<PremiumPaymentDoc>(COLLECTIONS.MUNDIAL_PREMIUM)
      .find({})
      .sort({ paidAt: -1 })
      .toArray();

    const paidPlayers = payments.length;
    const totalPool = payments.reduce((sum, payment) => {
      const amount = typeof payment.amountPaid === "number" && payment.amountPaid > 0
        ? payment.amountPaid
        : MUNDIAL_PREMIUM_PRICE_USD;
      return sum + amount;
    }, 0);

    return NextResponse.json({
      paidPlayers,
      totalPool,
      currency: "USD",
      price: MUNDIAL_PREMIUM_PRICE_USD,
      projectedPrize: totalPool,
      splitExamples: {
        oneWinner: totalPool,
        twoWinners: totalPool / 2,
        threeWinners: totalPool / 3,
        fiveWinners: totalPool / 5,
      },
      latestPayments: payments.slice(0, 5).map((payment) => ({
        playerKey: payment.playerKey ?? "",
        playerName: payment.playerName ?? payment.playerKey ?? "",
        paidAt: toIsoString(payment.paidAt),
      })),
    });
  } catch (error) {
    console.error("MUNDIAL PREMIUM pool error:", error);
    return NextResponse.json(
      {
        paidPlayers: 0,
        totalPool: 0,
        currency: "USD",
        price: MUNDIAL_PREMIUM_PRICE_USD,
        projectedPrize: 0,
        splitExamples: { oneWinner: 0, twoWinners: 0, threeWinners: 0, fiveWinners: 0 },
        latestPayments: [],
      },
      { status: 200 }
    );
  }
}
