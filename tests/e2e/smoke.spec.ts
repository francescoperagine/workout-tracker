import { expect, test } from '@playwright/test';

// Prova di base dell'infrastruttura: le pagine si aprono, sono in italiano e non indicizzabili.
// I test delle storie si chiamano con il loro ID (es. "US-12 registra una serie copiando il precedente").
for (const path of ['/', '/workout?date=2026-10-10', '/about']) {
  test(`la pagina ${path} si apre senza errori`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(errors).toEqual([]);
  });
}
