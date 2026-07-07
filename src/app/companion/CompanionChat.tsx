"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: string; content: string };

const STARTERS = [
  "Namaste! How are you today?",
  "Tell me a story from your childhood",
  "What shall I cook today?",
  "Let's talk about old film songs",
];

export default function CompanionChat({ callMe }: { callMe: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/companion")
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: data.error || "Sorry, something went wrong. Please try again.",
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const snapshot = full;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "The connection dropped for a moment. Please try again.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>
      <div className="py-5 text-center border-b border-cream-dark">
        <h1 className="text-3xl font-bold text-chai-dark">☕ Chai Companion</h1>
        <p className="mt-1 text-lg opacity-80">
          Always happy to talk, {callMe} — day or night.
        </p>
      </div>

      <div className="flex-1 py-6 space-y-4 overflow-y-auto">
        {loaded && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-5xl" aria-hidden>🫖</p>
            <p className="mt-4 text-xl">
              Namaste, {callMe}! The chai is ready. What shall we talk about?
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-5 py-3 rounded-2xl bg-white border-2 border-cream-dark text-lg hover:border-chai"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-lg leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-chai text-white rounded-br-lg"
                  : "bg-white border border-cream-dark rounded-bl-lg"
              }`}
            >
              {m.content || (
                <span className="opacity-60">☕ thinking…</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-cream pt-2 pb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-3"
        >
          <input
            className="flex-1 min-w-0 rounded-2xl border-2 border-cream-dark bg-white px-5 py-4 text-lg focus:border-chai"
            size={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here…"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-7 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
