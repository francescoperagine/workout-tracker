import { expect, test, type Page } from '@playwright/test';

// US-30: tema chiaro, scuro o di sistema, applicato prima del primo disegno.
const FONDO_CHIARO = 'rgb(238, 242, 236)';
const FONDO_SCURO = 'rgb(20, 35, 33)';
const GUSCIO = 'rgb(20, 35, 33)';

const sfondo = (page: Page, selettore: string) =>
  page.locator(selettore).first().evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe('US-30 tema chiaro, scuro o di sistema', () => {
  test('US-30 senza preferenza segue il sistema chiaro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/kit');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await sfondo(page, 'body')).toBe(FONDO_CHIARO);
    // il guscio resta verde scuro anche nel tema chiaro
    expect(await sfondo(page, 'header.guscio')).toBe(GUSCIO);
  });

  test('US-30 senza preferenza segue il sistema scuro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/kit');
    expect(await sfondo(page, 'body')).toBe(FONDO_SCURO);
  });

  test('US-30 la scelta Scuro vale anche dopo il ricaricamento, con il sistema chiaro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/kit');
    await page.getByRole('radio', { name: 'Scuro' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'scuro');
    expect(await sfondo(page, 'body')).toBe(FONDO_SCURO);

    // Lo script inline applica il tema prima del primo disegno: già al DOMContentLoaded
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'scuro');
    expect(await sfondo(page, 'body')).toBe(FONDO_SCURO);
    await expect(page.getByRole('radio', { name: 'Scuro' })).toBeChecked();
  });

  test('US-30 la scelta Chiaro vince sul sistema scuro, e Sistema torna a seguirlo', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/kit');
    await page.getByRole('radio', { name: 'Chiaro' }).check();
    expect(await sfondo(page, 'body')).toBe(FONDO_CHIARO);
    await page.getByRole('radio', { name: 'Sistema' }).check();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await sfondo(page, 'body')).toBe(FONDO_SCURO);
    expect(await page.evaluate(() => localStorage.getItem('bodytracker.tema'))).toBeNull();
  });

  test('US-30 una preferenza non valida nello storage viene ignorata', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('bodytracker.tema', 'viola'));
    await page.goto('/kit');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    expect(await sfondo(page, 'body')).toBe(FONDO_CHIARO);
  });
});
