"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: string; content: string };

const STARTERS = [
  "Namaste! How are you today?",
  "Tell me a story from your childhood",
  "What shall I cook today?",
  "Let's talk about old film songs",
];

// BCP-47 tags for browser speech recognition / synthesis, keyed by the
// member's preferred chat language from onboarding.
const SPEECH_LANGS: Record<string, string> = {
  English: "en-IN",
  "Hinglish (Hindi + English mix)": "en-IN",
  Hindi: "hi-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-Guru-IN",
  Tamil: "ta-IN",
  Urdu: "ur-IN",
};

export default function CompanionChat({
  callMe,
  chatLanguage,
}: {
  callMe: string;
  chatLanguage: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const speechLang = SPEECH_LANGS[chatLanguage] || "en-IN";

  useEffect(() => {
    fetch("/api/companion")
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setMicSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    setVoiceSupported("speechSynthesis" in window);
    return () => {
      recRef.current?.stop?.();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleMic() {
    if (listening) {
      recRef.current?.stop?.();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = speechLang;
    rec.interimResults = true;
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    recRef.current?.stop?.();
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
    <div className="max-w-3xl mx-auto flex flex-col chat-fill">
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
              {m.content || <span className="opacity-60">☕ thinking…</span>}
              {m.role === "assistant" && m.content && voiceSupported && (
                <button
                  onClick={() => speak(m.content)}
                  className="block mt-2 text-base opacity-60 hover:opacity-100"
                  aria-label="Read this message aloud"
                  title="Read aloud"
                >
                  🔊 Listen
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-cream pt-2 pb-5">
        {listening && (
          <p className="text-center text-lg text-chai-dark font-semibold pb-2">
            🎤 Listening… speak now, then press Send
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 sm:gap-3"
        >
          {micSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Stop listening" : "Speak instead of typing"}
              title="Speak instead of typing"
              className={`shrink-0 w-14 rounded-2xl border-2 text-2xl transition ${
                listening
                  ? "bg-red-600 border-red-600 text-white animate-pulse"
                  : "bg-white border-cream-dark hover:border-chai"
              }`}
            >
              🎤
            </button>
          )}
          <input
            className="flex-1 min-w-0 rounded-2xl border-2 border-cream-dark bg-white px-5 py-4 text-lg focus:border-chai"
            size={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={micSupported ? "Type or press 🎤 to speak…" : "Type your message here…"}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-5 sm:px-7 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
