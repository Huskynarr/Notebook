import { defineConfig, devices } from '@playwright/test';

/** End-to-End-Pruefung des Hauptablaufs aus docs/product.md.
 *  Startet Backend und gebautes Frontend selbst; es laeuft gegen den
 *  Offline-Modus (LLM_PROVIDER=stub), damit kein Modell noetig ist und das
 *  Ergebnis reproduzierbar bleibt. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] !== undefined ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] !== undefined ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node src/main.ts',
      cwd: './apps/api',
      port: 8787,
      reuseExistingServer: false,
      env: {
        DATABASE_PATH: './.e2e/notebook.db',
        LLM_PROVIDER: 'stub',
        AUTH_SECRET: 'e2e-geheimnis-mindestens-16-zeichen',
        CORS_ORIGIN: 'http://127.0.0.1:4173,http://localhost:4173',
        SEED_ON_EMPTY: 'true',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: 'pnpm --filter @notebook/web preview --port 4173 --strictPort',
      port: 4173,
      reuseExistingServer: false,
    },
  ],
});
