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
  // Einwilligung und Einfuehrung erscheinen nur beim ersten Start eines
  // Browsers - hier also in jedem Test, weil jeder mit leerem Speicher beginnt.
  await page.getByRole('button', { name: 'Alle akzeptieren' }).click();
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByLabel('Passwort').fill('admin');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByRole('button', { name: 'Überspringen' }).click();
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

test('Einwilligung kommt vor allem anderen; ohne Zustimmung bleiben Einstellungen in der Sitzung', async ({
  page,
}) => {
  await page.goto('/');
  const banner = page.getByTestId('consent-banner');
  await expect(banner.getByRole('heading', { name: 'Speicherung auf diesem Gerät' })).toBeVisible();
  // Solange nicht entschieden ist, gibt es keine Einfuehrung und kein Cookie.
  await expect(page.getByText('Schritt 1 von 3')).toHaveCount(0);
  expect(await page.context().cookies()).toEqual([]);

  await banner.getByRole('button', { name: 'Auswahl anpassen' }).click();
  await expect(banner.getByRole('checkbox', { name: 'Notwendig' })).toBeDisabled();
  await banner.getByRole('checkbox', { name: 'Einstellungen merken' }).uncheck();
  await banner.getByRole('button', { name: 'Auswahl speichern' }).click();
  await expect(banner).toHaveCount(0);

  // Die Einführung startet erst im geschützten Arbeitsbereich.
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByLabel('Passwort').fill('admin');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  const gespeichert = await page.evaluate(() => ({
    lokal: Object.keys(localStorage),
    sitzung: Object.keys(sessionStorage),
  }));
  expect(gespeichert.lokal).toEqual(['notebook.consent.v1']);
  expect(gespeichert.sitzung).toContain('notebook.lang');

  await page.reload();
  await expect(page.getByTestId('consent-banner')).toHaveCount(0);
  expect(await page.context().cookies()).toEqual([]);
});

test('Einführung fragt beim ersten Start nach Sprache und Design und erscheint danach nicht mehr', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alle akzeptieren' }).click();
  await expect(page.getByRole('heading', { name: /Gute Antworten/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByLabel('Passwort').fill('admin');
  await page.getByRole('button', { name: 'Anmelden' }).click();
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
  await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Beispiel-Notebook ist nach dem Start sofort nutzbar', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await expect(page.getByText('Everlast Consulting GmbH – Impressum.md')).toBeVisible();
  await expect(page.getByText('Everlast AI – Selbstauskunft.md')).toBeVisible();
  await expect(page.getByText('2 von 2 ausgewählt')).toBeVisible();
});

test('ohne Modell wird die Antwort sichtbar als simuliert gekennzeichnet', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wer vertritt die Everlast Consulting GmbH laut Impressum?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await expect(page.getByText('Simulierte Antwort — kein Modell verbunden')).toBeVisible();
});

test('ein Beleg fuehrt zur hervorgehobenen Stelle im Original', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await login(page);
  await selectAllSources(page);
  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wer vertritt die Everlast Consulting GmbH laut Impressum?');
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
  if (process.env['UPDATE_SCREENSHOTS'] === '1') {
    // Citation tooltips must not obscure the original; capture the final
    // highlight state rather than the temporary citation-flash animation.
    await page.getByLabel('Frage an die ausgewählten Quellen').focus();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.screenshot({ path: 'docs/bilder/workspace-everlast.png', animations: 'disabled' });
    await page.getByRole('button', { name: 'Einstellungen', exact: true }).click();
    await page.getByRole('radio', { name: /huskynarr/ }).check();
    await page.getByRole('button', { name: 'Fertig', exact: true }).click();
    await page.getByLabel('Frage an die ausgewählten Quellen').focus();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.screenshot({ path: 'docs/bilder/workspace-huskynarr.png', animations: 'disabled' });
  }
});

test('abgewaehlte Quellen werden nicht beruecksichtigt', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page.getByLabel('Everlast AI – Selbstauskunft.md für Fragen berücksichtigen').uncheck();
  await expect(page.getByText('1 von 2 ausgewählt')).toBeVisible();

  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Welche Gründer nennt die Everlast-Website?');
  await page.getByRole('button', { name: 'Fragen' }).click();
  await expect(page.getByText('1 Quellen berücksichtigt')).toBeVisible();
  await expect(page.getByText(/Everlast AI – Selbstauskunft\.md ·/)).toHaveCount(0);
});

test('ohne ausgewaehlte Quelle wird nicht geantwortet', async ({ page }) => {
  await login(page);
  await selectAllSources(page);
  await page
    .getByLabel('Everlast Consulting GmbH – Impressum.md für Fragen berücksichtigen')
    .uncheck();
  await page.getByLabel('Everlast AI – Selbstauskunft.md für Fragen berücksichtigen').uncheck();
  await expect(page.getByText('Keine Quelle ausgewählt')).toBeVisible();

  await page
    .getByLabel('Frage an die ausgewählten Quellen')
    .fill('Wer vertritt die Everlast Consulting GmbH laut Impressum?');
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
  await page.reload();
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

test('Dateiimport begrenzt 10 MiB vor Upload und speichert gültigen UTF-8-Text', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Datei', exact: true }).click();
  const fileInput = page.getByLabel('Datei wählen (.txt oder .md)');
  let uploads = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/sources')) uploads += 1;
  });
  await fileInput.setInputFiles({
    name: 'too-big.md',
    mimeType: 'text/markdown',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 'x'),
  });
  await expect(
    page.getByText('Maximal 10 MiB (10.485.760 Bytes) pro Quelle in dieser Testumgebung.'),
  ).toBeVisible();
  expect(uploads).toBe(0);
  await fileInput.setInputFiles({
    name: 'upload-check.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Upload\n\nPrüfbarer UTF-8-Text mit Ä, Ö und Ü.'),
  });
  await expect(page.getByLabel('Titel', { exact: true })).toHaveValue('upload-check.md');
  await page.getByRole('button', { name: 'Quelle anlegen' }).click();
  await expect(page.getByLabel('upload-check.md für Fragen berücksichtigen')).toBeChecked();
  expect(uploads).toBe(1);
});
