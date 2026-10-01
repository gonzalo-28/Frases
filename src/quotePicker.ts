/**
 * Quote selection logic.
 *
 * Pure and side-effect free apart from reading the injected RNG, so every
 * behaviour here is deterministic under test. The UI (T2) only calls these
 * functions; it never computes randomness itself.
 */

import type { Quote } from './quotes.ts'

/**
 * Probability that a click resolves to the sleep message instead of a quote.
 * Expressed as a rate, not a percentage, to avoid per-call division.
 */
export const SLEEP_PROBABILITY = 0.05

/**
 * Message shown instead of a phrase when {@link shouldSleep} returns true.
 *
 * Accented per standard Spanish orthography, per the spelling the user settled
 * on (recorded in `odd/tasks/motivational-phrases.md`). This constant is the
 * single source of truth for the UI — change it here, in one place, if the
 * wording ever changes.
 */
export const SLEEP_MESSAGE = 'Me quedé sin frases, andá y dormí!'

/** Injectable random source, in the `[0, 1)` range, matching `Math.random`. */
export type Rng = () => number

/** Options for {@link shouldSleep}. */
export type ShouldSleepOptions = {
  /** Random source. Defaults to `Math.random`. Injectable to make tests deterministic. */
  rng?: Rng
  /** Threshold override in `[0, 1]`. Defaults to {@link SLEEP_PROBABILITY}. */
  probability?: number
}

/** Options for {@link pickRandomQuote}. */
export type PickRandomQuoteOptions = {
  /** Random source. Defaults to `Math.random`. Injectable to make tests deterministic. */
  rng?: Rng
  /**
   * The quote shown on the previous draw. When supplied, it is excluded from
   * this draw's candidates so consecutive clicks never repeat the same phrase.
   */
  previous?: Quote
}

/**
 * Draws the sleep-message roll: returns `true` with a 5% probability.
 *
 * The comparison is strictly less-than (`roll < probability`), never `<=`, so
 * the boundary is unambiguous: a roll of exactly `0.05` does NOT trigger.
 * `Math.random()` yields `[0, 1)`, so this fires for exactly the first 5% of
 * that interval — the requested rate, not an approximation of it.
 *
 * @throws {RangeError} if `probability` is outside `[0, 1]`.
 */
export function shouldSleep({ rng = Math.random, probability = SLEEP_PROBABILITY }: ShouldSleepOptions = {}): boolean {
  if (!(probability >= 0 && probability <= 1)) {
    throw new RangeError(`probability must be between 0 and 1, received ${probability}`)
  }

  return rng() < probability
}

/**
 * Picks one quote uniformly at random, excluding `previous` when given.
 *
 * Selection maps the roll into `[0, candidates.length)` and indexes once. With a
 * uniform roll that gives each candidate exactly `1 / candidates.length`, and
 * it costs a single RNG read. Dropping one element leaves the remaining
 * `n - 1` still exactly uniform, so passing `previous` never skews the odds.
 *
 * Edge cases, decided deliberately:
 * - **Empty array** → returns `undefined`. There is nothing to pick, and
 *   throwing would force every caller to guard the same impossible case.
 * - **Single-quote array whose only quote equals `previous`** → returns that
 *   same quote. `previous` is only a *preference*, never a hard filter: if it
 *   would empty the pool, it is ignored. Re-showing one phrase beats returning
 *   `undefined`, because `undefined` would push a blank-screen branch onto
 *   every caller for a case that only arises with a degenerate one-quote
 *   dataset. This terminates in one step — no retry, no loop, no throw.
 *
 * The practical contract for callers: for any non-empty dataset the result is
 * always a `Quote`, so `undefined` means exactly one thing — the dataset is
 * empty. Callers can branch on that without tracking the previous quote.
 *
 * @param quotes the dataset to draw from
 * @returns the selected quote, or `undefined` only when `quotes` is empty
 */
export function pickRandomQuote(
  quotes: readonly Quote[],
  { rng = Math.random, previous }: PickRandomQuoteOptions = {},
): Quote | undefined {
  // Only honour `previous` when excluding it still leaves at least one candidate.
  const previousIsExcludable =
    previous !== undefined && quotes.some((quote) => quote !== previous)

  const candidates = previousIsExcludable
    ? quotes.filter((quote) => quote !== previous)
    : quotes

  if (candidates.length === 0) return undefined

  return candidates[Math.floor(rng() * candidates.length)]
}