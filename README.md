# 🍅 Cozy Flow

An aesthetic Pomodoro timer with cozy scenes, ambient sounds, task-linked sessions, streaks, heatmaps, a leaderboard, and a Pro tier paid through Razorpay.

**Live:** https://cozyflow.vercel.app

## Features

**Timer**
- Focus, short break and long break with any length from 1 to 180 minutes (presets plus a custom box)
- Auto-start options, browser notifications, countdown in the tab title
- Four synthesized alarm sounds (no audio files)

**Focus tools**
- Tasks with a "focus on this task" button; finished pomodoros are counted per task
- Ambient mixer: rain, forest, fire, plus generated brown and white noise, each with its own volume
- Exam and deadline countdowns

**Progress**
- Streaks that reset correctly (local-time dates, derived from history)
- Weekly chart, 16-week heatmap, focus time totals
- Shareable streak card rendered on a canvas (native share on phones, copy/download on desktop)
- Opt-in weekly and all-time leaderboard

**Make it yours**
- 9 aesthetic scenes (falling petals, fireplace embers, stars and more), light and dark
- 5 font styles and 7 accent colors, all self-hosted
- `/embed` page: a timer-only view for Notion or a second screen (`/embed?scene=sakura&theme=dark`)

**Business**
- Supabase auth (email magic link, Google) with merge-based cloud sync
- Freemium with Razorpay one-time payments (monthly, yearly, lifetime), verified server-side
- Sponsor system: break-screen sponsor cards with impression and click tracking, and a public `/sponsor` page with live stats

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| State | Zustand with `persist` (versioned migrations) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Server code | Vercel Serverless Functions in `api/` |
| Payments | Razorpay Orders API |
| Testing | Vitest and Testing Library |

## Getting started

```bash
npm install
npm run dev        # http://localhost:8080
```

With no environment variables the app runs fully local: no sign-in, no sync, no payments.

### 1. Supabase (sign-in, sync, leaderboard, sponsors)

1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and run it. It is safe to run again.
3. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API Keys).
4. Under **Authentication → URL Configuration**, add your site URL and redirect URLs (for example `http://localhost:8080` and `http://localhost:3000`).
5. Optional: enable the Google provider.

### 2. Payments (Razorpay)

1. Create a Razorpay account and generate **test** keys in Test Mode.
2. Add to `.env` (server values are never prefixed with `VITE_`):

   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
3. Run with the Vercel CLI so the `/api` routes work:

   ```bash
   npx vercel dev     # http://localhost:3000
   ```
4. Pay with UPI ID `success@razorpay` or a Razorpay test card. See Razorpay's test docs for current values.

#### Webhook (so payments activate even if the buyer closes the tab)

1. Deploy first: Razorpay cannot reach `localhost`.
2. In the Razorpay dashboard go to **Settings → Webhooks → Add**, set the URL to `https://YOUR-DOMAIN/api/razorpay-webhook`, choose a secret, and enable only the **`order.paid`** event.
3. Put the same secret in Vercel as `RAZORPAY_WEBHOOK_SECRET` and redeploy.

The webhook and the browser verification call the same atomic database function, so whichever arrives first wins and the other is a harmless no-op.

### 3. Legal pages

`/privacy`, `/terms`, `/refund` and `/contact` read your details from `VITE_OWNER_NAME`, `VITE_CONTACT_EMAIL` and `VITE_OWNER_CITY`. Set them before going live; Razorpay requires these pages during account activation. The policy wording is a starting point: review it, adjust it to your situation and have it checked by someone qualified.

### 4. Sponsors

Add a row to the `sponsors` table from the Supabase dashboard (name, tagline, URL, emoji). It appears on break screens. The bottom of `schema.sql` has a monthly report query for impressions, clicks and click rate.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm test` | Run the test suite |
| `npm run lint` | ESLint |

## Project structure

```
api/                     Vercel functions: create-order, verify-payment, razorpay-webhook
supabase/schema.sql      Tables, Row Level Security, grants, leaderboard and stats functions
src/
  pages/                 Landing, app (Index), Sponsor, Embed, Legal (privacy, terms, refund, contact)
  components/            Timer, panels, dialogs, scenes, particles
  store/                 useStore (app state), useProStore (Pro status)
  lib/                   sync merge, scenes, chimes, share card, leaderboard, plans
  hooks/                 cloud sync, appearance
  test/                  streak, sync merge, payments, render smoke tests
```

## How it works

**Sync.** Each user's settings, stats, tasks and countdowns are stored as one JSON document in `user_data`, protected by Row Level Security. On sign-in the app merges cloud and local data (higher value per day, union of tasks) instead of overwriting, then pushes changes 1.5 seconds after they stop.

**Payments.** The server creates the order with the price fixed in `api/_shared.ts`, so the browser cannot change the amount. After checkout, `verify-payment` checks Razorpay's HMAC signature, reads the order back from Razorpay, confirms the user and amount, and records the payment. The order id is the primary key of `payments`, so a replay cannot grant Pro twice. Recording the payment and granting Pro happen in one SQL transaction (`apply_payment`), so a failure can never leave a payment recorded without Pro. Only the server (service role) can call it or write `subscriptions`.

**Leaderboard.** Users opt in with a display name. A `security definer` SQL function returns only display name and minutes for opted-in users. Daily minutes are capped at 16 hours.

**Dates and streaks.** Dates use local time, and the streak is derived from the stored history, so it breaks correctly after a missed day.

## Tests

`npm test` runs 42 tests covering streak logic, sync merging, the payment API and webhook (valid payment, replay, stacking, forged or tampered signatures, wrong user, unpaid or short-paid orders, price tampering, retry after a database failure), and render checks for every page, legal page and scene. The SQL functions were also exercised against a local Postgres.

## Known limitations

- Leaderboard minutes come from each user's synced stats, so a determined user could inflate theirs. Recording sessions on the server would fix this.
- Pro access is checked in the browser for interface gating, which is fine for local-first features but not for server-side ones.
- The Razorpay webhook needs a deployed URL, so test it after your first deploy.
- Sponsor impressions are counted from the browser and can be inflated.

## Deploying

Import the repo into Vercel (the Vite preset works), add all environment variables from `.env.example`, and use live Razorpay keys only after your account is activated. `vercel.json` rewrites every non-API path to the app so `/app`, `/sponsor` and `/embed` work on refresh.
