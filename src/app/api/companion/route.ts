import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { buildCompanionSystemPrompt } from "@/lib/persona";

export const maxDuration = 60;

const HISTORY_LIMIT = 40;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { message } = await req.json();
  const text = String(message || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Empty message." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "That message is a bit too long." }, { status: 400 });
  }

  await db.companionMessage.create({
    data: { userId: user.id, role: "user", content: text },
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback =
      "Namaste! I am your Chai Companion, but the site owner has not connected me yet (missing ANTHROPIC_API_KEY). Please ask your family helper to finish the setup — then we can talk properly over chai! ☕";
    await db.companionMessage.create({
      data: { userId: user.id, role: "assistant", content: fallback },
    });
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Recent history (already includes the message just saved).
  const recent = await db.companionMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  const history = recent.reverse();

  // The Messages API requires the first message to be from the user.
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  const messages = history
    .slice(firstUserIdx)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const client = new Anthropic();
  const userId = user.id;

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: buildCompanionSystemPrompt(user),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !full.trim()) {
          const msg =
            "Hmm, I couldn't reply to that one. Shall we talk about something else? Tell me — how has your day been?";
          full = msg;
          controller.enqueue(encoder.encode(msg));
        }
      } catch (err) {
        console.error("Companion stream error:", err);
        const msg =
          "\n\nOh, the chai kettle hiccuped! Please send your message once more.";
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        if (full.trim()) {
          await db.companionMessage
            .create({ data: { userId, role: "assistant", content: full } })
            .catch((e) => console.error("Failed to save companion reply:", e));
        }
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  const recent = await db.companionMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return NextResponse.json({ messages: recent.reverse() });
}
