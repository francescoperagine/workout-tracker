import { defineConfig } from 'vitest/config';

// Test unitari della logica pura (archivio, import, unità, timer): file *.test.ts accanto al codice.
// I flussi end-to-end sono in tests/e2e/ e girano con Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
