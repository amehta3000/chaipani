import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueLoginCode } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json(
      { error: "We couldn't find that email. Would you like to join instead?" },
      { status: 404 }
    );
  }

  const { sent, devCode } = await issueLoginCode(email);
  if (!sent && !devCode) {
    return NextResponse.json(
      { error: "We couldn't send the email just now. Please try again in a minute." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, devCode });
}
