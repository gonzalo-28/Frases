# Frases motivadoras

A web page that shows a random motivational phrase and its author on every click.

With a **5% probability** per click, it shows a different message instead:

> Me quedé sin frases, andá y dormí!

## Stack

Vite + React + TypeScript, with Vitest for tests. No backend, no API calls, no state
persistence — the phrase dataset lives in the repository.

## Commands

```bash
npm install     # install dependencies
npm run dev     # start the dev server
npm test        # run the test suite once
npm run test:watch
npm run lint    # oxlint
npm run build   # typecheck + production build
npm run preview # serve the production build locally
```

Requires Node 22+.

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
