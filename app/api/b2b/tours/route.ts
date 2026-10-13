import { NextRequest, NextResponse } from "next/server";
import { getOperatorFromRequest } from "@/lib/b2b-auth";
import { getB2BCatalog } from "@/lib/b2b-catalog";

export async function GET(req: NextRequest) {
  const operator = getOperatorFromRequest(req);
  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tours: rawTours, ivaRate } = await getB2BCatalog();

  const toursWithCommission = rawTours.map((tour) => ({
    ...tour,
    commissionRate: operator.commissionRate,
    commissionPerPax: Math.round(tour.retailPricePerPax * (operator.commissionRate / 100)),
    netPricePerPax: Math.round(
      tour.retailPricePerPax * (1 - operator.commissionRate / 100)
    ),
    ivaRate,
  }));

  return NextResponse.json({ tours: toursWithCommission });
}
