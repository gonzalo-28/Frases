/**
 * Component tests for the phrases page.
 *
 * Every draw is driven through an injected `rng`, so nothing here depends on
 * `Math.random` and no test is probabilistic. Roll ordering is fixed by
 * `App.handleDraw`: a sleeping click reads exactly one roll, and a draw reads
 * two (the sleep check, then the pick). `sequenceRng` encodes that order.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import type { Quote } from './quotes.ts'
import { quotes } from './quotes.ts'
import { SLEEP_MESSAGE } from './quotePicker.ts'

/** Returns an RNG yielding the given rolls in order, then repeating the last one. */
function sequenceRng(...rolls: number[]): () => number {
  let call = 0
  return () => {
    const roll = rolls[Math.min(call, rolls.length - 1)]!
    call += 1
    return roll
  }
}

/** Returns an RNG yielding a fixed roll, and counting how many times it was read. */
function countingFixedRng(roll: number): { rng: () => number; calls: () => number } {
  let calls = 0
  return {
    rng: () => {
      calls += 1
      return roll
    },
    calls: () => calls,
  }
}

/**
 * The dataset entry that `roll` selects, mirroring how `pickRandomQuote`
 * indexes: `floor(roll * candidates.length)` over the pool left once
 * `previousIndex` is excluded.
 *
 * Deriving the index instead of hardcoding it keeps these assertions true
 * across dataset edits — adding or removing a phrase shifts every index but
 * must not invalidate a single test in this file.
 */
function quoteForRoll(roll: number, previousIndex: number | null = null): Quote {
  const candidates = quotes.filter((_, index) => index !== previousIndex)
  return candidates[Math.floor(roll * candidates.length)]!
}

const DRAW_BUTTON_NAME = 'Nueva frase'

function drawButton() {
  return screen.getByRole('button', { name: DRAW_BUTTON_NAME })
}

/** Clicks the draw button the way a user would. */
async function clickDraw() {
  await userEvent.click(drawButton())
}

/**
 * Asserts the output area shows exactly one of the three possible states.
 *
 * Enumerating all three and expecting a single hit is what pins the product
 * rule: the sleep message and a phrase can never occupy the page together.
 */
function expectSingleState(expected: 'sleep' | 'quote' | 'hint') {
  const states = {
    sleep: screen.queryByTestId('sleep-message'),
    quote: screen.queryByTestId('quote'),
    hint: screen.queryByTestId('hint'),
  }

  const visible = Object.entries(states)
    .filter(([, element]) => element !== null)
    .map(([name]) => name)

  expect(visible).toEqual([expected])
}

describe('App initial render', () => {
  it('shows the heading, the draw button and a pre-draw hint', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Frases motivadoras' })).toBeInTheDocument()
    expect(drawButton()).toBeInTheDocument()
    expectSingleState('hint')
    expect(screen.getByTestId('hint')).toHaveTextContent('Tocá el botón para ver una frase.')
  })

  it('shows no phrase and no sleep message before the first click', () => {
    render(<App />)

    expect(screen.queryByTestId('quote')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sleep-message')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain(SLEEP_MESSAGE)
  })

  it('exposes the output area as a polite live region', () => {
    render(<App />)

    expect(screen.getByTestId('hint').closest('[aria-live="polite"]')).not.toBeNull()
  })
})

describe('App drawing a phrase', () => {
  it('renders a phrase and its author after a click', async () => {
    // The first roll clears the 5% sleep check; the second one picks the phrase.
    render(<App rng={sequenceRng(0.5, 0.5)} />)

    await clickDraw()

    expectSingleState('quote')
    expect(screen.getByTestId('quote-text')).toHaveTextContent(quoteForRoll(0.5).text)
    expect(screen.getByTestId('quote-author')).toHaveTextContent(quoteForRoll(0.5).author)
  })

  it('renders the phrase and the author as separate, individually findable elements', async () => {
    render(<App rng={sequenceRng(0.5, 0.5)} />)

    await clickDraw()

    const phrase = screen.getByTestId('quote-text')
    const author = screen.getByTestId('quote-author')

    expect(phrase).toBeInTheDocument()
    expect(author).toBeInTheDocument()
    // Distinct nodes: the author is not baked into the phrase string.
    expect(phrase).not.toContainElement(author)
    expect(phrase.textContent).not.toContain(quoteForRoll(0.5).author)
    expect(author.textContent).not.toContain(quoteForRoll(0.5).text)
    expect(author.textContent).toBe(quoteForRoll(0.5).author)
  })

  it('uses semantic elements for the quotation and its attribution', async () => {
    const { container } = render(<App rng={sequenceRng(0.5, 0.5)} />)

    await clickDraw()

    expect(container.querySelector('blockquote')).not.toBeNull()
    expect(container.querySelector('figcaption cite')).not.toBeNull()
  })

  it('always renders a phrase that exists in the dataset', async () => {
    render(<App rng={sequenceRng(0.5, 0.5, 0.5, 0.2, 0.5, 0.8)} />)

    for (let click = 0; click < 3; click += 1) {
      await clickDraw()
      expectSingleState('quote')
      expect(quotes.map((quote) => quote.text)).toContain(
        screen.getByTestId('quote-text').textContent,
      )
    }
  })

  it('draws from Math.random when no rng is injected', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    try {
      render(<App />)

      await clickDraw()

      // The spy firing proves the default random source is Math.random itself.
      expect(random).toHaveBeenCalled()
      expectSingleState('quote')
      expect(screen.getByTestId('quote-text')).toHaveTextContent(quoteForRoll(0.5).text)
    } finally {
      random.mockRestore()
    }
  })
})

