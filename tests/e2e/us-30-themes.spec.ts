import { expect, test, type Page } from '@playwright/test';
import { archiveWith, hydrated, seedArchive } from './helpers';

// US-30: tema chiaro, scuro o di sistema, applicato prima del primo disegno.
const LIGHT_BACKGROUND = 'rgb(238, 242, 236)';
const DARK_BACKGROUND = 'rgb(20, 35, 33)';
const SHELL = 'rgb(20, 35, 33)';

const backgroundOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe('US-30 tema chiaro, scuro o di sistema', () => {
  test('US-30 senza preferenza segue il sistema chiaro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('kit/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await backgroundOf(page, 'body')).toBe(LIGHT_BACKGROUND);
    // il guscio resta verde scuro anche nel tema chiaro
    expect(await backgroundOf(page, 'header.shell')).toBe(SHELL);
  });

  test('US-30 senza preferenza segue il sistema scuro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('kit/');
    expect(await backgroundOf(page, 'body')).toBe(DARK_BACKGROUND);
  });

  test('US-30 la scelta Scuro vale anche dopo il ricaricamento, con il sistema chiaro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('kit/');
    await (await hydrated(page.getByRole('radio', { name: 'Scuro' }))).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => backgroundOf(page, 'body')).toBe(DARK_BACKGROUND);

    // Lo script inline applica il tema prima del primo disegno: già al DOMContentLoaded
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await backgroundOf(page, 'body')).toBe(DARK_BACKGROUND);
    await expect(page.getByRole('radio', { name: 'Scuro' })).toBeChecked();
  });

  test('US-30 la scelta Chiaro vince sul sistema scuro, e Sistema torna a seguirlo', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('kit/');
    await (await hydrated(page.getByRole('radio', { name: 'Chiaro' }))).check();
    await expect.poll(() => backgroundOf(page, 'body')).toBe(LIGHT_BACKGROUND);
    await page.getByRole('radio', { name: 'Sistema' }).check();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect.poll(() => backgroundOf(page, 'body')).toBe(DARK_BACKGROUND);
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker.theme'))).toBeNull();
  });

  test('US-30 una preferenza non valida nello storage viene ignorata', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('workout-tracker.theme', 'purple'));
    await page.goto('kit/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await backgroundOf(page, 'body')).toBe(LIGHT_BACKGROUND);
  });
});

test.describe('US-30 tema nelle Impostazioni', () => {
  test('US-30 la scelta fatta nelle Impostazioni resta passando da una sezione all’altra', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    await page.getByRole('radio', { name: 'Scuro' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // la navigazione del ClientRouter sostituisce gli attributi di <html>: il tema va riapplicato
    for (const name of ['Calendario', 'Oggi']) {
      await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect.poll(() => backgroundOf(page, 'body')).toBe(DARK_BACKGROUND);
    }
  });
});
