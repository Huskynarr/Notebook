import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e/ laeuft mit Playwright, nicht mit vitest.
    projects: ['packages/*', 'apps/*'],
  },
});
