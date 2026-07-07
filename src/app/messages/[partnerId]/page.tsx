import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Conversation from "./Conversation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "APPROVED") redirect("/pending");

  const { partnerId } = await params;
  const partner = await db.user.findUnique({ where: { id: partnerId } });
  if (!partner || partner.status !== "APPROVED") notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="py-4 border-b border-cream-dark flex items-center gap-3">
        <Link href="/messages" className="text-lg text-chai-dark underline shrink-0">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold truncate">{partner.name}</h1>
      </div>
      <Conversation partnerId={partner.id} partnerName={partner.name.split(" ")[0]} />
    </div>
  );
}
