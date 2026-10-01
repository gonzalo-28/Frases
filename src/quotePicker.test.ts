import { describe, expect, it } from 'vitest'
import { quotes } from './quotes.ts'
import type { Quote } from './quotes.ts'
import {
  pickRandomQuote,
  shouldSleep,
  SLEEP_MESSAGE,
  SLEEP_PROBABILITY,
} from './quotePicker.ts'

/** Returns an RNG that yields the given rolls in order, then repeats the last one. */
function sequenceRng(...rolls: number[]): () => number {
  let call = 0
  return () => rolls[Math.min(call++, rolls.length - 1)]!
}

/** Returns an RNG yielding a fixed roll. */
function fixedRng(roll: number): () => number {
  return () => roll
}

const A: Quote = { text: 'A', author: 'AA' }
const B: Quote = { text: 'B', author: 'BB' }
const C: Quote = { text: 'C', author: 'CC' }
const D: Quote = { text: 'D', author: 'DD' }

describe('shouldSleep', () => {
  it('triggers below the 5% threshold', () => {
    expect(shouldSleep({ rng: fixedRng(0.0499) })).toBe(true)
  })

  it('does not trigger at exactly the 5% threshold', () => {
    // Strict `<` on purpose: a roll of exactly 0.05 must not trigger.
    expect(shouldSleep({ rng: fixedRng(0.05) })).toBe(false)
  })

  it('does not trigger just above the 5% threshold', () => {
    expect(shouldSleep({ rng: fixedRng(0.0501) })).toBe(false)
  })

  it('triggers for any roll below the threshold', () => {
    expect(shouldSleep({ rng: fixedRng(0) })).toBe(true)
  })

  it('does not trigger for the highest possible roll', () => {
    expect(shouldSleep({ rng: fixedRng(0.999999) })).toBe(false)
  })

  it('defaults to a 5% probability', () => {
    expect(SLEEP_PROBABILITY).toBe(0.05)
    expect(shouldSleep({ rng: fixedRng(0.0499) })).toBe(true)
    expect(shouldSleep({ rng: fixedRng(0.05) })).toBe(false)
  })

  it('uses Math.random by default and is therefore non-deterministic in production', () => {
    // Spy to prove the default argument is actually Math.random.
    const original = Math.random
    const calls: number[] = []
    Math.random = () => {
      calls.push(1)
      return 0.01
    }
    try {
      expect(shouldSleep()).toBe(true)
      expect(calls).toHaveLength(1)
    } finally {
      Math.random = original
    }
  })

  it('honours a probability override', () => {
    expect(shouldSleep({ rng: fixedRng(0.4), probability: 0.5 })).toBe(true)
    expect(shouldSleep({ rng: fixedRng(0.6), probability: 0.5 })).toBe(false)
  })

  it('never triggers at probability 0', () => {
    expect(shouldSleep({ rng: fixedRng(0) , probability: 0 })).toBe(false)
  })

  it('always triggers at probability 1', () => {
    expect(shouldSleep({ rng: fixedRng(0.999999), probability: 1 })).toBe(true)
  })

  it('rejects a probability outside [0, 1]', () => {
    expect(() => shouldSleep({ probability: -0.1 })).toThrow(RangeError)
    expect(() => shouldSleep({ probability: 1.1 })).toThrow(RangeError)
  })

  it('is deterministic for an injected RNG: same input, same output', () => {
    expect(shouldSleep({ rng: fixedRng(0.0499) })).toBe(
      shouldSleep({ rng: fixedRng(0.0499) }),
    )
    expect(shouldSleep({ rng: fixedRng(0.0501) })).toBe(
      shouldSleep({ rng: fixedRng(0.0501) }),
    )
  })

  it('triggers for exactly 49 of a 1000-step sweep, pinning the strict threshold', () => {
    // Rolls are 0.001, 0.002, ... 1.000. Those strictly below 0.05 are
    // 0.001..0.049 = 49 values; the roll of exactly 0.050 does NOT trigger.
    // Asserting 49 rather than "about 50" pins the strict `<` semantics.
    let step = 0
    const roll = () => {
      step += 1
      return step / 1000
    }

    let triggers = 0
    for (let i = 0; i < 1000; i += 1) {
      if (shouldSleep({ rng: roll })) triggers += 1
    }

    expect(triggers).toBe(49)
  })
})

