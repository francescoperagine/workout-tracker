import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive } from './helpers';

// US-03: installabile e usabile offline dopo la prima visita, senza richieste a domini esterni (P6).
// Il service worker è bloccato negli altri test (playwright.config.ts): qui si riattiva.
test.use({ serviceWorkers: 'allow' });

test.describe('US-03 app installabile e offline', () => {
  test('US-03 dopo la prima visita l’app si apre e naviga senza rete', async ({ page, context }) => {
    await seedArchive(page, archiveWith());
    await page.goto('');
    await expect(page.getByText('Il diario è pronto')).toBeVisible();
    // il service worker è attivo (precache completato) e controlla la pagina
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Il diario è pronto')).toBeVisible();
    const tabs = page.getByRole('navigation', { name: 'Sezioni' });
    await tabs.getByRole('link', { name: 'Calendario' }).click();
    await expect(page.getByRole('heading', { name: 'In arrivo: il calendario' })).toBeVisible();
    await page.goto('settings/');
    await expect(page.getByRole('heading', { name: 'Dati e privacy' })).toBeVisible();
    await page.goto('welcome/?da=offline');
    await expect(page.getByRole('button', { name: 'Parti da zero' })).toBeVisible();
    // anche il carattere arriva dal precache
    expect(await page.evaluate(() => document.fonts.ready.then(() => document.fonts.check('16px "Atkinson Hyperlegible Next"')))).toBe(true);
  });

  test('US-03 manifest con avvio e scope nel percorso base, e icone raggiungibili', async ({ page, request, baseURL }) => {
    const base = new URL(baseURL!).pathname;
    await page.goto('welcome/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe(`${base}manifest.webmanifest`);
    const manifest = await (await request.get('manifest.webmanifest')).json();
    expect(manifest).toMatchObject({ name: 'BodyTracker', lang: 'it', display: 'standalone', start_url: base, scope: base });
    expect(manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`)).toEqual(
      expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']),
    );
    for (const icon of manifest.icons) expect((await request.get(new URL(icon.src, baseURL).href)).status()).toBe(200);
    expect((await request.get('sw.js')).status()).toBe(200);
  });

  test('US-03 nessuna richiesta fuori dall’app, tutte nel percorso base', async ({ page, baseURL }) => {
    const app = new URL(baseURL!);
    const outside: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (url.origin !== app.origin || !url.pathname.startsWith(app.pathname)) outside.push(request.url());
    });
    await page.goto('');
    await page.getByRole('button', { name: 'Inizia con le schede di esempio' }).click();
    await expect(page.getByText('Il diario è pronto')).toBeVisible();
    for (const name of ['Calendario', 'Schede', 'Storico']) await page.getByRole('link', { name }).click();
    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Oggi' }).click();
    await page.getByRole('link', { name: 'Impostazioni', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dati e privacy' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    expect(outside).toEqual([]);
  });

  test.describe('su iPhone, nel browser', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    });

    test('US-03 le Impostazioni avvisano dei 7 giorni e spiegano come installare', async ({ page }) => {
      await seedArchive(page, archiveWith());
      await page.goto('settings/');
      await expect(page.getByText('Safari cancella i dati dei siti che non apri da 7 giorni')).toBeVisible();
      await expect(page.getByText('In Safari tocca Condividi, poi «Aggiungi alla schermata Home».')).toBeVisible();
    });
  });

  test('US-03 nessun invito all’installazione al primo avvio', async ({ page }) => {
    await page.goto('welcome/');
    await expect(page.getByRole('button', { name: /Installa/ })).toHaveCount(0);
  });
});
