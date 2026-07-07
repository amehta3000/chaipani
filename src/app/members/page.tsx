import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Avatar from "@/components/Avatar";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "APPROVED") redirect("/pending");

  const { q } = await searchParams;
  const query = (q || "").trim();

  const members = await db.user.findMany({
    where: {
      status: "APPROVED",
      id: { not: user.id },
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { area: { contains: query } },
              { city: { contains: query } },
              { origin: { contains: query } },
              { languages: { contains: query } },
              { interests: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold text-chai-dark">Our members 👥</h1>
      <p className="mt-2 text-xl opacity-80">
        Friendly faces near you. Say hello — everyone here loves a good chat.
      </p>

      <form className="mt-6 flex gap-3" action="/members">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, area, language or interest…"
          className="flex-1 rounded-2xl border-2 border-cream-dark bg-white px-5 py-3.5 text-lg focus:border-chai"
        />
        <button className="px-7 py-3.5 rounded-2xl bg-chai text-white text-lg font-semibold hover:bg-chai-dark">
          Search
        </button>
      </form>

      {members.length === 0 ? (
        <div className="mt-12 text-center bg-white rounded-3xl border border-cream-dark p-10">
          <p className="text-5xl" aria-hidden>🌱</p>
          <p className="mt-4 text-xl">
            {query
              ? "No members matched that search — try a different word."
              : "The community is just getting started. Invite a friend or family member to join!"}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 gap-5">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/members/${m.id}`}
              className="bg-white rounded-3xl border border-cream-dark shadow-sm p-6 flex gap-4 hover:border-chai transition"
            >
              <Avatar name={m.name} color={m.avatarColor} size={64} />
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{m.name}</p>
                <p className="text-base opacity-80">
                  {[m.area || m.city, m.origin && `from ${m.origin}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {m.interests && (
                  <p className="mt-1.5 text-base opacity-70 line-clamp-2">
                    {m.interests.split(",").slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
