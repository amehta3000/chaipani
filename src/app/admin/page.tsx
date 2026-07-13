import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ReviewButtons from "./ReviewButtons";
import Avatar from "@/components/Avatar";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const pending = await db.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  const counts = {
    approved: await db.user.count({ where: { status: "APPROVED" } }),
    pending: pending.length,
  };

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold text-chai-dark">Admin 🛡️</h1>
      <p className="mt-2 text-xl opacity-80">
        {counts.approved} approved member{counts.approved === 1 ? "" : "s"} ·{" "}
        {counts.pending} waiting for review
      </p>

      {pending.length === 0 ? (
        <div className="mt-10 bg-white rounded-3xl border border-cream-dark p-10 text-center">
          <p className="text-5xl" aria-hidden>✅</p>
          <p className="mt-4 text-xl">All caught up — no one is waiting.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {pending.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl border border-cream-dark shadow-sm p-6"
            >
              <div className="flex gap-4">
                <Avatar name={m.name} color={m.avatarColor} size={60} />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{m.name}</p>
                  <p className="text-base opacity-80">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                  <p className="text-base opacity-80">
                    {[m.area || m.city, m.origin, m.ageRange].filter(Boolean).join(" · ")}
                  </p>
                  {m.setUpByFamily && (
                    <p className="mt-1 text-base text-cardamom font-semibold">
                      💛 Set up by family: {m.helperName || "unnamed"}{" "}
                      {m.helperEmail && `(${m.helperEmail})`}
                    </p>
                  )}
                  {m.bio && <p className="mt-2 text-lg">{m.bio}</p>}
                  {m.interests && (
                    <p className="mt-1 text-base opacity-70">Enjoys: {m.interests}</p>
                  )}
                </div>
              </div>
              <ReviewButtons userId={m.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
