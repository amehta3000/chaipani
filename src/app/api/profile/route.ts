import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const data = await req.json();
  const name = String(data.name ?? user.name).trim();
  if (!name) return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });

  const companionProfile = JSON.stringify({
    callMe: String(data.callMe || "").trim(),
    chatLanguage: String(data.chatLanguage || "English"),
    style: String(data.style || "cheerful"),
    hometown: String(data.hometown || "").trim(),
    aboutFamily: String(data.aboutFamily || "").trim(),
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: String(data.phone || "").trim() || null,
      city: String(data.city || "").trim() || null,
      area: String(data.area || "").trim() || null,
      ageRange: String(data.ageRange || "") || null,
      origin: String(data.origin || "") || null,
      languages: Array.isArray(data.languages) ? data.languages.join(", ") : null,
      faith: String(data.faith || "").trim() || null,
      interests: Array.isArray(data.interests) ? data.interests.join(", ") : null,
      bio: String(data.bio || "").trim() || null,
      helperName: String(data.helperName || "").trim() || null,
      helperEmail: String(data.helperEmail || "").trim() || null,
      helperPhone: String(data.helperPhone || "").trim() || null,
      companionProfile,
    },
  });

  return NextResponse.json({ ok: true });
}
