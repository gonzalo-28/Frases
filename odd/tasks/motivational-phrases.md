# Motivational Phrases Page

## Objective
A web page that, on each click, shows a random motivational phrase and its author.
With a 5% probability, it shows the fallback message instead:
"Me quede sin frases, anda y duerme!"

## Problem
No existing app. The repo is empty; this is the first feature.

## Scope
- Single page, no routing, no backend, no persistence.
- Click a button -> one phrase + author is displayed.
- 5% chance per click of the sleep message replacing the phrase.
- Random phrase is picked uniformly, without immediate repeats.

## Constraints
- Stack decided with the user: Vite + React + TypeScript.
- No backend, no API calls. Dataset lives in the repo.
- Node 22 available; no Go, no Bun.

## Route
Delegated direct (2+ non-trivial files: source, tests, styles, config).

## Tasks

### T1 — Scaffold, data and probability logic
- [x] Vite + React + TS scaffold
- [x] Vitest configured with a test script
- [x] Quote dataset (phrase + author) in its own module
- [x] `pickRandomQuote` / probability helper, extracted and testable
- [x] Unit tests for: 5% threshold boundary, no-immediate-repeat, uniform selection
- [x] Commit: `f942197 feat: add quote data and 5% sleep-message logic with tests`

### T2 — UI wiring
- [x] `App` renders current phrase + author
- [x] Button triggers a new draw
- [x] 5% branch renders the sleep message instead of the phrase
- [x] Component test for click -> phrase, click -> sleep message
- [x] Commit: `da5e1de feat: wire quote button to phrase, author and sleep message`

### T3 — Docs and final checks
- [x] README with run/test commands
- [x] Full check run: `npm test`, `npm run build`, `npm run lint`
- [x] Commit: `4ca8425 docs: add README with run and test commands`

## Acceptance criteria
- [x] Every click updates the displayed output.
- [x] The sleep message appears with 5% probability, not on a fixed schedule.
- [x] The sleep message never shows a phrase alongside it.
- [x] Consecutive clicks do not repeat the same phrase.
- [x] `npm test` and `npm run build` both pass.

## Checks
- `npm test` — Vitest, unit + component.
- `npm run build` — TypeScript + Vite production build.
- `npm run lint` — oxlint.

## Verification evidence
Verified on `4ca8425` (orchestrator ran each command, not delegated):
- `npm test`: `Test Files 2 passed (2) / Tests 44 passed (44)`, exit 0
- `npm run build`: `dist/assets/index-wG59Tllz.js 223.23 kB`, `built in 160ms`, exit 0
- `npm run lint`: no findings, exit 0

TDD mode: **off** (no config declared TDD; the suite was written alongside the
implementation rather than RED-first). Test runner: `npm test` (vitest run).

## Progress
- Stack chosen by user: Vite + React (over vanilla JS, for growth headroom).
- Sleep message spelling decided by user: accented, `Me quedé sin frases, andá y dormí!`.
  Single source of truth is `SLEEP_MESSAGE` in `src/quotePicker.ts`.
- Randomness is isolated in `src/quotePicker.ts`; `App` holds state only. Both
  helpers accept an injected `rng`, which is what makes the 5% branch testable.
- `previous` is a preference, not a hard filter: if excluding it would empty the
  pool it is ignored. So `pickRandomQuote` returns `undefined` only for an empty
  dataset, and there is no blank-screen branch for a single-quote dataset.

## Follow-ups not done (deliberate, no user decision yet)
- Git `user.name`/`user.email` are unset in this repo. Each commit used one-shot
  `-c` overrides; no git config was written. Worth configuring properly.
- `data-testid` attributes ship in production markup. Acceptable for now.
- Authored diff is over the 400-line review budget (~1250 authored lines across
  T1 + T2). No chained PR was created; delivery is the user's call.

## Next step
Nothing pending. All three tasks are closed and verified. Next possible step is
delivery (commit to main, push, open a PR) — the user's decision, not the orchestrator's.
