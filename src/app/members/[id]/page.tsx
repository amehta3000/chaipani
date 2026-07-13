import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Avatar from "@/components/Avatar";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "APPROVED") redirect("/pending");

  const { id } = await params;
  const member = await db.user.findUnique({ where: { id } });
  if (!member || member.status !== "APPROVED") notFound();

  const facts: [string, string | null][] = [
    ["📍 Area", [member.area, member.city].filter(Boolean).join(", ") || null],
    ["🌏 Family from", member.origin],
    ["🗣️ Speaks", member.languages],
    ["🕉️ Community", member.faith],
    ["🎂 Age group", member.ageRange],
  ];

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Link href="/members" className="text-lg text-chai-dark underline">
        ← Back to members
      </Link>

      <div className="mt-6 bg-white rounded-3xl border border-cream-dark shadow-sm p-8 text-center">
        <div className="flex justify-center">
          <Avatar name={member.name} color={member.avatarColor} size={96} />
        </div>
        <h1 className="mt-4 text-3xl font-bold">{member.name}</h1>
        {member.bio && <p className="mt-3 text-xl leading-relaxed">{member.bio}</p>}

        <div className="mt-6 text-left space-y-2.5">
          {facts.map(
            ([label, value]) =>
              value && (
                <p key={label} className="text-lg">
                  <span className="font-semibold">{label}:</span> {value}
                </p>
              )
          )}
          {member.interests && (
            <div className="pt-2">
              <p className="text-lg font-semibold">💛 Enjoys:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {member.interests.split(",").map((i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-2xl bg-cream border border-cream-dark text-base"
                  >
                    {i.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {member.id !== user.id && (
          <Link
            href={`/messages/${member.id}`}
            className="inline-block mt-8 px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark"
          >
            ✉️ Send {member.name.split(" ")[0]} a message
          </Link>
        )}
      </div>
    </div>
  );
}
