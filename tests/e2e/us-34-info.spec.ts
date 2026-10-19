import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive } from './helpers';

// Pagina Info (US-34): raggiungibile dalla «?» dell'intestazione, contatti senza richieste di rete.

test('US-34 la «?» dell’intestazione porta a Info da ogni pagina con intestazione', async ({ page }) => {
  await seedArchive(page, archiveWith());
  for (const path of ['', 'calendar/', 'routines/', 'history/', 'settings/', 'workout/']) {
    await page.goto(path);
    await expect(page.getByRole('link', { name: 'Informazioni' })).toHaveAttribute('href', /\/info\/$/);
  }
  await page.getByRole('link', { name: 'Informazioni' }).click();
  await expect(page.getByRole('heading', { name: 'Il progetto' })).toBeVisible();
  // nella pagina Info la «?» non c'è, l'ingranaggio sì; la tab bar non ha una voce Info
  await expect(page.getByRole('link', { name: 'Informazioni' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Impostazioni', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link')).toHaveCount(4);
});

test('US-34 Info: contatti, mailto con oggetto e collegamento all’export', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(new URL(page.url() || 'http://localhost').origin)) external.push(request.url());
  });
  await seedArchive(page, archiveWith());
  await page.goto('info/');
  external.length = 0;
  await page.reload();

  await expect(page.getByRole('link', { name: 'info@francescoperagine.com' })).toHaveAttribute(
    'href',
    'mailto:info@francescoperagine.com?subject=Workout%20Tracker',
  );
  await expect(page.getByRole('link', { name: 'Francesco Peragine' })).toHaveAttribute('href', 'https://francescoperagine.com');
  await expect(page.getByRole('link', { name: 'linkedin.com/in/fperagine' })).toHaveAttribute('href', 'https://linkedin.com/in/fperagine');
  expect(external).toEqual([]);

  await page.getByRole('link', { name: 'Esporta un backup in Impostazioni' }).click();
  await expect(page).toHaveURL(/\/settings\/#data$/);
  await expect(page.getByRole('button', { name: 'Esporta backup' })).toBeInViewport();
});