describe('App sleep message', () => {
  it('renders SLEEP_MESSAGE and no phrase when the roll triggers sleep', async () => {
    // 0.01 is below the 5% threshold, so the first click sleeps.
    render(<App rng={sequenceRng(0.01)} />)

    await clickDraw()

    expectSingleState('sleep')
    expect(screen.getByTestId('sleep-message').textContent).toBe(SLEEP_MESSAGE)
    expect(screen.queryByTestId('quote')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quote-text')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quote-author')).not.toBeInTheDocument()
  })

  it('wastes no roll on a phrase when it sleeps', async () => {
    // One click that sleeps must consume exactly one RNG read: the sleep check.
    // A second read would prove the page drew a phrase it then threw away.
    const { rng, calls } = countingFixedRng(0)
    render(<App rng={rng} />)

    await clickDraw()

    expect(calls()).toBe(1)
    expectSingleState('sleep')
  })

  it('hides the previously drawn phrase while sleeping, not just the container', async () => {
    // click 1 draws; click 2 sleeps.
    render(<App rng={sequenceRng(0.9, 0.0, 0.01)} />)

    await clickDraw()
    const drawn = screen.getByTestId('quote-text').textContent
    expect(drawn).toBe(quoteForRoll(0).text)

    await clickDraw()

    expectSingleState('sleep')
    // The old phrase is gone from the document, not merely out of view.
    expect(document.body.textContent).not.toContain(drawn)
  })

  it('returns to a phrase after sleeping, without repeating the pre-sleep one', async () => {
    // click 1 draws index 0; click 2 sleeps; click 3 draws again.
    render(<App rng={sequenceRng(0.9, 0.0, 0.01, 0.9, 0.5)} />)

    await clickDraw()
    const drawn = screen.getByTestId('quote-text').textContent

    await clickDraw()
    expectSingleState('sleep')

    await clickDraw()

    expectSingleState('quote')
    const next = screen.getByTestId('quote-text').textContent
    expect(next).not.toBe(drawn)
    // Sleeping must not discard the no-repeat preference from before the nap:
    // the first phrase stays excluded, so the second roll indexes the pool
    // without it and lands on a different entry.
    expect(next).toBe(quoteForRoll(0.5, 0).text)
    expect(screen.queryByTestId('sleep-message')).not.toBeInTheDocument()
  })

  it('never shows the sleep message and a phrase at the same time', async () => {
    // Scripted session that alternates draws and naps.
    render(<App rng={sequenceRng(0.9, 0.0, 0.01, 0.9, 0.5, 0.02, 0.9, 0.9)} />)

    for (const expected of ['quote', 'sleep', 'quote', 'sleep', 'quote'] as const) {
      await clickDraw()
      expectSingleState(expected)
    }

    // And the same holds after the session ends.
    expect(
      (screen.queryByTestId('sleep-message') === null) !==
        (screen.queryByTestId('quote') === null),
    ).toBe(true)
  })
})

describe('App repeat avoidance', () => {
  it('passes previous so two clicks in a row never show the same phrase', async () => {
    // The same roll indexes the full pool on the first click and the pool minus
    // the first phrase on the second, so the two clicks must differ. Without
    // `previous` both clicks would render the same entry and this fails.
    render(<App rng={countingFixedRng(0.5).rng} />)

    await clickDraw()
    const first = screen.getByTestId('quote-text').textContent
    expect(first).toBe(quoteForRoll(0.5).text)

    await clickDraw()
    const second = screen.getByTestId('quote-text').textContent

    expect(second).not.toBe(first)
    expect(second).toBe(quoteForRoll(0.5, quotes.indexOf(quoteForRoll(0.5))).text)
  })

  it('never repeats the previous phrase across a long scripted session', async () => {
    render(<App rng={countingFixedRng(0.5).rng} />)

    let previous: string | null = null

    for (let click = 0; click < 20; click += 1) {
      await clickDraw()
      const current = screen.getByTestId('quote-text').textContent
      expect(current).not.toBe(previous)
      previous = current
    }
  })
})

describe('App empty dataset', () => {
  it('renders the empty hint instead of crashing on the first click', async () => {
    // `pickRandomQuote` returns undefined for an empty dataset; the page must
    // have a branch for it even though the shipped dataset is never empty.
    render(<App rng={countingFixedRng(0.5).rng} quotes={[]} />)

    await clickDraw()

    expectSingleState('hint')
    expect(screen.getByTestId('hint')).toHaveTextContent('No hay frases disponibles.')
    expect(screen.queryByTestId('quote')).not.toBeInTheDocument()
    expect(drawButton()).toBeEnabled()
  })

  it('survives repeated clicks with no quotes available', async () => {
    render(<App rng={countingFixedRng(0.5).rng} quotes={[]} />)

    for (let click = 0; click < 3; click += 1) {
      await clickDraw()
      expectSingleState('hint')
    }
  })

  it('draws normally from a single-quote dataset', async () => {
    const only: Quote = { text: 'La constancia es el camino más corto.', author: 'Anónimo' }
    render(<App rng={countingFixedRng(0.5).rng} quotes={[only]} />)

    await clickDraw()
    expect(screen.getByTestId('quote-text')).toHaveTextContent(only.text)

    // A one-quote dataset has nothing else to offer, so it re-shows the same
    // phrase rather than blanking. `previous` is a preference, not a filter.
    await clickDraw()
    expect(screen.getByTestId('quote-text')).toHaveTextContent(only.text)
    expect(screen.queryByTestId('sleep-message')).not.toBeInTheDocument()
  })
})