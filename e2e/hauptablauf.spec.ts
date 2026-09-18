import { expect, test, type Page } from '@playwright/test';

/**
 * Prueft den Hauptablauf aus docs/product.md Ende zu Ende:
 * Notebook oeffnen, eigene Quelle hinzufuegen, Quellen waehlen, Frage stellen,
 * Antwortbelege pruefen, Ergebnis als Notiz speichern.
 *
 * Laeuft gegen LLM_PROVIDER=stub. Der Offline-Modus formuliert nichts, setzt
 * aber echte Marker auf die tatsaechlich abgerufenen Abschnitte - genau das,
 * was hier geprueft werden soll. Die Qualitaet einer Modellantwort ist damit
 * ausdruecklich NICHT geprueft.
 */

async function login(page: Page): Promise<void> {
  await page.goto('/');
  // Die Einfuehrung erscheint nur beim ersten Start eines Browsers - hier
  // also in jedem Test, weil jeder mit leerem Speicher beginnt.
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await page.getByLabel('Passwort').fill('admin');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  // Auf ein Element warten, das in jeder Breite sichtbar ist: die
  // Quellenspalte ist auf schmalen Bildschirmen hinter einem Tab.
  await expect(page.getByRole('button', { name: 'Fragen' })).toBeVisible();
}

/** Die Auswahl wird serverseitig gespeichert und ueberlebt damit den
 *  vorherigen Test. Jeder Test stellt sie deshalb selbst her. */
async function selectAllSources(page: Page): Promise<void> {
  const boxes = page.locator('input[type="checkbox"][aria-label$="für Fragen berücksichtigen"]');
  // Die Quellen kommen nach dem Chat an; ohne dieses Warten zaehlt die
  // Schleife null Kaestchen und stellt nichts um.
  await boxes.first().waitFor({ state: 'attached' });
  for (let i = 0; i < (await boxes.count()); i += 1) {
    const box = boxes.nth(i);
    if (!(await box.isChecked())) await box.check();
  }
  await expect(page.locator('input[type="checkbox"]:not(:checked)')).toHaveCount(0);
}

test('Einführung fragt beim ersten Start nach Sprache und Design und erscheint danach nicht mehr', async ({
  page,
}) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Schritt 1 von 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'English' }).click();
  await expect(dialog.getByText('Step 1 of 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('radio', { name: /Universität Freiburg|University of Freiburg/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-design', 'uni-freiburg');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: /Get started|Start/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Beispiel-Notebook ist nach dem Start sofort nutzbar', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await expect(page.getByText('Prüfungsordnung (Beispiel).md')).toBeVisible();
  await expect(page.getByText('Merkblatt Prüfungsamt.md')).toBeVisible();
  await expect(page.getByText('2 von 2 ausgewählt')).toBeVisible();
});

test('ohne Modell wird die Antwort sichtbar als simuliert gekennzeichnet', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wie lange ist die Widerspruchsfrist?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await expect(page.getByText('Simulierte Antwort — kein Modell verbunden')).toBeVisible();
});

test('ein Beleg fuehrt zur hervorgehobenen Stelle im Original', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wie lange ist die Widerspruchsfrist?');
  await page.getByRole('button', { name: 'Fragen' }).click();

  const marker = page.locator('button[aria-label^="Beleg"]').first();
  await expect(marker).toBeVisible();
  await marker.click();

  const mark = page.locator('mark');
  await expect(mark).toBeVisible();
  const highlighted = (await mark.innerText()).trim();
  expect(highlighted.length).toBeGreaterThan(10);

  // Die hervorgehobene Stelle muss woertlich im Belegverzeichnis stehen.
  await expect(page.getByText(/Zeichen \d+–\d+/).first()).toBeVisible();
});

test('abgewaehlte Quellen werden nicht beruecksichtigt', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page.getByLabel('Merkblatt Prüfungsamt.md für Fragen berücksichtigen').uncheck();
  await expect(page.getByText('1 von 2 ausgewählt')).toBeVisible();

  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Was steht zur Einsicht in die Prüfungsakte?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await expect(page.getByText('1 Quellen berücksichtigt')).toBeVisible();
  await expect(page.getByText('Merkblatt Prüfungsamt.md · Merkblatt')).toHaveCount(0);
});

test('ohne ausgewaehlte Quelle wird nicht geantwortet', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page.getByLabel('Prüfungsordnung (Beispiel).md für Fragen berücksichtigen').uncheck();
  await page.getByLabel('Merkblatt Prüfungsamt.md für Fragen berücksichtigen').uncheck();
  await expect(page.getByText('Keine Quelle ausgewählt')).toBeVisible();

  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wie lange ist die Widerspruchsfrist?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await expect(page.getByText('Es ist keine Quelle ausgewählt')).toBeVisible();
});

test('eigene Quelle hinzufuegen und Antwort als Notiz speichern', async ({ page }) => {
  await login(page);
  await selectAllSources(page);

  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByLabel('Titel').fill('eigene-notiz.md');
  await page
    .getByLabel('Text')
    .fill('# Eigene Quelle\n\nDie Rückmeldefrist endet am 15. Februar jedes Jahres.');
  await page.getByRole('button', { name: 'Quelle anlegen' }).click();
  // Auf die Quellenkarte pruefen, nicht auf den Text: die Kurzmeldung nennt
  // denselben Namen und macht den Treffer sonst mehrdeutig.
  await expect(page.getByLabel('eigene-notiz.md für Fragen berücksichtigen')).toBeChecked();

  await page.getByLabel('Frage an die ausgewählten Quellen').fill('Wann endet die Rückmeldefrist?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await page.getByRole('button', { name: 'Als Notiz speichern' }).first().click();

  await page
    .getByRole('tab', { name: /Notizen/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Wann endet die Rückmeldefrist?' })).toBeVisible();
});

test('die Seite scrollt auf einem schmalen Bildschirm nicht waagerecht', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
