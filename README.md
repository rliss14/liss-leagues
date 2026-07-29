# Liss Leagues — setup guide

This is the full source code for the "33 Point Pool" tracker. You don't need to
edit any code — just follow these steps once. It takes about 20-30 minutes.

## 1. Create the Supabase project (free tier)

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**. Name it `liss-leagues`, pick any region, set a database password (save it somewhere).
3. Once it's created, open the **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase/schema.sql` from this project, copy all of it, paste into the SQL editor, click **Run**.
   This creates all five tables (members, seasons, weekly_assignments, weekly_results, season_awards).
5. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key — you'll need both in step 3.

## 2. Push this code to GitHub

1. Go to https://github.com/new, create a new **private** repository named `liss-leagues`.
2. On your computer, download this whole project folder, then in a terminal inside the folder run:
   ```
   git init
   git add .
   git commit -m "Initial Liss Leagues build"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/liss-leagues.git
   git push -u origin main
   ```
   (If you don't have `git`/a terminal handy, GitHub also lets you drag-and-drop the folder's files
   into a new repo from the web UI at github.com/new — no command line needed.)

## 3. Connect Netlify

1. Go to https://app.netlify.com → **Add new site → Import an existing project**.
2. Choose GitHub, authorize, pick the `liss-leagues` repo.
3. Build settings should auto-fill from `netlify.toml` (build command `npm run build`, publish folder `dist`) — leave them as is.
4. Before deploying, click **Add environment variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL from step 1.5
   - `VITE_SUPABASE_ANON_KEY` = the anon public key from step 1.5
5. Click **Deploy site**. Netlify will build it (a few minutes) and give you a `*.netlify.app` URL.

## 4. Point lissleagues.com at it (Cloudflare)

Since Cloudflare DNS is already set up:
1. In Netlify, go to **Domain settings → Add a domain**, enter `lissleagues.com`.
2. Netlify will show you the target (usually a `apex-loadbalancer.netlify.com` or a Netlify subdomain to CNAME to).
3. In Cloudflare's DNS tab for lissleagues.com, point the root/`www` records at that target as Netlify instructs
   (Netlify's domain screen tells you exactly which record type and value to use).
4. Set Cloudflare's SSL/TLS mode to **Full** (not Flexible) so Netlify's own certificate is used correctly.

## 5. First-time data entry (in the live app)

Open the site → **Setup** tab, in this order:
1. **Members** — paste all 32 names, one per line.
2. **Seasons** — add each season (e.g. `2023-24`, start year `2023`). Mark the season currently being
   played as "current" and set its current week — that's what drives the Matchup Tracker and Live Tracker.
3. **Weekly Assignments** — pick the current (or a past) season, paste your week/member/team rows.
   Use ESPN's standard team abbreviations (KC, SF, DAL, BUF, etc.) so live scores match up correctly.
4. **Historical Results** — for past seasons only, paste in the full record book rows.
   Leave `result_type` blank for a normal week; use `hit33` for a real 33-hit, `week18_payout` for the
   week-18 closest-to-33 tie-break payout.

Everything else (Matchup Tracker, Live Season Tracker, Record Book, Season Awards, All-Time) reads from
what you enter here — no other manual aggregate entry needed.

## What's built vs. what's next

- ✅ NFL 33 Point Pool: Matchup Tracker, Live Season Tracker, Record Book, Season Awards, All-Time, Setup.
- ✅ Installable PWA (Add to Home Screen on iOS/Android; works offline for anything already loaded).
- ⏳ Golf pool (phase 2) — not built yet, by design, per your priority order. The Supabase schema and
  nav are structured so it can be added as a new set of tables + a new tab without touching the NFL pool.

## Notes on the ESPN data

- Uses `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` — free, no key, unofficial
  (ESPN could change or rate-limit it without notice; if scores stop loading, that's the first thing to check).
- The Live Season Tracker only counts a member's week once that week's game is **final** — in-progress
  games aren't counted yet, so the running total won't include a currently-live game until it ends.

## Local development (optional)

If you ever want to preview changes on your own machine before pushing to GitHub:
```
npm install
npm run dev
```
You'll need a `.env` file (copy `.env.example`) with your Supabase URL/key for this to work locally.
