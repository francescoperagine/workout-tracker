import { expect, test, type Page } from '@playwright/test';
import { archiveWith, expectPage, seedArchive, session } from './helpers';

// US-47 e US-48 (delavier-catalog, incremento 4): Progressi è il catalogo, con ricerca per nome e alias e
// «Solo fatti»; la pagina dell'esercizio ha le tab «Progressi» e «Info».

const list = (page: Page) => page.getByRole('region', { name: 'Esercizi' }).getByRole('listitem');
const onlyDone = (page: Page) => page.getByRole('switch', { name: 'Solo fatti' });

test.describe('US-47 Progressi come catalogo', () => {
  test('US-47 cerca per alias, spegne «Solo fatti», apre un esercizio mai fatto e arriva a Info', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('a', '2026-10-01')] }));
    await page.goto('progress/');

    // «Solo fatti» acceso all'apertura: solo lo squat della sessione
    await expect(onlyDone(page)).toBeChecked();
    await expect(list(page)).toHaveCount(1);
    await expect(list(page).first()).toContainText('Squat bilanciere');

    // l'alias inglese del Delavier trova lo stacco, ma non è fatto
    await page.getByLabel('Cerca per nome').fill('deadlifts');
    await expect(list(page)).toHaveCount(0);
    await expect(page.getByText('Nessun esercizio fatto con questo nome.')).toBeVisible();
    await onlyDone(page).uncheck();
    // in ordine alfabetico anche durante la ricerca
    await expect(list(page)).toHaveText([/^Stacco a gambe tese/, /^Stacco con trap bar/, /^Stacco da terra/, /^Stacco sumo/]);
    const deadlift = list(page).filter({ hasText: 'Stacco da terra' });
    await expect(deadlift).toContainText('–');
    await expect(deadlift.getByRole('link')).toHaveAccessibleName(/Stacco da terra.*mai fatto/);

    await deadlift.getByRole('link').click();
    await expectPage(page, 'exercise/');
    await expect(page.getByRole('tab', { name: 'Progressi' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Ancora nessuna serie')).toBeVisible();
    await page.getByRole('link', { name: 'Muscoli e informazioni' }).click();
    await expect(page.getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Info' })).toBeFocused();
    await expect(page).toHaveURL(/id=stacco-da-terra&tab=info$/);
    await expect(page.getByRole('region', { name: 'Muscoli' })).toContainText('Dorsali: 1 serie');
  });

  test('US-47 una nuova apertura riaccende «Solo fatti»', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('a', '2026-10-01')] }));
    await page.goto('progress/');
    await onlyDone(page).uncheck();
    await expect(list(page).nth(1)).toBeVisible();
    await page.reload();
    await expect(onlyDone(page)).toBeChecked();
    await expect(list(page)).toHaveCount(1);
  });
});

test.describe('US-48 tab della pagina dell’esercizio', () => {
  test('US-48 «Progressi» per prima, «Info» con le frecce; la tab resta dopo un ricaricamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('a', '2026-10-01')] }));
    await page.goto('exercise/?id=squat-bilanciere');

    const progress = page.getByRole('tab', { name: 'Progressi' });
    const info = page.getByRole('tab', { name: 'Info' });
    await expect(progress).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Progressi' })).toContainText('Cronologia delle serie');
    await expect(page.getByRole('region', { name: 'Muscoli' })).toHaveCount(0);

    await progress.focus();
    await page.keyboard.press('ArrowRight');
    await expect(info).toBeFocused();
    await expect(info).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel', { name: 'Info' });
    await expect(panel.getByRole('region', { name: 'Muscoli' })).toContainText('Quadricipiti: 1 serie');
    await expect(panel.getByRole('region', { name: 'Approfondimento' })).toContainText('Si chiama anche: Squat, Back squat');
    await expect(panel).not.toContainText('Cronologia delle serie');

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Progressi' }).click();
    await expect(page).toHaveURL(/id=squat-bilanciere$/);
  });

  test('US-48 «Unisci in…» dalla tab Info di un personalizzato porta all’esercizio che resta', async ({ page }) => {
    const custom = { 'custom-squat': { id: 'custom-squat', name: 'Squat', muscles: {}, variantOf: null } };
    await seedArchive(page, archiveWith({ catalog: custom }));
    await page.goto('exercise/?id=custom-squat&tab=info');

    await page.getByRole('button', { name: 'Unisci in…' }).click();
    const dialog = page.getByRole('dialog', { name: 'Unisci «Squat» in…' });
    await expect(dialog.getByRole('button', { name: 'Torna al catalogo' })).toHaveCount(0);
    await dialog.getByRole('button', { name: /^Squat bilanciere/ }).first().click();
    await page.getByRole('dialog', { name: 'Unire «Squat» a «Squat bilanciere»?' }).getByRole('button', { name: 'Unisci' }).click();
    await expect(page).toHaveURL(/id=squat-bilanciere$/);
    await expect(page.getByRole('heading', { name: 'Squat bilanciere', exact: true })).toBeVisible();
  });
});
