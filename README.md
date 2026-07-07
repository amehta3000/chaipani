# ☕ ChaiPani

A warm, safe community site for South Asian seniors — profiles, a vetted member
directory, member-to-member messaging, and a personalized AI "Chai Companion."
Built for chaipanisocial.com / chaipaniseniors.com, starting with the
Culver City, Los Angeles community.

## What's here (v1)

- **Landing page** written for both seniors and their adult children
- **Family-assisted signup** — seniors can join themselves, or an adult child
  can set up the account and stay linked as a "family helper"
- **Passwordless login** — a 6-digit code sent by email; no passwords to forget
- **Approval-required community** — new members are `PENDING` until an admin
  approves them; only approved members appear in the directory or can message
- **Member directory** — searchable by name, area, language, origin, interests;
  big cards, big text
- **1:1 messaging** between approved members (simple polling refresh)
- **Chai Companion** — a Claude-powered chat friend whose personality is tuned
  during onboarding (name to call the member, language — English / Hindi /
  Hinglish / Gujarati / Punjabi / Tamil / Urdu, personality style, hometown,
  family details). It keeps replies short and conversational, is respectful
  (aap/ji register), warns about scams, and never gives medical / financial
  advice. Pending members can use it immediately while awaiting approval.
- **Admin dashboard** at `/admin` for approving or declining new members
- **Meetups page** — a "coming soon" stub for the real-life events feature

The design is elder-first: 18px+ base font, 48px touch targets, high contrast,
simple navigation with icons and labels, mobile-first and comfortable on a
Chromebook or MacBook.

## Database: Supabase (Postgres)

The app uses Supabase's hosted Postgres via Prisma. One-time setup:

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in
   with GitHub (or email).
2. Create a **New project**: name it `chaipani`, choose the region closest to
   your users (e.g. **West US (North California)** for Los Angeles), and set a
   strong **database password** — save it somewhere safe, you'll need it in the
   connection strings.
3. Wait a minute or two for the project to provision.
4. Click the **Connect** button at the top of the project dashboard:
   - Copy the **Transaction pooler** string (port `6543`) → this is
     `DATABASE_URL`. Append `?pgbouncer=true` to the end.
   - Copy the **Session pooler** string (port `5432`) → this is `DIRECT_URL`.
   - In both, replace `[YOUR-PASSWORD]` with the password from step 2.
5. Put both values in `.env` (see `.env.example`), then create the tables:

   ```bash
   npx prisma db push
   ```

> Why two URLs? Serverless hosts (Vercel) open many short-lived connections, so
> the app talks to Postgres through Supabase's connection pooler (`6543`).
> Schema changes (`prisma db push`) need a session connection (`5432`).
> Both pooler strings work over IPv4, which Vercel requires — don't use the
> "Direct connection" string, which is IPv6-only on the free tier.

## Running locally

```bash
cp .env.example .env      # then fill in your Supabase URLs + secrets
npm install
npx prisma db push        # creates the tables in Supabase
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase **Transaction pooler** string (port 6543) + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase **Session pooler** string (port 5432), used for `prisma db push` |
| `SESSION_SECRET` | Signs login cookies. `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Powers the Chai Companion (get one at platform.claude.com). Without it the companion shows a friendly setup notice. |
| `ADMIN_EMAILS` | Comma-separated emails that get admin access automatically on login. |
| `SHOW_DEV_LOGIN_CODE` | `true` shows login codes in the UI (testing only — set to `false` in production). |

### Becoming admin

1. Put your email in `ADMIN_EMAILS` in `.env`
2. Join via `/join` (or `/login` if already registered)
3. On login you're auto-promoted to `ADMIN` + `APPROVED` and `/admin` appears in the nav

## Going to production

1. **Database** — already handled: the Supabase project from the setup above
   works for production as-is. For extra safety, enable daily backups in the
   Supabase dashboard (Database → Backups).
2. **Email** — replace the console-logging `sendCode()` in `src/lib/auth.ts`
   with a provider (Resend is ~20 lines). Set `SHOW_DEV_LOGIN_CODE=false`.
3. **Deploy** — Vercel works out of the box (`npm run build` pushes the schema
   and builds). Add all the environment variables from `.env` in the Vercel
   project settings, then point chaipanisocial.com and chaipaniseniors.com at
   the deployment.
4. Set a strong `SESSION_SECRET` and your `ANTHROPIC_API_KEY`.

## Roadmap ideas

- Real meetups/events with RSVP (the "meet in real life" core — next up)
- Photo uploads for profiles (needs object storage, e.g. Vercel Blob/S3)
- Email notifications for new messages and approvals (nudge via family helper)
- Weekly digest email to family helpers
- Voice input for the companion (many elders prefer speaking to typing)
- Hindi/Gujarati UI translation

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + Supabase
Postgres · Anthropic TypeScript SDK (streaming) · JWT session cookies (jose)
