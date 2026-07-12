import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyNewMessage } from "@/lib/notify";

async function requireApproved() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (user.status !== "APPROVED")
    return {
      error: NextResponse.json(
        { error: "Messaging opens once your account is approved." },
        { status: 403 }
      ),
    };
  return { user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { user, error } = await requireApproved();
  if (error) return error;
  const { partnerId } = await params;

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // Mark incoming messages as read.
  await db.message.updateMany({
    where: { senderId: partnerId, receiverId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages, me: user.id });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { user, error } = await requireApproved();
  if (error) return error;
  const { partnerId } = await params;

  const partner = await db.user.findUnique({ where: { id: partnerId } });
  if (!partner || partner.status !== "APPROVED") {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const { body } = await req.json();
  const text = String(body || "").trim();
  if (!text) return NextResponse.json({ error: "Empty message." }, { status: 400 });
  if (text.length > 2000)
    return NextResponse.json({ error: "Message too long." }, { status: 400 });

  // Email the receiver only when this starts a fresh pile of unread messages —
  // during a live back-and-forth (or a burst) they get a single email, and the
  // next one only after they've read these.
  const unreadBefore = await db.message.count({
    where: { senderId: user.id, receiverId: partnerId, readAt: null },
  });

  const message = await db.message.create({
    data: { senderId: user.id, receiverId: partnerId, body: text },
  });

  if (unreadBefore === 0) {
    await notifyNewMessage({
      toEmail: partner.email,
      toFirstName: partner.name.split(" ")[0],
      senderName: user.name,
      senderId: user.id,
    }).catch((e) => console.error("Message notification failed:", e));
  }

  return NextResponse.json({ message });
}
