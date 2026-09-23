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
    // Die Oberflaeche folgt der Browsersprache; die Pruefungen lesen deutsche
    // Beschriftungen. Playwright startet sonst mit en-US.
    locale: 'de-DE',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Erlaubt einen bereits vorhandenen Chromium statt des von Playwright
        // heruntergeladenen. Gedacht fuer Umgebungen ohne Zugriff auf den
        // Playwright-Download (abgeschottete Rechner, vorbereitete Images).
        // Ohne die Variable bleibt das Standardverhalten unveraendert.
        ...(process.env['CHROMIUM_PATH'] === undefined
          ? {}
          : { launchOptions: { executablePath: process.env['CHROMIUM_PATH'] } }),
      },
    },
  ],
  // Beide Server ausdruecklich an 127.0.0.1 - und die Bereitschaft an
  // derselben Adresse pruefen, die die Tests aufrufen. `localhost` loest auf
  // Rechnern mit IPv6 (z. B. GitHub-Runnern) zuerst nach ::1 auf; ein Server,
  // der nur dort lauscht, gilt als bereit, ist unter 127.0.0.1 aber nicht
  // erreichbar, und jeder Test scheitert beim ersten Seitenaufruf.
  webServer: [
    {
      // Frische Datenbank je Lauf: die Tests veraendern die Quellenauswahl,
      // und ein Vorgaenger-Lauf soll den ersten Test nicht faerben.
      command:
        "node -e \"require('node:fs').rmSync('.e2e', { recursive: true, force: true })\" && node src/main.ts",
      cwd: './apps/api',
      url: 'http://127.0.0.1:8787/v1/health',
      reuseExistingServer: false,
      env: {
        DATABASE_PATH: './.e2e/notebook.db',
        LLM_PROVIDER: 'stub',
        AUTH_USERNAME: 'Huskynarr',
        AUTH_PASSWORD: 'admin',
        AUTH_ADDITIONAL_USERS: JSON.stringify([
          { username: 'Everlast', password: 'browser-fixture-password-only' },
        ]),
        AUTH_SECRET: 'e2e-geheimnis-mindestens-16-zeichen',
        CORS_ORIGIN: 'http://127.0.0.1:4173,http://localhost:4173',
        SEED_ON_EMPTY: 'true',
        LOG_LEVEL: 'warn',
        HOST: '127.0.0.1',
      },
    },
    {
      command: 'pnpm --filter @notebook/web preview --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: false,
    },
  ],
});
