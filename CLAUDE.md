# CLAUDE.md

Context for Claude Code sessions in this repo. Read this before making changes.

## What this is

A personal 12-week progressive overload strength training PWA. Single-user app (Jack Elrad). Used 3x per week for tracking workouts, logging sets, rating perceived exertion, and getting AI-suggested weight adjustments week over week.

Live URL: https://clever-palmier-abdbd1.netlify.app
Repo: https://github.com/jackelrad/workout-tracker

## Stack

- **Frontend:** React 18 + Vite (no TypeScript, plain JSX)
- **Auth + DB:** Supabase (Postgres with Row Level Security)
- **Hosting:** Netlify with auto-deploy on push to `main`
- **AI integration:** Anthropic API via a Netlify serverless function at `/netlify/functions/claude.js`. Frontend calls `/api/claude` with prompt; function uses server-side `ANTHROPIC_API_KEY` and returns response. The API key is NEVER exposed to the client.

## Project structure

```
src/
  App.jsx        single ~2400-line component containing the entire app
  main.jsx       Vite entry point
netlify/
  functions/
    claude.js    serverless function that calls Anthropic API
index.html       Vite HTML entry
vite.config.js   Vite config
netlify.toml     Netlify build + redirect config
package.json     dependencies and npm scripts
```

The architectural decision to keep everything in one `App.jsx` is intentional — this is a personal app, not a team project, and grep-ability of all logic in one place beats the cost of splitting components.

## Critical conventions

### Build verification before commit

**ALWAYS run `npm run build` before committing.** Vite uses esbuild internally, which has parser quirks that can fail silently. The build step is the only reliable way to confirm the file compiles.

If the user shares a new App.jsx claiming it's "build-verified," still run `npm run build` to confirm — different esbuild versions can behave differently.

### Code style in App.jsx

The file is dense by choice. Don't reformat or re-indent existing code unless explicitly asked. Specifically:

- One-liner function definitions are intentional (e.g. `const getW=(exId,wi)=>{...}`)
- Inline ternaries and `&&` short-circuits are preferred over multi-line if/else
- Comments are sparse; rely on naming and structure
- No JSDoc

### Patterns that break the esbuild parser (avoid)

These have all bitten us before. If you find yourself writing one of these, restructure:

- **Block comments `/* ... */` inside template literals** — esbuild loses parser state
- **`<` comparison operators inside JSX opening tag attribute values** — pre-compute as a variable instead. Example: don't write `<Btn style={{opacity: cc>0 ? 1 : 0.5}}>`, instead compute `const op = cc>0 ? 1 : 0.5;` first
- **Complex ternaries with nested template literals inside JSX** — break into two `&&` conditionals instead of `{x ? <A/> : <B/>}`

### Writing style for any user-facing copy

- Use Oxford commas
- Use symbols (%, $) over spelled-out terms
- Hyphenated numeric ranges ("weeks 3-5", not "weeks 3 through 5")
- Direct, warm tone. No corporate polish, no excessive hedging.

## Database schema (Supabase)

Tables:
- `profiles` — basic user info
- `user_progress` — single row per user. Columns include `benchmarks` (jsonb), `equipment` (jsonb), `setup_complete`, `start_date`, `workout_days`, `day1_dow`/`day2_dow`/`day3_dow`, `completed_sessions` (jsonb array), `last_completed_week`, `manual_week_lock`, `has_seen_orientation`, `exercise_settings` (jsonb — also stores `_bar_weights` subkey for plate math defaults)
- `weight_adjustments` — per-week per-exercise weight overrides. Columns: `user_id`, `day`, `week`, `exercise_id`, `weight`, `updated_at`. Composite key on `(user_id, day, week, exercise_id)`.
- `completed_sets` — per-set completion tracking. Columns: `user_id`, `day`, `week`, `set_key`, `completed`. Composite key on `(user_id, day, week, set_key)`.
- `session_feedback` — text feedback from end-of-session AI prompts
- `exercise_ratings` — per-exercise per-week ratings (`too_easy`, `just_right`, `too_hard`)

Row Level Security is enforced. The Supabase anon key is intentionally public (in `VITE_SUPABASE_KEY` env var); security comes from RLS policies, not key secrecy.

## Environment variables

Stored in Netlify dashboard, never in the repo:
- `VITE_SUPABASE_URL` — public, bundled into client
- `VITE_SUPABASE_KEY` — Supabase anon key, public, bundled into client
- `ANTHROPIC_API_KEY` — secret, used only by the Netlify function, never reaches the browser

`.env*` files are gitignored. Never commit credentials.

## Working with weights and progressions

The progression system has multiple layers, easy to confuse:

1. **Benchmarks** (`user_progress.benchmarks`) — the user's Week 1 starting weights. Set during onboarding. Only changed via the Week 1 Debrief flow.
2. **Generated weights** (`PROG` constant + `gW()` function) — computed for weeks 1-12 from benchmarks using progression deltas per exercise type (compound_major, compound_minor, isolation, cable_light). Snaps to user's per-exercise increment setting.
3. **Manual adjustments** (`weight_adjustments` table) — per-week overrides set by the user via +/- buttons or weight input.
4. **Adaptive propagation** — when user logs a set at a different weight than planned, `propagateWeightChange()` cascades the change forward to remaining weeks. Three branches: small decrease (1 increment) shifts uniformly, medium (2-3) slows progression by 35%, large (4+) sets new baseline. Increases cap carry-forward at 2 increments.
5. **End-of-session AI** (`processRatings`) — fine-tunes next week based on rating + adjustment combinations. Aware of propagation already happened, so it doesn't double-adjust.

## Testing changes

There's no automated test suite. Verification is:
1. `npm run build` — confirms compile
2. Manual smoke test on the live preview after deploy

When making behavioral changes, mention what to test post-deploy in the commit message or PR description.

## Deploy workflow

1. Edit `src/App.jsx`
2. `npm run build` (from repo root)
3. `git add src/App.jsx`
4. `git commit -m "..."` with descriptive message
5. `git push origin main`
6. Netlify auto-deploys; takes ~10 seconds

No staging environment. Main → production. Be careful.

## Personal context for the user (Jack)

- Senior Director of Ecommerce at David Protein
- Comfortable with product/strategy decisions, less so with terminal commands
- Prefers concise, direct technical explanations over hand-holding
- Values understanding what each command does, not just running them
- Will ask before doing destructive things — match that posture in return
