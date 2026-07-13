import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Avatar from "@/components/Avatar";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "APPROVED") redirect("/pending");

  const recent = await db.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { sender: true, receiver: true },
    take: 200,
  });

  // Group into conversations by partner, keeping the latest message per partner.
  const seen = new Map<
    string,
    { partner: { id: string; name: string; avatarColor: string }; last: string; unread: boolean; at: Date }
  >();
  for (const m of recent) {
    const partner = m.senderId === user.id ? m.receiver : m.sender;
    if (!seen.has(partner.id)) {
      seen.set(partner.id, {
        partner: { id: partner.id, name: partner.name, avatarColor: partner.avatarColor },
        last: m.body,
        unread: m.receiverId === user.id && !m.readAt,
        at: m.createdAt,
      });
    }
  }
  const conversations = [...seen.values()];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-chai-dark">Messages ✉️</h1>

      {conversations.length === 0 ? (
        <div className="mt-10 text-center bg-white rounded-3xl border border-cream-dark p-10">
          <p className="text-5xl" aria-hidden>💌</p>
          <p className="mt-4 text-xl">
            No conversations yet. Find someone friendly in the members list and
            say namaste!
          </p>
          <Link
            href="/members"
            className="inline-block mt-6 px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark"
          >
            Browse members
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {conversations.map((c) => (
            <Link
              key={c.partner.id}
              href={`/messages/${c.partner.id}`}
              className="flex items-center gap-4 bg-white rounded-3xl border border-cream-dark shadow-sm p-5 hover:border-chai transition"
            >
              <Avatar name={c.partner.name} color={c.partner.avatarColor} size={60} />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold flex items-center gap-2">
                  {c.partner.name}
                  {c.unread && (
                    <span className="w-3.5 h-3.5 rounded-full bg-chai inline-block" aria-label="new message" />
                  )}
                </p>
                <p className="text-lg opacity-70 truncate">{c.last}</p>
              </div>
              <span className="text-2xl opacity-40" aria-hidden>›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
