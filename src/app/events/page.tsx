export default function EventsPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <p className="text-6xl" aria-hidden>📅</p>
      <h1 className="mt-4 text-4xl font-bold text-chai-dark">
        Meetups are brewing ☕
      </h1>
      <p className="mt-4 text-xl leading-relaxed">
        Very soon, ChaiPani members will gather in person — weekly chai
        circles, morning walking groups, and festival get-togethers, starting
        in <strong>Culver City, Los Angeles</strong>.
      </p>
      <div className="mt-10 bg-white rounded-3xl border border-cream-dark shadow-sm p-8 text-left">
        <h2 className="text-2xl font-bold">What&apos;s planned</h2>
        <ul className="mt-4 space-y-3 text-lg">
          <li>🫖 <strong>Sunday chai circle</strong> — chai, samosas and good conversation</li>
          <li>🚶 <strong>Morning walking group</strong> — gentle walks in the park</li>
          <li>🎶 <strong>Antakshari &amp; old film songs evening</strong></li>
          <li>🪔 <strong>Festival gatherings</strong> — Diwali, Eid, Vaisakhi, Pongal and more</li>
        </ul>
        <p className="mt-5 text-lg opacity-80">
          Our first chai circle kicks off once we reach our first 20 members —
          invite a friend and help us get there! Meanwhile, make friends in the
          members area and chat with your Chai Companion.
        </p>
      </div>
    </div>
  );
}
