import { expect, test } from '@playwright/test';

test('zusätzlicher Zugang öffnet denselben geschützten Arbeitsbereich', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nur notwendige' }).click();
  await page.getByRole('button', { name: /Anmelden/ }).click();
  await expect(page.getByLabel('Benutzername')).toHaveValue('Huskynar');
  await page.getByLabel('Benutzername').fill('everlabs');
  await page.getByLabel('Passwort').fill('browser-fixture-password-only');
  await page.getByRole('button', { name: /Anmelden/ }).click();
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();
});
