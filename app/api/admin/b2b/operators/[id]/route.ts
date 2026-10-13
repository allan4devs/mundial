import { NextRequest, NextResponse } from "next/server";
import { updateOperator, findOperatorById } from "@/lib/models/operator";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { sendApprovalEmail } from "@/lib/email/b2b-emails";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

const ALLOWED_STATUS = new Set(["pending", "approved", "active"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await findOperatorById(id);
    if (!existing) {
      return NextResponse.json({ error: "Operator not found." }, { status: 404 });
    }

    const body = await req.json();
    const allowed = ["status", "commissionRate", "name", "company"];
    const update: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if ("status" in update && !ALLOWED_STATUS.has(String(update.status))) {
      return NextResponse.json({ error: "Invalid operator status." }, { status: 400 });
    }

    await updateOperator(id, update);

    // Send approval email when status changes to approved or active
    const newStatus = update.status as string | undefined;
    const wasAlreadyApproved = existing.status === "approved" || existing.status === "active";
    if (
      (newStatus === "approved" || newStatus === "active") &&
      !wasAlreadyApproved
    ) {
      sendApprovalEmail(existing.email, existing.name).catch(console.error);
    }

    return NextResponse.json({ message: "Operator updated successfully." });
  } catch (err) {
    console.error("Admin update operator error:", err);
    return NextResponse.json({ error: "Failed to update operator." }, { status: 500 });
  }
}
