import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { buildCompanionSystemPrompt } from "@/lib/persona";

export const maxDuration = 60;

// Generous window: a daily chatter takes weeks to fill this, so the companion
// keeps remembering what it was told. (A distilled long-term memory is the
// eventual replacement.)
const HISTORY_LIMIT = 200;

// If the last exchange is older than this, the companion greets first on the
// next visit instead of waiting behind an empty input box.
const GREETING_AFTER_MS = 20 * 60 * 60 * 1000;

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

  const messages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  // The Messages API requires the first message to be from the user; history
  // can start with an assistant greeting (see GET), so pad rather than drop it.
  if (messages[0]?.role === "assistant") {
    messages.unshift({ role: "user", content: "[I just opened the chat.]" });
  }

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
  const messages = recent.reverse();

  // Speak first: on a first visit or after a day away, open with a personal
  // greeting rather than a blank box.
  const last = messages[messages.length - 1];
  const stale = !last || Date.now() - last.createdAt.getTime() > GREETING_AFTER_MS;
  if (stale && process.env.ANTHROPIC_API_KEY) {
    const greeting = await generateGreeting(user, messages).catch((err) => {
      console.error("Greeting generation failed:", err);
      return null;
    });
    if (greeting) {
      const saved = await db.companionMessage.create({
        data: { userId: user.id, role: "assistant", content: greeting },
      });
      messages.push(saved);
    }
  }

  return NextResponse.json({ messages });
}

async function generateGreeting(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  history: { role: string; content: string }[]
): Promise<string | null> {
  const client = new Anthropic();
  const firstEver = history.length === 0;
  const recentContext = history
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Them" : "You"}: ${m.content}`)
    .join("\n");

  const instruction = firstEver
    ? "[The member just opened the chat for the very first time. Introduce yourself warmly in one or two short sentences and ask one friendly, easy question to get talking. Reply with only the greeting.]"
    : `[The member is returning after some time away. Your recent conversation was:\n${recentContext}\n\nWelcome them back warmly in one or two short sentences — reference something from before if it feels natural — and ask one friendly question. Reply with only the greeting.]`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    system: buildCompanionSystemPrompt(user),
    messages: [{ role: "user", content: instruction }],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  return text && text.text.trim() ? text.text.trim() : null;
}
