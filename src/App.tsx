/**
 * Motivational phrases page.
 *
 * This component owns no randomness of its own. Every draw delegates to
 * `shouldSleep` and `pickRandomQuote` from `quotePicker.ts`, and both accept an
 * injectable `rng`, so component tests drive the page deterministically instead
 * of stubbing `Math.random`.
 *
 * Output is mutually exclusive by construction: the sleeping branch returns
 * before the phrase branch is considered, so a phrase and the sleep message can
 * never be rendered at the same time.
 */

import { useState } from 'react'
import type { Quote } from './quotes.ts'
import { quotes as defaultQuotes } from './quotes.ts'
import type { Rng } from './quotePicker.ts'
import { pickRandomQuote, shouldSleep, SLEEP_MESSAGE } from './quotePicker.ts'

/**
 * Props for {@link App}.
 *
 * Both are injectable purely so tests can pin the random source and the
 * dataset. The app renders the shipped quotes with `Math.random` when they are
 * omitted, which is the only production path.
 */
export type AppProps = {
  /** Random source handed to the picker. Defaults to `Math.random`. */
  rng?: Rng
  /** Dataset to draw from. Defaults to the shipped quotes. */
  quotes?: readonly Quote[]
}

type PhraseOutputProps = {
  /** The phrase to show, if one has been drawn. */
  quote: Quote | undefined
  /** Whether the sleep message should be shown instead of a phrase. */
  sleeping: boolean
  /** Whether the dataset has anything to offer at all. */
  hasDataset: boolean
}

/**
 * Renders exactly one of three states: the sleep message, a phrase with its
 * author, or the pre-draw / empty-dataset hint.
 *
 * Split out of `App` so each branch is an early return rather than a nested
 * ternary, which keeps the mutual exclusivity easy to read and to audit.
 */
function PhraseOutput({ quote, sleeping, hasDataset }: PhraseOutputProps) {
  if (sleeping) {
    return (
      <p className="sleep" data-testid="sleep-message">
        {SLEEP_MESSAGE}
      </p>
    )
  }

  if (quote !== undefined) {
    return (
      // `figure` + `figcaption` is the semantics for self-contained content
      // with a caption, which is exactly a quotation and its attribution.
      <figure className="quote" data-testid="quote">
        <blockquote className="quote__text" data-testid="quote-text">
          <p>{quote.text}</p>
        </blockquote>
        <figcaption className="quote__author" data-testid="quote-author">
          <cite>{quote.author}</cite>
        </figcaption>
      </figure>
    )
  }

  return (
    <p className="hint" data-testid="hint">
      {hasDataset ? 'Tocá el botón para ver una frase.' : 'No hay frases disponibles.'}
    </p>
  )
}

export default function App({ rng = Math.random, quotes = defaultQuotes }: AppProps = {}) {
  // The last drawn phrase. It is deliberately kept while sleeping, so a sleep
  // does not discard the no-repeat preference for the next draw.
  const [quote, setQuote] = useState<Quote | undefined>(undefined)
  const [sleeping, setSleeping] = useState(false)

  function handleDraw() {
    if (shouldSleep({ rng })) {
      // Sleeping wins outright: the previous phrase stays in state but is not
      // rendered, and no new phrase is drawn.
      setSleeping(true)
      return
    }

    // `pickRandomQuote` returns `undefined` only for an empty dataset, so this
    // branch cannot silently drop a phrase the way a hard filter would.
    setQuote(pickRandomQuote(quotes, { rng, previous: quote }))
    setSleeping(false)
  }

  return (
    <main className="page">
      <section className="card" aria-labelledby="page-title">
        <h1 className="card__title" id="page-title">
          Frases motivadoras
        </h1>

        {/* One polite live region owns the whole output area, so screen readers
            announce whichever branch replaced the other. */}
        <div className="card__output" aria-live="polite">
          {/* Keyed by the phrase so a new phrase remounts and replays the
              entrance animation; harmless when motion is reduced. */}
          <PhraseOutput
            key={sleeping ? 'sleep' : (quote?.text ?? 'hint')}
            quote={quote}
            sleeping={sleeping}
            hasDataset={quotes.length > 0}
          />
        </div>

        <button type="button" className="draw-button" onClick={handleDraw}>
          Nueva frase
        </button>
      </section>
    </main>
  )
}