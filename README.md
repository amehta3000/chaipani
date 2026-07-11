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

## Deploying to Vercel

> Why Vercel? GitHub Pages only serves static files and can't run the API
> routes this app depends on (login codes, messaging, the streaming Chai
> Companion). Vercel runs Next.js server code natively and scales
> automatically — each request gets its own serverless function, so the site
> handles 10 members or 10,000 without configuration changes. The free Hobby
> tier is fine for launch.

### One-time setup

1. Go to [vercel.com](https://vercel.com) → **Sign up** → **Continue with
   GitHub** (use the account that owns this repo).
2. Click **Add New… → Project** and **Import** the `chaipani` repository.
   Vercel auto-detects Next.js — leave the build settings as they are
   (`npm run build` already generates the Prisma client, pushes the schema to
   Supabase, and builds the app).
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Supabase **Transaction pooler** string (port 6543) + `?pgbouncer=true` |
   | `DIRECT_URL` | Supabase **Session pooler** string (port 5432) |
   | `SESSION_SECRET` | a fresh long random string — `openssl rand -hex 32` |
   | `ANTHROPIC_API_KEY` | from [platform.claude.com](https://platform.claude.com) |
   | `ADMIN_EMAILS` | your email(s), comma-separated |
   | `SHOW_DEV_LOGIN_CODE` | `false` |

4. Click **Deploy**. In a minute or two you'll get a working
   `chaipani-xxxx.vercel.app` URL — test the full flow there first.

### Attaching the domains

1. In the Vercel project: **Settings → Domains → Add**.
2. Add `chaipanisocial.com` as the **primary** domain, and also add
   `www.chaipanisocial.com` (Vercel will offer to redirect www → apex).
3. Add `chaipaniseniors.com` and set it to **Redirect** to
   `chaipanisocial.com` (permanent 308) — both names work, one canonical site.
4. Vercel shows you the DNS records to set at your domain registrar: an `A`
   record (`76.76.21.21`) for each apex domain and a `CNAME`
   (`cname.vercel-dns.com`) for www. Add them where you bought the domains;
   propagation usually takes minutes. HTTPS certificates are automatic.

### After deploying

- Every `git push` to the main branch auto-deploys; pushes to other branches
  get preview URLs.
- **Email** — before inviting real members, replace the console-logging
  `sendCode()` in `src/lib/auth.ts` with a provider (Resend is ~20 lines);
  until then login codes only appear in Vercel's function logs.
- Enable daily backups in Supabase (Database → Backups) for peace of mind.

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
