import { expect, test } from '@playwright/test';
import { expectPage, storedArchive } from './helpers';

// US-01: al primo avvio una schermata breve dice cosa fa l'app e dove sono i dati; nessun account
// e nessuna richiesta di permessi. Si vede una volta sola, finché nel browser non c'è un archivio.

test.describe('US-01 primo avvio', () => {
  test.beforeEach(async ({ page }) => {
    // conta le richieste di conservazione dei dati (in alcuni browser chiedono il permesso)
    await page.addInitScript(() => {
      const w = window as unknown as { persistCalls: number };
      w.persistCalls = 0;
      if (navigator.storage) navigator.storage.persist = async () => (w.persistCalls++, true);
    });
  });

  test('US-01 al primo avvio Oggi porta al benvenuto, senza chiedere permessi', async ({ page }) => {
    await page.goto('');
    await expectPage(page, 'welcome/');
    await expect(page.getByRole('heading', { name: 'BodyTracker', level: 1 })).toBeVisible();
    await expect(page.getByText('I dati restano su questo dispositivo')).toBeVisible();
    await expect(page.getByText('funziona anche senza rete')).toBeVisible();
    // tre azioni: esempio (primaria), da zero, importa
    await expect(page.getByRole('button', { name: 'Inizia con le schede di esempio' })).toHaveClass(/btn-primary/);
    await expect(page.getByRole('button', { name: 'Parti da zero' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Importa un backup' })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { persistCalls: number }).persistCalls)).toBe(0);
    expect(await storedArchive(page)).toBeNull();
  });

  test('US-01 "Inizia con le schede di esempio" carica A e B e porta a Oggi, una volta sola', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Inizia con le schede di esempio' }).click();
    await expectPage(page, '');
    // Oggi propone le schede di esempio, con la prima già selezionata (US-11)
    await expect(page.getByRole('radio', { name: /^Scheda A/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: /^Scheda B/ })).toBeVisible();
    expect((await storedArchive(page))?.routines.map((r) => r.id)).toEqual(['routine-a', 'routine-b']);
    // la conservazione dei dati si chiede dopo la scelta
    expect(await page.evaluate(() => (window as unknown as { persistCalls: number }).persistCalls)).toBe(1);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Inizia allenamento' })).toBeVisible();
    await expectPage(page, '');
  });

  test('US-01 "Parti da zero" salva un diario vuoto e non mostra più il benvenuto', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Parti da zero' }).click();
    await expectPage(page, '');
    await expect(page.getByText('Non hai schede attive.', { exact: false })).toBeVisible();
    const archive = await storedArchive(page);
    expect(archive?.routines).toEqual([]);
    expect(archive?.revision).toBe(1);

    await page.goto('');
    await expect(page.getByRole('button', { name: 'Allenamento libero' })).toBeVisible();
    await expectPage(page, '');
  });

  test('US-01 a 320×568 le azioni restano in vista senza scorrere', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('welcome/');
    for (const name of ['Inizia con le schede di esempio', 'Parti da zero', 'Importa un backup']) {
      await expect(page.getByRole('button', { name })).toBeInViewport();
    }
  });
});
