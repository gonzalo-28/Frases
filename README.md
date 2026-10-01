# Frases motivadoras

A web page that shows a random motivational phrase and its author on every click.

With a **5% probability** per click, it shows a different message instead:

> Me quedé sin frases, andá y dormí!

## Stack

Vite + React + TypeScript, with Vitest for tests. No backend, no API calls, no state
persistence — the phrase dataset lives in the repository.

## Requirements

Node 22 or newer. Nothing else — no database, no API keys, no environment
variables.

## Getting started

```bash
git clone https://github.com/gonzalo-28/Frases.git
cd Frases
npm install
npm run dev
```

Then open http://localhost:5173. Click **Nueva frase**.

To reach it from another device on the same network, run
`npm run dev -- --host` and use the Network address Vite prints.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies from `package-lock.json` |
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests and re-run on change |
| `npm run lint` | Lint with oxlint |
| `npm run build` | Typecheck (`tsc -b`) then build for production |
| `npm run preview` | Serve the production build locally |

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci`, `npm test`, `npm run build`, and
`npm run lint` on every push and every pull request. A failing check shows on the
PR and is visible before merging.

Note that the check is *reported* but not *enforced*: GitHub warns on a failing
check but does not block the merge. Branch protection, which turns the warning
into a hard gate, is not enabled in this repository.

## Project structure

```
src/
  quotePicker.ts        probability and selection logic, no React
  quotes.ts             the quote dataset
  App.tsx               the page: state and rendering only
  quotePicker.test.ts   unit tests for the logic
  App.test.tsx          component tests for the page
.github/workflows/
  ci.yml                the CI pipeline
odd/tasks/
  motivational-phrases.md   feature doc: scope, decisions, delivery record
```

## How it works

The randomness lives entirely in `src/quotePicker.ts`, isolated from React:

- `shouldSleep({ rng, probability })` returns `true` with 5% probability. The
  comparison is strictly less-than, so a roll of exactly `0.05` does not trigger.
- `pickRandomQuote(quotes, { rng, previous })` picks one quote uniformly and avoids
  immediately repeating `previous`. When excluding `previous` would empty the pool,
  that preference is ignored rather than throwing.
- `SLEEP_MESSAGE` is the single source of truth for the 5% message text.

`src/App.tsx` holds only the state of what to show. It never computes randomness
itself, and the phrase and the sleep message are rendered from mutually exclusive
branches, so they never appear together.

Both functions accept an injectable random source, which is how the tests assert
the 5% branch deterministically instead of stubbing `Math.random`.

## Tests

`npm test` runs both suites:

- `src/quotePicker.test.ts` — the 5% threshold boundary, injected-RNG determinism,
  uniform selection, and the no-repeat behaviour.
- `src/App.test.tsx` — rendering and click behaviour: a click shows a phrase and
  author, the sleep message replaces the phrase, and the two are never visible
  at the same time.

## Changing things

- **The sleep message** — `SLEEP_MESSAGE` in `src/quotePicker.ts`. It is the only
  place the text is defined.
- **The 5% rate** — `SLEEP_PROBABILITY` in the same file.
- **The phrases** — `src/quotes.ts`, a plain typed array of `{ text, author }`.
  Adding an entry needs no other change.

## Known gaps

- No deployment: the app runs locally, it is not published to a URL.
- `data-testid` attributes ship in production markup.
- See `odd/tasks/motivational-phrases.md` for the full record, including the
  decisions behind the design and the delivery history.
