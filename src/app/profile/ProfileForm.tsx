"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  ageRange: string;
  origin: string;
  languages: string[];
  faith: string;
  interests: string[];
  bio: string;
  helperName: string;
  helperEmail: string;
  helperPhone: string;
  callMe: string;
  chatLanguage: string;
  style: string;
  hometown: string;
  aboutFamily: string;
};

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

export default function ProfileForm({
  initial,
  status,
}: {
  initial: ProfileData;
  status: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ProfileData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "languages" | "interests", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-chai-dark">My profile 🙋</h1>
      <p className="mt-2 text-lg opacity-80">
        Signed in as <strong>{form.email}</strong>
        {status !== "APPROVED" && " · account awaiting approval"}
      </p>

      <div className="mt-6 bg-white rounded-3xl border border-cream-dark shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold">About me</h2>
        <label className={labelCls}>Full name</label>
        <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        <label className={labelCls}>Phone</label>
        <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Neighborhood / area</label>
            <input className={inputCls} value={form.area} onChange={(e) => set("area", e.target.value)} />
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
        <label className={labelCls}>Family from</label>
        <select className={inputCls} value={form.origin} onChange={(e) => set("origin", e.target.value)}>
          <option value="">Choose a region…</option>
          {ORIGINS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <label className={labelCls}>Languages</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip key={l} selected={form.languages.includes(l)} onClick={() => toggle("languages", l)}>
              {l}
            </Chip>
          ))}
        </div>
        <label className={labelCls}>Faith / community (optional)</label>
        <input className={inputCls} value={form.faith} onChange={(e) => set("faith", e.target.value)} />
        <label className={labelCls}>Interests</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <Chip key={i} selected={form.interests.includes(i)} onClick={() => toggle("interests", i)}>
              {i}
            </Chip>
          ))}
        </div>
        <label className={labelCls}>Introduction</label>
        <textarea className={inputCls} rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>

      <div className="mt-6 bg-white rounded-3xl border border-cream-dark shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold">Chai Companion settings ☕</h2>
        <label className={labelCls}>What the companion calls me</label>
        <input className={inputCls} value={form.callMe} onChange={(e) => set("callMe", e.target.value)} placeholder='e.g. "Ramesh bhai"' />
        <label className={labelCls}>Chat language</label>
        <div className="flex flex-wrap gap-2">
          {CHAT_LANGUAGES.map((l) => (
            <Chip key={l} selected={form.chatLanguage === l} onClick={() => set("chatLanguage", l)}>
              {l}
            </Chip>
          ))}
        </div>
        <label className={labelCls}>Personality</label>
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
        <label className={labelCls}>Where I grew up</label>
        <input className={inputCls} value={form.hometown} onChange={(e) => set("hometown", e.target.value)} />
        <label className={labelCls}>About my family (the companion remembers this)</label>
        <textarea className={inputCls} rows={2} value={form.aboutFamily} onChange={(e) => set("aboutFamily", e.target.value)} />
      </div>

      <div className="mt-6 bg-white rounded-3xl border border-cream-dark shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold">Family helper 💛</h2>
        <p className="mt-1 text-lg opacity-80">
          A son, daughter or relative who helps with this account.
        </p>
        <label className={labelCls}>Helper name</label>
        <input className={inputCls} value={form.helperName} onChange={(e) => set("helperName", e.target.value)} />
        <label className={labelCls}>Helper email</label>
        <input className={inputCls} value={form.helperEmail} onChange={(e) => set("helperEmail", e.target.value)} />
        <label className={labelCls}>Helper phone</label>
        <input className={inputCls} value={form.helperPhone} onChange={(e) => set("helperPhone", e.target.value)} />
      </div>

      {error && (
        <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-lg">{error}</p>
      )}
      {saved && (
        <p className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-lg">
          ✔️ Saved! Your changes are live.
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save my profile"}
        </button>
        <button
          onClick={logout}
          className="px-8 py-4 rounded-2xl border-2 border-cream-dark text-xl font-semibold hover:bg-cream-dark"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
