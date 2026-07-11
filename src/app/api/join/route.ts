import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueLoginCode } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/options";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  if (!name || !email.includes("@")) {
    return NextResponse.json(
      { error: "Name and a valid email are required." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "This email is already registered. Please sign in instead." },
      { status: 409 }
    );
  }

  const companionProfile = JSON.stringify({
    callMe: String(data.callMe || "").trim(),
    chatLanguage: String(data.chatLanguage || "English"),
    style: String(data.style || "cheerful"),
    hometown: String(data.hometown || "").trim(),
    aboutFamily: String(data.aboutFamily || "").trim(),
  });

  await db.user.create({
    data: {
      name,
      email,
      phone: String(data.phone || "").trim() || null,
      city: String(data.city || "").trim() || null,
      area: String(data.area || "").trim() || null,
      ageRange: String(data.ageRange || "") || null,
      origin: String(data.origin || "") || null,
      languages: Array.isArray(data.languages) ? data.languages.join(", ") : null,
      faith: String(data.faith || "").trim() || null,
      interests: Array.isArray(data.interests) ? data.interests.join(", ") : null,
      bio: String(data.bio || "").trim() || null,
      setUpByFamily: Boolean(data.setUpByFamily),
      helperName: String(data.helperName || "").trim() || null,
      helperEmail: String(data.helperEmail || "").trim() || null,
      helperPhone: String(data.helperPhone || "").trim() || null,
      companionProfile,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  });

  const { sent, devCode } = await issueLoginCode(email);
  if (!sent && !devCode) {
    // Account was created; the member can get a fresh code from /login.
    return NextResponse.json(
      {
        error:
          "Your account was created, but the code email didn't go through. Please use the sign-in page to request a new code.",
      },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, devCode });
}