describe('pickRandomQuote', () => {
  it('returns undefined for an empty quote array', () => {
    expect(pickRandomQuote([], { rng: fixedRng(0) })).toBeUndefined()
    expect(pickRandomQuote([], { rng: fixedRng(0.999999) })).toBeUndefined()
  })

  it('returns the only quote from a single-quote array', () => {
    expect(pickRandomQuote([A], { rng: fixedRng(0) })).toBe(A)
    expect(pickRandomQuote([A], { rng: fixedRng(0.999999) })).toBe(A)
  })

  it('returns the only quote when it equals previous, without looping or throwing', () => {
    // Documented fallback: `previous` is a preference, not a hard filter. With a
    // one-quote dataset excluding it would empty the pool, so it is ignored and
    // the quote is returned. Terminates in one step.
    expect(pickRandomQuote([A], { rng: fixedRng(0), previous: A })).toBe(A)
    expect(pickRandomQuote([A], { rng: fixedRng(0.999999), previous: A })).toBe(A)
  })

  it('returns undefined only when the dataset is empty, never because of previous', () => {
    // Pins the contract callers rely on: undefined === empty dataset.
    expect(pickRandomQuote([], { previous: A })).toBeUndefined()
    expect(pickRandomQuote([], { previous: A, rng: fixedRng(0.5) })).toBeUndefined()
    expect(pickRandomQuote([A], { previous: A })).toBeDefined()
    expect(pickRandomQuote([A, B], { previous: A })).toBeDefined()
  })

  it('returns the only quote when previous is a different quote', () => {
    expect(pickRandomQuote([A], { rng: fixedRng(0.5), previous: B })).toBe(A)
  })

  it('maps the roll to the expected index', () => {
    const pool = [A, B, C, D]
    expect(pickRandomQuote(pool, { rng: fixedRng(0) })).toBe(A)
    expect(pickRandomQuote(pool, { rng: fixedRng(0.25) })).toBe(B)
    expect(pickRandomQuote(pool, { rng: fixedRng(0.5) })).toBe(C)
    expect(pickRandomQuote(pool, { rng: fixedRng(0.75) })).toBe(D)
  })

  it('never returns previous', () => {
    const pool = [A, B, C]
    for (const roll of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.999999]) {
      expect(pickRandomQuote(pool, { rng: fixedRng(roll), previous: B })).not.toBe(B)
    }
  })

  it('never repeats across consecutive draws in a long simulated session', () => {
    const pool = [A, B, C, D]
    let current: Quote | undefined

    for (let i = 0; i < 200; i += 1) {
      const next = pickRandomQuote(pool, { previous: current })
      expect(next).toBeDefined()
      expect(next).not.toBe(current)
      current = next
    }
  })

  it('selects uniformly across the dataset', () => {
    // Real RNG, large sample: every quote should appear at roughly the same rate.
    const counts = new Map<Quote, number>()
    const samples = 20_000

    for (let i = 0; i < samples; i += 1) {
      const picked = pickRandomQuote(quotes)!
      counts.set(picked, (counts.get(picked) ?? 0) + 1)
    }

    expect(counts.size).toBe(quotes.length)

    const expected = samples / quotes.length
    for (const [quote, count] of counts) {
      // Within 15% of the expected share — generous enough to avoid flakiness,
      // tight enough to catch a badly skewed implementation.
      expect(count).toBeGreaterThan(expected * 0.85)
      expect(count).toBeLessThan(expected * 1.15)
      expect(quotes).toContain(quote)
    }
  })

  it('selects uniformly when previous is supplied', () => {
    const pool = [A, B, C, D]
    const counts = new Map<Quote, number>()
    const samples = 20_000

    for (let i = 0; i < samples; i += 1) {
      const picked = pickRandomQuote(pool, { previous: A })!
      counts.set(picked, (counts.get(picked) ?? 0) + 1)
    }

    // A is excluded, so the other three share the draws evenly.
    expect(counts.has(A)).toBe(false)
    for (const quote of [B, C, D]) {
      const count = counts.get(quote) ?? 0
      expect(count).toBeGreaterThan((samples / 3) * 0.9)
      expect(count).toBeLessThan((samples / 3) * 1.1)
    }
  })

  it('is deterministic for an injected RNG', () => {
    expect(pickRandomQuote(quotes, { rng: fixedRng(0.42), previous: A })).toBe(
      pickRandomQuote(quotes, { rng: fixedRng(0.42), previous: A }),
    )
  })

  it('draws exactly one RNG value per call', () => {
    const rng = sequenceRng(0.5, 0.1)
    // First call consumes 0.5 -> floor(0.5 * 4) = 2 -> C
    expect(pickRandomQuote([A, B, C, D], { rng })).toBe(C)
    // Second call consumes 0.1 -> floor(0.1 * 4) = 0 -> A. Getting A (not C)
    // proves the second roll was read rather than the first one replayed.
    expect(pickRandomQuote([A, B, C, D], { rng })).toBe(A)
  })
})

describe('sleep message', () => {
  it('is exported as a single constant for the UI to render', () => {
    expect(SLEEP_MESSAGE.length).toBeGreaterThan(0)
  })
})