import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "APPROVED") redirect("/members");

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <p className="text-6xl" aria-hidden>🙏</p>
      <h1 className="mt-4 text-4xl font-bold text-chai-dark">
        Welcome, {user.name.split(" ")[0]}!
      </h1>
      <p className="mt-4 text-xl leading-relaxed">
        Your account is being reviewed by our team — a real person checks every
        new member to keep ChaiPani safe and friendly. This usually takes less
        than a day.
      </p>

      <div className="mt-10 bg-white rounded-3xl border border-cream-dark shadow-sm p-8">
        <p className="text-4xl" aria-hidden>☕</p>
        <h2 className="mt-3 text-2xl font-bold">
          Meanwhile, your Chai Companion is ready!
        </h2>
        <p className="mt-2 text-lg">
          No need to wait — say hello and have your first chat right now.
        </p>
        <Link
          href="/companion"
          className="inline-block mt-5 px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark"
        >
          Start chatting →
        </Link>
      </div>
    </div>
  );
}
