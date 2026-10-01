/**
 * Global test setup, loaded via `test.setupFiles` in vite.config.ts.
 *
 * Registered for every test so T2's component tests can use jest-dom matchers
 * (toBeInTheDocument, toHaveTextContent, ...) without touching config again.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom keeps the DOM between tests; unmount React trees to avoid leaks.
afterEach(() => {
  cleanup()
})