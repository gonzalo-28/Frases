# Motivational Phrases Page

## Objective
A web page that, on each click, shows a random motivational phrase and its author.
With a 5% probability, it shows the fallback message instead:
"Me quedé sin frases, andá y dormí!"

## Problem
No existing app. The repo was empty; this is the first feature.

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

### T2 — UI wiring
- [x] `App` renders current phrase + author
- [x] Button triggers a new draw
- [x] 5% branch renders the sleep message instead of the phrase
- [x] Component test for click -> phrase, click -> sleep message
- [x] Styling: card layout, typography, animation gated behind `prefers-reduced-motion`

### T3 — Docs and final checks
- [x] README with run/test commands
- [x] Full check run: `npm test`, `npm run build`, `npm run lint`
- [x] CI workflow running all three checks on every push and PR
- [x] This document corrected against the real delivered state

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
- All three also run in CI: `.github/workflows/ci.yml`, on every push and PR.

## Verification evidence
Verified on the delivered state (`94e6fa3`), and independently by CI on the same commit:
- `npm test`: `Test Files 2 passed (2) / Tests 44 passed (44)`, exit 0
- `npm run build`: `dist/assets/index-Dh5AmL8U.css 2.26 kB`, `built in 316ms`, exit 0
- `npm run lint`: no findings, exit 0
- CI run on `main`: `completed/success`
- Page served in a browser: `lang="es"`, correct title, all modules HTTP 200

TDD mode: **off** (no config declared TDD; the suite was written alongside the
implementation rather than RED-first). Test runner: `npm test` (vitest run).

## Progress
- Stack chosen by user: Vite + React, over vanilla HTML/JS, for growth headroom.
- Sleep message spelling decided by user: accented, `Me quedé sin frases, andá y dormí!`.
  Single source of truth is `SLEEP_MESSAGE` in `src/quotePicker.ts`.
- Randomness is isolated in `src/quotePicker.ts`; `App` holds state only. Both
  helpers accept an injected `rng`, which is what makes the 5% branch testable.
- `previous` is a preference, not a hard filter: if excluding it would empty the
  pool it is ignored. So `pickRandomQuote` returns `undefined` only for an empty
  dataset, and there is no blank-screen branch for a single-quote dataset.

## Delivery
Delivered as 6 reviewable slices, each a separate PR, merged in order:

| Slice | Commit | PR | Authored lines |
| --- | --- | --- | --- |
| scaffold | `7a1aa02` | (pushed to `main` directly, remote was empty) | 208 |
| dataset | `bb9de96` | #1 | 94 |
| 5% logic + tests | `0b9fdde` | #2 | 343 |
| UI + tests | `b351e41` | #3 | 444 |
| styles | `66d0787` | #4 | 170 |
| docs | `fe020c6` | #5 | 141 |
| CI | `94e6fa3` | #6 | 30 |

- The remote was empty at delivery time, so the scaffold slice was pushed straight
  to `main` as the PR base. PRs #1–#5 stacked on each other, then `main` was fast-
  forwarded to the full chain.
- PR #3 landed at 444 authored lines, 11% over the 400-line review budget. Accepted
  deliberately: splitting it further would have separated `App.test.tsx` from
  `src/App.tsx`, and the budget constrains how work is sliced, never what the code
  contains. Recorded as a size exception on the PR itself.
- All commits are authored by `gonzalo28 <chalo28nov@gmail.com>`, from the user's
  global git config.

## Corrections made to this document
The first version of this file was closed before delivery and did not reflect the
real outcome. It has been corrected. Two errors were substantive, not cosmetic:

- It claimed git identity was unset in this repo and that commits needed one-shot
  `-c user.name`/`user.email` overrides. **That was wrong.** The user's global git
  config is `gonzalo28 <chalo28nov@gmail.com>` and works without any override. A
  subagent reported `fatal: empty ident name`, invented an override using the Linux
  username and an ephemeral hostname, and the orchestrator propagated it across ten
  commits without verifying. The user caught it; the history was rewritten.
- It listed commit SHAs from that discarded history.

## Follow-ups still open
- Branch protection is not enabled. The CI check is added but not enforced, so a red
  PR can still be merged. Enabling it is a repository setting in the GitHub UI, not
  a code change, and it is deliberately left to the user because it also blocks
  emergency merges.
- `data-testid` attributes ship in production markup. The dataset has 23 quotes but
  only 17 unique authors, so the author element cannot be found by text query.
  Acceptable for now; ARIA-only querying is the alternative.
- No deployment. The app runs locally via `npm run dev`; it is not published to a URL.
- The README documents commands but not a clone-from-scratch walkthrough.

## Next step
None pending. The feature is delivered, merged, and verified in CI. Open items are
listed above and each is a user decision, not unfinished work.
