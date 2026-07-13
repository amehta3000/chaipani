import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyApproved } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { userId, decision } = await req.json();
  if (!userId || !["APPROVED", "DECLINED"].includes(decision)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const member = await db.user.update({
    where: { id: String(userId) },
    data: { status: decision },
  });

  if (decision === "APPROVED") {
    await notifyApproved(member).catch((e) =>
      console.error("Approval notification failed:", e)
    );
  }

  return NextResponse.json({ ok: true });
}
