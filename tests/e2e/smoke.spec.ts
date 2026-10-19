import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive } from './helpers';

// Prova di base del guscio: le pagine si aprono, sono in italiano, indicizzabili e con il canonico.
// I test delle storie si chiamano con il loro ID (es. "US-12 registra una serie copiando il precedente").
for (const path of ['', 'welcome/', 'settings/', 'info/', 'calendar/', 'routines/', 'history/', 'workout/']) {
  test(`la pagina /${path} si apre senza errori`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seedArchive(page, archiveWith());
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://[^/]+/.*${path}$`));
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('la tab bar porta alle quattro sezioni senza ricaricare la pagina', async ({ page }) => {
  await seedArchive(page, archiveWith());
  await page.goto('');
  const tabs = page.getByRole('navigation', { name: 'Sezioni' });
  await expect(tabs.getByRole('link', { name: 'Oggi' })).toHaveAttribute('aria-current', 'page');
  // un segno sulla finestra sopravvive solo se la navigazione non ricarica il documento (ClientRouter)
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
  for (const [name, path] of [
    ['Calendario', 'calendar/'],
    ['Schede', 'routines/'],
    ['Storico', 'history/'],
    ['Oggi', ''],
  ]) {
    await tabs.getByRole('link', { name }).click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    await expect(tabs.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
  }
  await page.getByRole('link', { name: 'Impostazioni', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dati e privacy' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
});
