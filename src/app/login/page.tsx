"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-2xl border-2 border-cream-dark bg-white px-4 py-3 text-lg focus:border-chai";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setDevCode(data.devCode ?? null);
      setSent(true);
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
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "That code didn't work.");
        return;
      }
      router.push(data.status === "APPROVED" ? "/companion" : "/pending");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-4xl font-bold text-chai-dark text-center">
        Welcome back ☕
      </h1>
      <p className="mt-3 text-xl text-center opacity-80">
        No password needed — we&apos;ll send a simple code to your email.
      </p>

      <div className="mt-8 bg-white rounded-3xl border border-cream-dark shadow-sm p-6 md:p-8">
        {!sent ? (
          <>
            <label className="block text-lg font-semibold mb-1">Your email</label>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              onKeyDown={(e) => e.key === "Enter" && requestCode()}
            />
            <button
              onClick={requestCode}
              disabled={busy || !email.includes("@")}
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send me a code"}
            </button>
          </>
        ) : (
          <>
            <p className="text-lg">
              We sent a 6-digit code to <strong>{email}</strong>.
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
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
            />
            <button
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark disabled:opacity-50"
            >
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button
              onClick={() => {
                setSent(false);
                setCode("");
              }}
              className="mt-3 w-full px-8 py-3 rounded-2xl border-2 border-cream-dark text-lg font-semibold hover:bg-cream"
            >
              Use a different email
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-lg">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-lg">
        New here?{" "}
        <Link href="/join" className="text-chai-dark font-semibold underline">
          Join ChaiPani
        </Link>
      </p>
    </div>
  );
}
