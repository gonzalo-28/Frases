import react from '@vitejs/plugin-react'
// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
// Importing from `vite` alone fails type-checking with TS2769 on `test`.
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom is set project-wide (not per-file) so component tests in T2 need no
    // extra setup. Pure logic tests work here too.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testSetup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})