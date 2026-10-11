import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { archiveWith, chooseFile, seedArchive, session, sheet, storedArchive } from './helpers';

// US-32: esportare un backup e reimportarlo, con anteprima e scelta "mantieni" o "sostituisci".

test.describe('US-32 backup', () => {
  test('US-32 esporta un backup v2 e lo reimporta: tutto già presente', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('s1', '2026-10-01'), session('s2', '2026-10-03')] }));
    await page.goto('settings/');
    await expect(page.getByTestId('archive-summary')).toContainText('Ultimo backup da questo browser: mai.');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Esporta backup' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^workout-tracker-\d{4}-\d{2}-\d{2}\.json$/);
    const text = readFileSync((await file.path())!, 'utf8');
    const backup = JSON.parse(text);
    expect(backup).toMatchObject({ version: 2 });
    expect(backup.sessions.map((s: { id: string }) => s.id)).toEqual(['s1', 's2']);
    await expect(page.getByText(`Backup esportato: ${file.suggestedFilename()}`)).toBeVisible();
    await expect(page.getByTestId('archive-summary')).not.toContainText('mai');

    await chooseFile(page, 'Importa backup', file.suggestedFilename(), text);
    await expect(sheet(page).getByRole('heading', { name: 'Importa backup' })).toBeVisible();
    await expect(sheet(page).getByText('2 allenamenti dal 1 ottobre 2026 al 3 ottobre 2026')).toBeVisible();
    await expect(sheet(page).getByText('0 nuovi, 2 già presenti su questo dispositivo')).toBeVisible();
  });

  for (const [choice, label, kg, outcome] of [
    ['keep', 'Mantieni quelli di questo dispositivo', 50, '1 allenamento già presente lasciato com’era'],
    ['replace', 'Sostituisci con quelli del backup', 60, '1 allenamento sostituito con la versione del backup'],
  ] as const) {
    test(`US-32 import con "${choice === 'keep' ? 'mantieni' : 'sostituisci'}" per gli allenamenti già presenti`, async ({ page }) => {
      await seedArchive(page, archiveWith({ sessions: [session('s1', '2026-10-01', 50)] }));
      const backup = archiveWith({ sessions: [session('s1', '2026-10-01', 60), session('s9', '2026-10-05', 70)], settings: { weightUnit: 'lb', distanceUnit: 'm', defaultRest: 90, sound: true, vibration: true } });
      await page.goto('settings/');
      await chooseFile(page, 'Importa backup', 'backup.json', JSON.stringify(backup));
      await expect(sheet(page).getByText('1 nuovo, 1 già presente su questo dispositivo')).toBeVisible();
      await sheet(page).getByRole('radio', { name: new RegExp(label) }).check();
      await sheet(page).getByRole('button', { name: 'Importa' }).click();
      await expect(sheet(page).getByText('1 allenamento aggiunto')).toBeVisible();
      await expect(sheet(page).getByText(outcome)).toBeVisible();

      const archive = await storedArchive(page);
      expect(archive?.sessions.map((s) => [s.id, s.exercises[0].sets[0].kg])).toEqual([
        ['s1', kg],
        ['s9', 70],
      ]);
      // le impostazioni del backup arrivano solo con "sostituisci"
      expect(archive?.settings.weightUnit).toBe(choice === 'replace' ? 'lb' : 'kg');
    });
  }

  test('US-32 un file non valido o troppo grande non modifica nulla', async ({ page }) => {
    const original = archiveWith({ sessions: [session('s1', '2026-10-01')] });
    await seedArchive(page, original);
    await page.goto('settings/');

    await chooseFile(page, 'Importa backup', 'rotto.json', '{ non è json');
    await expect(sheet(page).getByRole('heading', { name: 'Backup non importato' })).toBeVisible();
    await expect(sheet(page).getByRole('alert')).toHaveText('Il file non è un backup leggibile (JSON non valido).');
    await expect(sheet(page).getByText('Nessun dato è stato modificato.')).toBeVisible();
    await sheet(page).locator('footer').getByRole('button', { name: 'Chiudi' }).click();

    await chooseFile(page, 'Importa backup', 'grande.json', Buffer.alloc(10 * 1024 * 1024 + 1, 32));
    await expect(sheet(page).getByRole('alert')).toHaveText('Il file supera il limite di 10 MB.');
    await sheet(page).locator('footer').getByRole('button', { name: 'Chiudi' }).click();

    await chooseFile(page, 'Importa backup', 'altro.json', JSON.stringify({ version: 2, sessions: 'no' }));
    await expect(sheet(page).getByRole('alert')).toContainText('Il backup non è valido');
    expect((await storedArchive(page))?.sessions.map((s) => s.id)).toEqual(['s1']);
  });

  test('US-32 cancellare tutto chiede una conferma precisa e si può annullare', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [session('s1', '2026-10-01'), session('s2', '2026-10-02')], settings: { weightUnit: 'lb', distanceUnit: 'm', defaultRest: 90, sound: true, vibration: true } }));
    await page.goto('settings/');
    await page.getByRole('button', { name: 'Cancella tutto il diario' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancellare tutto il diario?' });
    await expect(dialog).toContainText('2 allenamenti, 0 schede, 0 esercizi personalizzati');
    await dialog.getByRole('button', { name: 'Cancella tutto' }).click();
    await expect.poll(async () => (await storedArchive(page))?.sessions.length).toBe(0);
    expect((await storedArchive(page))?.settings.weightUnit).toBe('lb');
    await expect(page.getByTestId('archive-summary')).toContainText('Il diario è vuoto.');

    await page.getByRole('button', { name: 'Annulla' }).click();
    await expect.poll(async () => (await storedArchive(page))?.sessions.length).toBe(2);
    await expect(page.getByTestId('archive-summary')).toContainText('2 allenamenti');
  });
});
