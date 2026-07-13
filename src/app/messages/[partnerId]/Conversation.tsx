"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; senderId: string; body: string; createdAt: string };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return time;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
}

export default function Conversation({
  partnerId,
  partnerName,
}: {
  partnerId: string;
  partnerName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [me, setMe] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${partnerId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMe(data.me);
      setMessages(data.messages);
    } catch {}
  }, [partnerId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 6000); // simple polling refresh
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (messages.length !== countRef.current) {
      countRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${partnerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setInput("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-col chat-fill"
      style={{ "--chat-offset": "240px" } as React.CSSProperties}
    >
      <div className="flex-1 py-6 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-center text-xl opacity-70 py-10">
            Start the conversation — say namaste to {partnerName}! 👋
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.senderId === me ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] px-5 py-3 rounded-3xl text-lg leading-relaxed whitespace-pre-wrap ${
                m.senderId === me
                  ? "bg-chai text-white rounded-br-lg"
                  : "bg-white border border-cream-dark rounded-bl-lg"
              }`}
            >
              {m.body}
            </div>
            <span className="mt-1 px-2 text-sm opacity-60">{formatWhen(m.createdAt)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-cream pt-2 pb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-3"
        >
          <input
            className="flex-1 min-w-0 rounded-2xl border-2 border-cream-dark bg-white px-5 py-4 text-lg focus:border-chai"
            size={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Write to ${partnerName}…`}
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
