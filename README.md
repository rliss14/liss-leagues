# Liss Leagues — setup guide

This is the full source code for the "33 Point Pool" tracker. You don't need to
edit any code — just follow these steps once. It takes about 20-30 minutes.

## 1. Create the Supabase project (free tier)

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**. Name it `liss-leagues`, pick any region, set a database password (save it somewhere).
3. Once it's created, open the **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase/schema.sql` from this project, copy all of it, paste into the SQL editor, click **Run**.
   This creates all five tables (members, seasons, weekly_assignments, weekly_results, season_awards).
   Then open a **new query**, paste in `supabase/migration-02.sql`, and Run that too — it adds the
   `team_won_game` and `home_away` columns the Record Book splits need. (If you already ran schema.sql
   on an earlier setup, you only need migration-02. It's safe to run on existing data — it only adds columns.)
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
   - `VITE_SETUP_PASSCODE` = any passcode you like, for the Setup screen
5. Click **Deploy site**. Netlify will build it (a few minutes) and give you a `*.netlify.app` URL.

## 4. Point lissleagues.com at it (Cloudflare)

Since Cloudflare DNS is already set up:
1. In Netlify, go to **Domain settings → Add a domain**, enter `lissleagues.com`.
2. Netlify will show you the target (usually a `apex-loadbalancer.netlify.com` or a Netlify subdomain to CNAME to).
3. In Cloudflare's DNS tab for lissleagues.com, point the root/`www` records at that target as Netlify instructs
   (Netlify's domain screen tells you exactly which record type and value to use).
4. Set Cloudflare's SSL/TLS mode to **Full** (not Flexible) so Netlify's own certificate is used correctly.

## 5. First-time data entry (in the live app)

Open the site → NFL33 → **Setup** tab, in this order:
1. **Members** — paste all 32 names, one per line.
2. **Seasons** — add each season (e.g. `2023-24`, start year `2023`). Mark the season currently being
   played as "current" and set its current week — that's what drives the Matchup Tracker and Live Tracker.
3. **Weekly Assignments** — pick the current (or a past) season, paste your week/member/team rows.
   Team codes (ESPN's form): ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR
   LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN **WSH**.
   Note Washington is WSH, not WAS. Common variants (WAS, OAK, SD, JAC, LA, STL) are converted
   automatically, and anything unrecognized is rejected before saving rather than saved silently.
4. **Historical Results** — for past seasons only, paste in the full result rows. Columns are now:
   `week, member_name, team_abbr, opponent_abbr, score, team_won_game, home_away, amount_won, result_type`
   - `team_won_game` — did the NFL team win that game? `w`/`l` (or blank if you don't have it)
   - `home_away` — `h` or `a`
   - `result_type` — blank for a normal week, `hit33` for a real 33-hit, `week18_payout` for the tie-break payout

   The two middle columns are what power the win/loss and home/away splits in the Record Book. Blank is
   fine — those hits just won't be counted in the splits until you fill them in.

Everything else (Matchup Tracker, Live Season Tracker, Record Book, Season Awards, All-Time) reads from
what you enter here — no other manual aggregate entry needed.

## Site structure

- `lissleagues.com` — pool picker (NFL33 and NFL25 live; Golf shown as Coming Soon)

### NFL33 — target 33
- `lissleagues.com/NFL33` — Matchups (live tracker)
- `/NFL33/live` — Live Season Tracker
- `/NFL33/teams` — Team Grid (members × weeks, green = hit 33)
- `/NFL33/winners` — Winners (all seasons, paid results only)
- `/NFL33/awards` — Season Awards (all seasons, computed automatically — no entry needed)
- `/NFL33/record-book` — Record Book (all-time derived stats)
- `/NFL33/rules` — Rules
- `/NFL33/setup` — data entry (**not linked in the nav** — type the URL directly; passcode required)

### NFL25 — target 25

Same tabs, minus Season Awards and the Live Season Tracker (no consistency payout in this pool).

- `/NFL25` — Matchups
- `/NFL25/teams` — Team Grid
- `/NFL25/rules` — Rules
- `/NFL25/winners` — **hidden** (no history yet; unlink by editing `hiddenTabs` in `src/lib/pools.js`)
- `/NFL25/record-book` — **hidden**, same reason
- `/NFL25/squares` — **hidden**; Super Bowl squares grid, payout rules pending
- `/NFL25/setup` — data entry, same passcode

**Key NFL25 rule differences:** no season consistency payout (that $10/member goes to Super Bowl
squares), no website fee, and week 18 has no guaranteed winner — leftover pot rolls to the squares
board rather than paying out or carrying to next season.

### EALFFL — Edward A. Liss Fantasy Football League

A fantasy league archive, not a point pool. Data comes from ESPN exports pasted in once a year.

- `/EALFFL` — champions, trophy case, and season standings (ordered by regular-season record,
  with 🥇🥈🥉 marking final placement after playoffs)
- `/EALFFL/records` — league-wide record book
- `/EALFFL/members` — career résumé per member

Migration 04 creates `ff_standings` and `ff_playoffs` **and seeds the 2022–2025 seasons**, so this
works as soon as you run it — no data entry needed for those years.

**2022 asterisk:** that season's playoff rounds ran two weeks each (Wk 15–16, 17–18). Scores and
margins from that postseason aren't comparable to later single-week seasons, so playoff scoring
records exclude 2022. Season totals include it.

**Not yet available:** regular-season weekly scores. ESPN's standings export only has season
totals, so "highest one-week score" currently uses playoff games only.

To unhide a tab, remove its slug from `hiddenTabs` in `src/lib/pools.js`. To change a target score,
payout, or entry fee, edit the same file — every page reads from it.

## What's built vs. what's next

- ✅ NFL 33 Point Pool: Matchups, Live Season Tracker, Team Grid, Winners, Season Awards, Record Book, Setup.
- ✅ Installable PWA (Add to Home Screen on iOS/Android; works offline for anything already loaded).
- ⏳ NFL25 and Golf pool — placeholder tiles on the landing page. The schema and routing are
  structured so each can be added as its own set of tables and its own `/POOLNAME` route without touching NFL33.

## Notes on the ESPN data

- Uses `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` — free, no key, unofficial
  (ESPN could change or rate-limit it without notice; if scores stop loading, that's the first thing to check).
- The season year MUST be passed as `dates=YYYY`, not `year=YYYY`. The endpoint ignores `year` and
  silently returns the PREVIOUS season's games. If the Matchups tab ever shows the wrong season, a
  red banner will say so — check the season's start year in Setup first, then this parameter.
- The Live Season Tracker only counts a member's week once that week's game is **final** — in-progress
  games aren't counted yet, so the running total won't include a currently-live game until it ends.

## Local development (optional)

If you ever want to preview changes on your own machine before pushing to GitHub:
```
npm install
npm run dev
```
You'll need a `.env` file (copy `.env.example`) with your Supabase URL/key for this to work locally.

## Season Awards payouts

These are fixed in code, not entered:

- Most Consistent (lowest cumulative |33 − score|): **$160**
- Least Consistent (highest): **$140**

Averages divide the season total by 17, since each team has one bye week. Both payouts
feed into Total Paid Out and Most Money Won on the Record Book page. A season marked
`is_current` shows its standings but no payout until it closes.

To change the amounts, edit `AWARD_PAYOUT` at the top of `src/lib/awards.js`.

## The Setup passcode

Setup has no nav link — reach it by typing `lissleagues.com/NFL33/setup`. It then asks for the
passcode set in the `VITE_SETUP_PASSCODE` environment variable in Netlify. It stays unlocked until
you close the browser tab.

To change it: update the variable in Netlify, then **Trigger deploy → Clear cache and deploy site**
(env vars are baked in at build time).

**What this does and doesn't do.** It keeps friends from stumbling into the data-entry screen and
overwriting a season. It is not real security: the Supabase anon key is present in the site's
JavaScript, so someone determined could write to the database directly, bypassing the app. Supabase
Auth plus row-level security is the real fix when you want it.
