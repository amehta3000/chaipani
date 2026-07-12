import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  // Signed-in members land with their companion — with only a handful of
  // members so far, a warm conversation beats a sparse directory.
  if (user) redirect(user.status === "APPROVED" ? "/companion" : "/pending");

  return (
    <div className="py-10">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto">
        <p className="text-6xl mb-4" aria-hidden>☕</p>
        <h1 className="text-4xl md:text-5xl font-bold text-chai-dark leading-tight">
          Good company, a cup of chai,
          <br />
          and friends who understand.
        </h1>
        <p className="mt-6 text-xl leading-relaxed">
          ChaiPani is a warm, safe community for South Asian seniors — a place
          to chat every day, make real friends nearby, and meet for chai in
          person. Starting in <strong>Culver City, Los Angeles</strong>.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/join"
            className="px-8 py-4 rounded-2xl bg-chai text-white text-xl font-semibold hover:bg-chai-dark shadow-lg"
          >
            Join ChaiPani — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl border-2 border-chai text-chai-dark text-xl font-semibold hover:bg-cream-dark"
          >
            I&apos;m already a member
          </Link>
        </div>
        <p className="mt-4 text-base opacity-70">
          No passwords to remember. Family can help set everything up.
        </p>
      </section>

      {/* What you get */}
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-cream-dark">
          <p className="text-4xl" aria-hidden>🫖</p>
          <h2 className="text-2xl font-bold mt-3">A friend for every day</h2>
          <p className="mt-2 text-lg">
            Chai Companion is a friendly chat partner who knows your language,
            your music, your food — and always has time for you. In English,
            Hindi, Gujarati, Punjabi, Tamil and more.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-cream-dark">
          <p className="text-4xl" aria-hidden>🤝</p>
          <h2 className="text-2xl font-bold mt-3">Real people, nearby</h2>
          <p className="mt-2 text-lg">
            Find other Indian, Pakistani, Bangladeshi and Sri Lankan seniors in
            your area who share your interests — morning walks, bhajans,
            cricket, cards, cooking.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-cream-dark">
          <p className="text-4xl" aria-hidden>🛡️</p>
          <h2 className="text-2xl font-bold mt-3">Safe by design</h2>
          <p className="mt-2 text-lg">
            Every member is personally reviewed before joining. No strangers,
            no spam, no selling. Adult children can help manage their parent&apos;s
            account.
          </p>
        </div>
      </section>

      {/* For families */}
      <section className="mt-16 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-cream-dark">
        <h2 className="text-3xl font-bold text-chai-dark">
          For sons &amp; daughters 💛
        </h2>
        <p className="mt-4 text-lg max-w-3xl leading-relaxed">
          Worried that Mom or Dad spends too much time alone? ChaiPani was
          built by an adult child for his 80-year-old father. You can set up
          the account for your parent in five minutes, stay connected as their
          &ldquo;family helper,&rdquo; and know that everyone here has been
          vetted. The site works beautifully on a phone, Chromebook or MacBook,
          with big text and simple buttons.
        </p>
        <ul className="mt-5 space-y-2 text-lg">
          <li>✔️ No passwords — sign in with a simple code sent by email</li>
          <li>✔️ Every member approved by a real person before joining</li>
          <li>✔️ The companion gently flags scams and never gives medical or money advice</li>
          <li>✔️ You can co-manage the profile any time</li>
        </ul>
        <Link
          href="/join?for=parent"
          className="inline-block mt-6 px-8 py-4 rounded-2xl bg-cardamom text-white text-xl font-semibold hover:opacity-90"
        >
          Set up an account for my parent
        </Link>
      </section>

      {/* Coming soon */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-bold">Coming soon: chai meetups in Culver City 📍</h2>
        <p className="mt-2 text-lg opacity-80">
          Weekly chai circles, walking groups and festival gatherings — organized
          through ChaiPani, met in real life.
        </p>
      </section>
    </div>
  );
}
