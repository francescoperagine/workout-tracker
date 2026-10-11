import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { archiveWith, chooseFile, seedArchive, seedStorage, sheet, storedArchive } from './helpers';

// US-33: avvisi se il salvataggio fallisce, se il diario cambia in un'altra scheda o se è illeggibile,
// senza mai sovrascrivere nulla in silenzio (P4).

/** Il browser rifiuta di scrivere l'archivio, come con lo spazio esaurito */
async function failWrites(page: Page, fail: boolean) {
  await page.evaluate((on) => {
    const w = window as unknown as { originalSetItem?: Storage['setItem'] };
    w.originalSetItem ??= Storage.prototype.setItem;
    const original = w.originalSetItem;
    Storage.prototype.setItem = on
      ? function (this: Storage, key: string, value: string) {
          if (key === 'workout-tracker.archive.v2') throw new DOMException('Spazio esaurito', 'QuotaExceededError');
          return original.call(this, key, value);
        }
      : original;
  }, fail);
}

const saveBar = (page: Page) => page.getByRole('status').filter({ hasText: /Non salvato|Il diario è cambiato|non è leggibile/ });

test.describe('US-33 stato del salvataggio', () => {
  test('US-33 con lo spazio esaurito le modifiche restano in pagina e "Salva ora" riprova', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    await expect(saveBar(page)).toHaveCount(0);
    await failWrites(page, true);
    await page.getByRole('radio', { name: 'lb' }).check();
    await expect(saveBar(page)).toContainText('Non salvato: spazio esaurito. I dati restano in questa pagina.');
    expect((await storedArchive(page))?.settings.weightUnit).toBe('kg');

    await failWrites(page, false);
    await page.getByRole('button', { name: 'Salva ora' }).click();
    await expect(saveBar(page)).toHaveCount(0);
    expect((await storedArchive(page))?.settings.weightUnit).toBe('lb');
  });

  test('US-33 senza modifiche in sospeso una scheda adotta il diario cambiato in un’altra', async ({ page, context }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    const other = await context.newPage();
    await other.goto('settings/');
    await other.getByRole('radio', { name: 'lb' }).check();
    await expect(page.getByRole('radio', { name: 'lb' })).toBeChecked();
    await expect(saveBar(page)).toHaveCount(0);
  });

  test('US-33 con modifiche in sospeso il cambiamento in un’altra scheda blocca e chiede di ricaricare', async ({ page, context }) => {
    await seedArchive(page, archiveWith());
    await page.goto('settings/');
    const other = await context.newPage();
    await other.goto('settings/');

    await failWrites(page, true);
    await page.getByRole('radio', { name: 'lb' }).check();
    await other.getByRole('radio', { name: 'ft' }).check();
    await expect(saveBar(page)).toContainText('Il diario è cambiato in un’altra scheda');
    await failWrites(page, false);
    // nessuna sovrascrittura: il diario dell'altra scheda resta
    expect((await storedArchive(page))?.settings).toMatchObject({ weightUnit: 'kg', distanceUnit: 'ft' });

    await page.getByRole('button', { name: 'Ricarica' }).click();
    await expect(saveBar(page)).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'ft' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'kg' })).toBeChecked();
  });

  test('US-33 archivio illeggibile: niente sovrascrittura, contenuto originale scaricabile, import di un backup', async ({ page }) => {
    await seedStorage(page, 'workout-tracker.archive.v2', '{"version":2,"rotto"');
    await page.goto('');
    // non è un primo avvio: niente benvenuto, ma l'avviso con il rimando al recupero
    await expect(saveBar(page)).toContainText('Il diario salvato non è leggibile');
    await expect(page).not.toHaveURL(/welcome/);
    await expect(page.getByRole('heading', { name: 'Il diario salvato non è leggibile' })).toBeVisible();
    await page.getByRole('link', { name: 'Recupera' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Non riesco a leggere il diario salvato' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Esporta backup' })).toBeDisabled();
    await page.getByRole('radio', { name: 'lb' }).click();
    await expect(page.getByText('Impostazione non salvata: prima recupera il diario o ricarica.')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'kg' })).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker.archive.v2'))).toBe('{"version":2,"rotto"');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Scarica il contenuto originale' }).click();
    expect(readFileSync((await (await download).path())!, 'utf8')).toBe('{"version":2,"rotto"');

    await chooseFile(page, 'Importa backup', 'backup.json', JSON.stringify(archiveWith({ routines: [] })));
    await expect(sheet(page).getByText('il suo contenuto viene sostituito')).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Importa' }).click();
    await sheet(page).getByRole('button', { name: 'Fatto' }).click();
    await expect(saveBar(page)).toHaveCount(0);
    expect((await storedArchive(page))?.version).toBe(2);
  });
});
