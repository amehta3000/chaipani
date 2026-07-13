import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyLoginCode } from "@/lib/auth";
import { createSession, isAdminEmail } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const ok = await verifyLoginCode(email, code);
  if (!ok) {
    return NextResponse.json(
      { error: "That code didn't match or has expired. Please try again." },
      { status: 400 }
    );
  }

  let user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Admins (from ADMIN_EMAILS) are auto-approved and promoted on login.
  if (isAdminEmail(user.email) && (user.role !== "ADMIN" || user.status !== "APPROVED")) {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: "ADMIN", status: "APPROVED" },
    });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, status: user.status });
}
