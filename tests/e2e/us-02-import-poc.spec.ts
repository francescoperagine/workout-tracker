import { expect, test } from '@playwright/test';
import { POC_BACKUP, archiveWith, chooseFile, expectPage, seedArchive, seedStorage, sheet, storedArchive } from './helpers';

// US-02: importare il diario del PoC, da file di backup o dalla sua chiave sulla stessa origine,
// con anteprima (allenamenti e periodo), conferma e riepilogo degli scartati con il motivo.
// Backup sintetico: 4 allenamenti validi dal 1 all'8 settembre 2026, 3 elementi scartati, schede A e B.

test.describe('US-02 import del diario del PoC', () => {
  test('US-02 import del file del PoC dalle Impostazioni, con anteprima e scartati', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    await chooseFile(page, 'Importa backup', 'bodytracker-poc.json', POC_BACKUP);

    const preview = sheet(page);
    await expect(preview.getByRole('heading', { name: 'Diario della versione precedente' })).toBeVisible();
    await expect(preview.getByText('4 allenamenti dal 1 settembre 2026 all’8 settembre 2026')).toBeVisible();
    await expect(preview.getByText('4 nuovi, 0 già presenti su questo dispositivo')).toBeVisible();
    await expect(preview.getByText('3 elementi scartati')).toBeVisible();
    await expect(preview.getByText('data non valida')).toBeVisible();
    // senza elementi in comune non c'è nulla da scegliere
    await expect(preview.getByRole('radio')).toHaveCount(0);
    // fino alla conferma nulla cambia
    expect((await storedArchive(page))?.sessions).toEqual([]);

    await preview.getByRole('button', { name: 'Importa' }).click();
    await expect(preview.getByRole('heading', { name: 'Backup importato' })).toBeVisible();
    await expect(preview.getByText('4 allenamenti aggiunti')).toBeVisible();
    await expect(preview.getByText('Non importati')).toBeVisible();
    await expect(preview.getByText('identificativo duplicato nel file')).toBeVisible();
    await preview.getByRole('button', { name: 'Fatto' }).click();

    const archive = await storedArchive(page);
    expect(archive?.sessions.map((s) => s.id)).toEqual(['poc-1', 'poc-2', 'poc-3', 'poc-5']);
    // varianti ed esercizi riconosciuti dagli ID
    expect(archive?.sessions[0].exercises[1]).toMatchObject({ exerciseId: 'chest-press', variantOf: 'panca-piana-bilanciere' });
    await expect(page.getByTestId('archive-summary')).toContainText('4 allenamenti, 2 schede');
  });

  test('US-02 reimportare lo stesso file chiede se mantenere o sostituire', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    await chooseFile(page, 'Importa backup', 'poc.json', POC_BACKUP);
    await sheet(page).getByRole('button', { name: 'Importa' }).click();
    await sheet(page).getByRole('button', { name: 'Fatto' }).click();

    await chooseFile(page, 'Importa backup', 'poc.json', POC_BACKUP);
    await expect(sheet(page).getByText('0 nuovi, 4 già presenti su questo dispositivo')).toBeVisible();
    await expect(sheet(page).getByRole('radio', { name: /Mantieni quelli di questo dispositivo/ })).toBeChecked();
    await sheet(page).getByRole('button', { name: 'Importa' }).click();
    await expect(sheet(page).getByText('4 allenamenti già presenti lasciati com’era')).toBeVisible();
  });

  test('US-02 al primo avvio propone il diario della versione precedente trovato sulla stessa origine', async ({ page }) => {
    await seedStorage(page, 'bodytracker.archivio.v1', POC_BACKUP);
    await page.goto('');
    await expectPage(page, 'welcome/');
    await expect(page.getByText('Ho trovato il diario della versione precedente su questo dispositivo.')).toBeVisible();
    // l'import diventa l'azione principale
    await expect(page.getByRole('button', { name: 'Importa il diario' })).toHaveClass(/btn-primary/);
    await expect(page.getByRole('button', { name: 'Inizia con le schede di esempio' })).toHaveClass(/btn-secondary/);

    await page.getByRole('button', { name: 'Importa il diario' }).click();
    await expect(sheet(page).getByText('4 allenamenti dal 1 settembre 2026 all’8 settembre 2026')).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Importa' }).click();
    await sheet(page).getByRole('button', { name: 'Fatto' }).click();
    await expectPage(page, '');
    await expect(page.getByText('2 schede (Scheda A, Scheda B), 4 allenamenti')).toBeVisible();
    // la chiave del PoC si legge soltanto
    expect(await page.evaluate(() => localStorage.getItem('bodytracker.archivio.v1'))).toBe(POC_BACKUP);
  });
});

test('US-02 con le sole schede A/B già presenti non chiede di scegliere: il PoC non le sostituisce', async ({ page }) => {
  await page.goto('welcome/');
  await page.getByRole('button', { name: 'Inizia con le schede di esempio' }).click();
  await page.getByRole('link', { name: 'Impostazioni', exact: true }).click();
  await chooseFile(page, 'Importa backup', 'poc.json', POC_BACKUP);
  await expect(sheet(page).getByText('4 nuovi, 0 già presenti su questo dispositivo')).toBeVisible();
  await expect(sheet(page).getByRole('radio')).toHaveCount(0);
});
