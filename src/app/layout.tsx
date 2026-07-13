import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/session";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ChaiPani — Good company for South Asian seniors",
  description:
    "A warm, safe community where South Asian seniors make friends, chat, and meet over chai. Built with families in mind.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav
          user={
            user
              ? {
                  name: user.name,
                  status: user.status,
                  role: user.role,
                  avatarColor: user.avatarColor,
                }
              : null
          }
        />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-16">
          {children}
        </main>
        <footer className="border-t border-cream-dark bg-cream-dark/50 py-8 text-center text-sm">
          <p className="font-serif-display text-lg">☕ ChaiPani</p>
          <p className="mt-1 opacity-70">
            Made with love for our elders. chaipanisocial.com · chaipaniseniors.com
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
