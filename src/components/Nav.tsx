"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type NavUser = {
  name: string;
  status: string;
  role: string;
  avatarColor: string;
} | null;

export default function Nav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = user
    ? [
        { href: "/companion", label: "☕ Chai Companion" },
        ...(user.status === "APPROVED"
          ? [
              { href: "/members", label: "👥 Members" },
              { href: "/messages", label: "✉️ Messages" },
            ]
          : []),
        { href: "/events", label: "📅 Meetups" },
        { href: "/profile", label: "🙋 My Profile" },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "🛡️ Admin" }] : []),
      ]
    : [
        { href: "/events", label: "📅 Meetups" },
        { href: "/login", label: "Sign in" },
      ];

  return (
    <header className="sticky top-0 z-50 bg-cream border-b-2 border-cream-dark">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-3xl" aria-hidden>☕</span>
          <span className="font-serif-display text-2xl font-bold text-chai-dark">
            ChaiPani
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-wrap justify-end">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-xl text-base font-medium hover:bg-cream-dark ${
                pathname === l.href ? "bg-cream-dark" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link
              href="/join"
              className="ml-2 px-5 py-2.5 rounded-xl bg-chai text-white font-semibold hover:bg-chai-dark"
            >
              Join us
            </Link>
          )}
          {user && (
            <span
              className="ml-2 w-11 h-11 rounded-full grid place-items-center text-white font-bold text-lg"
              style={{ backgroundColor: user.avatarColor }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-3xl px-3 py-1 rounded-xl border-2 border-cream-dark"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-cream-dark bg-cream px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-lg font-medium hover:bg-cream-dark"
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl bg-chai text-white text-lg font-semibold text-center"
            >
              Join us
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
