import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive, session, storedArchive } from './helpers';

// US-31: kg o lb, m o ft. Cambiare unità non altera i dati salvati (sempre in kg e metri).

test.describe('US-31 unità di misura', () => {
  test('US-31 passare a lb e tornare a kg non modifica i pesi salvati', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('s1', '2026-10-01', 61.25, 8)] }));
    await page.goto('settings/');
    await expect(page.getByRole('radio', { name: 'kg' })).toBeChecked();
    await page.getByRole('radio', { name: 'lb' }).check();
    await expect.poll(async () => (await storedArchive(page))?.settings.weightUnit).toBe('lb');
    expect((await storedArchive(page))?.sessions[0].exercises[0].sets[0].kg).toBe(61.25);

    await page.reload();
    await expect(page.getByRole('radio', { name: 'lb' })).toBeChecked();
    await page.getByRole('radio', { name: 'kg' }).check();
    await expect.poll(async () => (await storedArchive(page))?.settings.weightUnit).toBe('kg');
    expect((await storedArchive(page))?.sessions[0].exercises[0].sets[0].kg).toBe(61.25);
  });

  test('US-31 la distanza si sceglie in m o ft, con la nota che oggi non si usa', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    await expect(page.getByText('Per ora nessuna schermata mostra distanze')).toBeVisible();
    await page.getByRole('radio', { name: 'ft' }).check();
    await expect.poll(async () => (await storedArchive(page))?.settings.distanceUnit).toBe('ft');
    await page.reload();
    await expect(page.getByRole('radio', { name: 'ft' })).toBeChecked();
  });
});
