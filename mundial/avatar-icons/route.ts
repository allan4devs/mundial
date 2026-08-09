import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";

export const dynamic = "force-dynamic";

const AVATAR_ICONS_COLLECTION = "mundial_avatar_icons";

type AvatarIconDoc = {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  sourceUrl: string;
  provider: string;
  license: string;
  attribution: string;
  active: boolean;
  sortOrder: number;
};

export async function GET() {
  const db = await getDb();
  const icons = await db
    .collection<AvatarIconDoc>(AVATAR_ICONS_COLLECTION)
    .find(
      { active: true },
      {
        projection: {
          _id: 0,
          id: 1,
          name: 1,
          displayName: 1,
          country: 1,
          countryCode: 1,
          imageUrl: 1,
          sourceUrl: 1,
          provider: 1,
          license: 1,
          attribution: 1,
          sortOrder: 1,
        },
      }
    )
    .sort({ sortOrder: 1, name: 1 })
    .toArray();

  return NextResponse.json({ icons });
}
