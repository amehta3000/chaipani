"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LANGUAGES,
  ORIGINS,
  INTERESTS,
  AGE_RANGES,
  CHAT_LANGUAGES,
  COMPANION_STYLES,
} from "@/lib/options";

const inputCls =
  "w-full rounded-2xl border-2 border-cream-dark bg-white px-4 py-3 text-lg focus:border-chai";
const labelCls = "block text-lg font-semibold mt-5 mb-1";

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl border-2 text-base font-medium transition ${
        selected
          ? "bg-chai text-white border-chai"
          : "bg-white border-cream-dark hover:border-chai"
      }`}
    >
      {children}
    </button>
  );
}

export default function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [form, setForm] = useState({
    setUpByFamily: params.get("for") === "parent",
    name: "",
    email: "",
    phone: "",
    city: "Los Angeles",
    area: "Culver City",
    ageRange: "",
    origin: "",
    languages: [] as string[],
    faith: "",
    interests: [] as string[],
    bio: "",
    helperName: "",
    helperEmail: "",
    helperPhone: "",
    callMe: "",
    chatLanguage: "English",
    style: "cheerful",
    hometown: "",
    aboutFamily: "",
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "languages" | "interests", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const totalSteps = form.setUpByFamily ? 6 : 5;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDevCode(data.devCode ?? null);
      setStep(totalSteps); // code entry screen
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "That code didn't work. Please try again.");
        return;
      }
      router.push("/pending");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const whoWord = form.setUpByFamily ? "your parent" : "you";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-chai-dark">
        Join ChaiPani ☕
      </h1>
      <p className="mt-2 text-lg opacity-80">
        Step {Math.min(step + 1, totalSteps)} of {totalSteps} — take your time,
        nothing is saved until the end.
      </p>
      <div className="mt-4 h-3 rounded-full bg-cream-dark overflow-hidden">
        <div
          className="h-full bg-chai transition-all"
          style={{ width: `${(Math.min(step + 1, totalSteps) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="mt-8 bg-white rounded-3xl border border-cream-dark shadow-sm p-6 md:p-8">
        {/* Step 0: who is joining */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold">Who is this account for?</h2>
            <div className="mt-5 grid gap-4">
              <button
                type="button"
                onClick={() => {
                  set("setUpByFamily", false);
                  setStep(1);
                }}
                className={`text-left p-5 rounded-2xl border-2 text-lg hover:border-chai ${
                  !form.setUpByFamily ? "border-chai bg-cream" : "border-cream-dark"
                }`}
              >
                <span className="text-2xl mr-2">🙋</span>
                <strong>For myself</strong>
                <p className="mt-1 opacity-80">I&apos;m joining to make friends and chat.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  set("setUpByFamily", true);
                  setStep(1);
                }}
                className={`text-left p-5 rounded-2xl border-2 text-lg hover:border-chai ${
                  form.setUpByFamily ? "border-chai bg-cream" : "border-cream-dark"
                }`}
              >
                <span className="text-2xl mr-2">💛</span>
                <strong>For my parent</strong>
                <p className="mt-1 opacity-80">
                  I&apos;m an adult child setting this up for Mom or Dad. I&apos;ll stay
                  connected as their family helper.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: basics */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold">
              {form.setUpByFamily ? "About your parent" : "About you"}
            </h2>
            <label className={labelCls}>
              {form.setUpByFamily ? "Parent's full name" : "Your full name"} *
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ramesh Mehta"
            />
            <label className={labelCls}>
              Email for signing in * <span className="font-normal opacity-70">(codes will be sent here — a family member&apos;s email is fine)</span>
            </label>
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
            />
            <label className={labelCls}>Phone (optional)</label>
            <input
              className={inputCls}
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(310) 555-0100"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Neighborhood / area</label>
                <input
                  className={inputCls}
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                />
              </div>
            </div>
            <label className={labelCls}>Age group</label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((a) => (
                <Chip key={a} selected={form.ageRange === a} onClick={() => set("ageRange", a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: background */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold">Roots &amp; languages</h2>
            <p className="mt-1 opacity-80 text-lg">
              This helps {whoWord} find friends who feel like home.
            </p>
            <label className={labelCls}>Where is the family from?</label>
            <select
              className={inputCls}
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
            >
              <option value="">Choose a region…</option>
              {ORIGINS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <label className={labelCls}>Languages spoken (pick all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip key={l} selected={form.languages.includes(l)} onClick={() => toggle("languages", l)}>
                  {l}
                </Chip>
              ))}
            </div>
            <label className={labelCls}>
              Faith / community (optional — only if {whoWord} would like to share)
            </label>
            <input
              className={inputCls}
              value={form.faith}
              onChange={(e) => set("faith", e.target.value)}
              placeholder="e.g. Hindu, Sikh, Muslim, Jain, Christian…"
            />
          </div>
        )}

        {/* Step 3: interests */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold">What does {whoWord} enjoy?</h2>
            <p className="mt-1 opacity-80 text-lg">Pick a few — this is how friendships start.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <Chip key={i} selected={form.interests.includes(i)} onClick={() => toggle("interests", i)}>
                  {i}
                </Chip>
              ))}
            </div>
            <label className={labelCls}>A few words of introduction (optional)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="e.g. Retired teacher from Ahmedabad, love morning walks and old Kishore Kumar songs."
            />
          </div>
        )}

        {/* Step 4: companion setup */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold">Meet the Chai Companion ☕</h2>
            <p className="mt-1 opacity-80 text-lg">
              A friendly chat partner, available any time of day. A few questions
              to make it feel just right.
            </p>
            <label className={labelCls}>What should the companion call {whoWord}?</label>
            <input
              className={inputCls}
              value={form.callMe}
              onChange={(e) => set("callMe", e.target.value)}
              placeholder='e.g. "Ramesh bhai", "Aunty ji", "Daddy-ji"'
            />
            <label className={labelCls}>Which language for chatting?</label>
            <div className="flex flex-wrap gap-2">
              {CHAT_LANGUAGES.map((l) => (
                <Chip key={l} selected={form.chatLanguage === l} onClick={() => set("chatLanguage", l)}>
                  {l}
                </Chip>
              ))}
            </div>
            <label className={labelCls}>What kind of company is nicest?</label>
            <div className="grid gap-3 mt-1">
              {COMPANION_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("style", s.value)}
                  className={`text-left px-5 py-4 rounded-2xl border-2 text-lg ${
                    form.style === s.value ? "border-chai bg-cream" : "border-cream-dark hover:border-chai"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className={labelCls}>Where did {whoWord} grow up? (optional)</label>
            <input
              className={inputCls}
              value={form.hometown}
              onChange={(e) => set("hometown", e.target.value)}
              placeholder="e.g. Rajkot, Gujarat"
            />
            <label className={labelCls}>
              Anything about family the companion should remember? (optional)
            </label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.aboutFamily}
              onChange={(e) => set("aboutFamily", e.target.value)}
              placeholder="e.g. Two grandchildren in Seattle, wife's name is Kokila."
            />
          </div>
        )}

        {/* Step 5 (family only): helper details */}
        {step === 5 && form.setUpByFamily && (
          <div>
            <h2 className="text-2xl font-bold">About you, the family helper 💛</h2>
            <p className="mt-1 opacity-80 text-lg">
              We&apos;ll keep you in the loop and you can help manage the account.
            </p>
            <label className={labelCls}>Your name</label>
            <input
              className={inputCls}
              value={form.helperName}
              onChange={(e) => set("helperName", e.target.value)}
            />
            <label className={labelCls}>Your email</label>
            <input
              className={inputCls}
              type="email"
              value={form.helperEmail}
              onChange={(e) => set("helperEmail", e.target.value)}
            />
            <label className={labelCls}>Your phone (optional)</label>
            <input
              className={inputCls}
              type="tel"
              value={form.helperPhone}
              onChange={(e) => set("helperPhone", e.target.value)}
            />
          </div>
        )}

        {/* Final: code verification */}
        {step === totalSteps && (
          <div>
            <h2 className="text-2xl font-bold">One last step ✉️</h2>
            <p className="mt-2 text-lg">
              We sent a 6-digit code to <strong>{form.email}</strong>. Enter it
              below to finish.
            </p>
            {devCode && (
              <p className="mt-3 p-3 rounded-xl bg-cream text-lg">
                🧪 Test mode — your code is <strong>{devCode}</strong>
              </p>
            )}
            <input
              className={`${inputCls} mt-5 text-center text-3xl tracking-[0.5em]`}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
            <button
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
            >
              {busy ? "Checking…" : "Finish joining"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-lg">
            {error}
          </p>
        )}

        {/* Navigation buttons */}
        {step > 0 && step < totalSteps && (
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-2xl border-2 border-cream-dark text-lg font-semibold hover:bg-cream"
            >
              ← Back
            </button>
            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!form.name.trim() || !form.email.includes("@"))) {
                    setError("Please fill in the name and a valid email.");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
                className="flex-1 px-6 py-3 rounded-2xl bg-chai text-white text-lg font-semibold hover:bg-chai-dark"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="flex-1 px-6 py-3 rounded-2xl bg-cardamom text-white text-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Creating account…" : "Create the account"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
