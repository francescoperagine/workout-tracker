import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive, storedArchive } from './helpers';

// Impostazioni dell'allenamento: recupero predefinito (US-21), suono e vibrazione (US-24).

test('US-21 il recupero predefinito si cambia a passi di 15 s, senza tastiera', async ({ page }) => {
  await seedArchive(page, archiveWith());
  await page.goto('settings/');
  const group = page.getByRole('group', { name: 'Recupero predefinito' });
  await expect(group.locator('output')).toHaveText('1:30');
  await group.getByRole('button', { name: 'Recupero predefinito: +15 s' }).click();
  await expect(group.locator('output')).toHaveText('1:45');
  await group.getByRole('button', { name: 'Recupero predefinito: −15 s' }).click();
  await group.getByRole('button', { name: 'Recupero predefinito: −15 s' }).click();
  await expect(group.locator('output')).toHaveText('1:15');
  await expect(group.locator('output')).toHaveAttribute('aria-label', '1 minuto e 15 secondi');
  await expect.poll(async () => (await storedArchive(page))?.settings.defaultRest).toBe(75);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Recupero predefinito' }).locator('output')).toHaveText('1:15');
});

test('US-24 suono e vibrazione si spengono e restano spenti, con il limite degli avvisi spiegato', async ({ page }) => {
  await seedArchive(page, archiveWith());
  await page.goto('settings/');
  await expect(page.getByText('Gli avvisi di fine recupero arrivano solo con l’app aperta')).toBeVisible();
  const sound = page.getByRole('switch', { name: 'Suono a fine recupero' });
  const vibration = page.getByRole('switch', { name: 'Vibrazione a fine recupero' });
  await expect(sound).toBeChecked();
  await sound.click();
  await vibration.click();
  await expect.poll(async () => (await storedArchive(page))?.settings).toMatchObject({ sound: false, vibration: false });
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Suono a fine recupero' })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: 'Vibrazione a fine recupero' })).not.toBeChecked();
});

test('US-21 Impostazioni mostra la guida «Come funziona» con 6 punti', async ({ page }) => {
  await seedArchive(page, archiveWith());
  await page.goto('settings/');
  const guide = page.getByRole('heading', { name: 'Come funziona', level: 2 });
  await expect(guide).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dati e privacy', level: 2 })).toBeVisible();
  // la guida sta prima di Dati e privacy
  const headings = await page.locator('h2').allTextContents();
  expect(headings.indexOf('Come funziona')).toBeLessThan(headings.indexOf('Dati e privacy'));
  const points = page.getByRole('region', { name: 'Come funziona' }).getByRole('listitem');
  await expect(points).toHaveCount(6);
  await expect(points.first()).toContainText('Schede:');
  await expect(points.last()).toContainText('I tuoi dati restano su questo telefono:');
});

test('US-24 senza vibrazione nel browser l’interruttore è disattivato e lo dice', async ({ page }) => {
  await page.addInitScript(() => {
    // come Safari su iPhone: niente navigator.vibrate
    Object.defineProperty(Navigator.prototype, 'vibrate', { value: undefined, configurable: true });
  });
  await seedArchive(page, archiveWith());
  await page.goto('settings/');
  await expect(page.getByRole('switch', { name: 'Vibrazione a fine recupero' })).toBeDisabled();
  await expect(page.getByText('Questo dispositivo non permette la vibrazione dal browser.')).toBeVisible();
});
