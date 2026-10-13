import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { deleteStoreProduct, updateStoreProduct } from "@/lib/store/products";

function isAuthorized(req: NextRequest) {
  return Boolean(getAdminFromRequest(req));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await req.json();
    const result = await updateStoreProduct(slug, body);

    if ("error" in result) {
      const status = result.error === "Product not found." ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ message: "Product updated." });
  } catch (err) {
    console.error("PATCH /api/admin/store/products/[slug] error:", err);
    return NextResponse.json({ error: "Failed to update store product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const result = await deleteStoreProduct(slug);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deactivated." });
  } catch (err) {
    console.error("DELETE /api/admin/store/products/[slug] error:", err);
    return NextResponse.json({ error: "Failed to delete store product" }, { status: 500 });
  }
}