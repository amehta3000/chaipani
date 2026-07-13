"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewButtons({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "APPROVED" | "DECLINED") {
    setBusy(true);
    try {
      await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, decision }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={() => decide("APPROVED")}
        disabled={busy}
        className="flex-1 px-6 py-3 rounded-2xl bg-cardamom text-white text-lg font-semibold hover:opacity-90 disabled:opacity-50"
      >
        ✔️ Approve
      </button>
      <button
        onClick={() => decide("DECLINED")}
        disabled={busy}
        className="px-6 py-3 rounded-2xl border-2 border-red-300 text-red-700 text-lg font-semibold hover:bg-red-50 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
