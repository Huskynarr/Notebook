import { expect, test } from '@playwright/test';

test('öffentliche Landingpage, nachvollziehbare Illustration und mobile Breite', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Nur notwendige' }).click();
  await expect(page.getByRole('heading', { name: /Gute Antworten/ })).toBeVisible();
  await expect(page.getByText('Illustration · fiktives Beispiel, keine KI-Antwort')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (process.env['UPDATE_SCREENSHOTS'] === '1') {
    await page.screenshot({ path: 'docs/bilder/landing-everlast.png', fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  if (process.env['UPDATE_SCREENSHOTS'] === '1') {
    await page.screenshot({ path: 'docs/bilder/landing-mobile.png' });
  }
});

test('öffentliche Einstiegsinhalte stehen ohne JavaScript im HTML', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('rel="canonical" href="https://notebook.sebastianselinger.de/"');
  expect(html).toContain('Der Gedankengang bleibt prüfbar.');
  expect(html).toMatch(/Fragen an ausgewählte Unterlagen richten/);
  expect(html).not.toContain('AgenticCoding123!');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
});

test('Login-Sperre bleibt nach Neuladen sichtbar und die API schützt den Arbeitsbereich', async ({
  page,
  request,
}) => {
  expect((await request.get('http://127.0.0.1:8787/v1/notebooks')).status()).toBe(401);
  await page.goto('/#login');
  await page.getByRole('button', { name: 'Nur notwendige' }).click();
  await expect(page.getByText('Nach drei fehlgeschlagenen Anmeldungen')).toHaveCount(0);
  await page.getByLabel('Passwort').fill('incorrect-test-password');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reply = page.waitForResponse((response) => response.url().endsWith('/v1/auth/login'));
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    expect((await reply).status()).toBe(attempt === 2 ? 429 : 401);
    if (attempt === 0)
      await expect(page.getByText('Nach drei fehlgeschlagenen Anmeldungen')).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeDisabled();
  await expect(page.getByText(/Erneute Anmeldung in \d+ Sekunden/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Passwort')).toBeDisabled();
  await expect(page.getByText(/Erneute Anmeldung in \d+ Sekunden/)).toBeVisible();
  // Bypass all browser state: the backend must independently refuse the known
  // valid demo credentials during its own persisted cooldown.
  const rejected = await request.post('http://127.0.0.1:8787/v1/auth/login', {
    data: { username: 'Huskynarr', password: 'admin' },
  });
  expect(rejected.status()).toBe(429);
  expect(Number(rejected.headers()['retry-after'])).toBeGreaterThan(0);
});
