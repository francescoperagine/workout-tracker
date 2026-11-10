import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { startSession, validateArchive, type Archive } from '../../src/lib/archive';
import { seedArchive, sheet, storedArchive } from './helpers';

// Catalogo senza doppioni (US-35: alias e unione dei personalizzati) e serie vuote con l'ultima volta e la
// scheda come segnaposto (US-36, INC-013), sul diario vero di Francesco al 5 novembre 2026 (sola lettura).
// "Oggi" è giovedì 5 novembre 2026 alle 18:00 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-11-05T18:00:00+01:00');
const fixture = (): Archive =>
  validateArchive(JSON.parse(readFileSync(new URL('../fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8')));

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

async function openPicker(page: Page) {
  await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
  await expect(sheet(page).getByLabel('Cerca o scrivi il nome')).toBeVisible();
}

test.describe('US-35 catalogo senza doppioni', () => {
  test('US-35 un alias trova l’esercizio che c’è già, al posto di «Crea»', async ({ page }) => {
    await seedArchive(page, fixture());
    await page.goto('routine/?id=routine-b');
    await openPicker(page);
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('Romanian deadlift');
    await expect(sheet(page).getByRole('button', { name: /^Crea/ })).toHaveCount(0);
    await sheet(page).getByRole('button', { name: 'Esiste già «Stacco rumeno bilanciere»: usa questo' }).click();
    await expect(page.getByRole('button', { name: /^8\. Stacco rumeno bilanciere/ })).toBeVisible();
    expect((await storedArchive(page))!.routines[1].exercises.at(-1)?.exerciseId).toBe('stacco-rumeno-bilanciere');
  });

  test('US-35 unisce un personalizzato a un altro esercizio, con la conferma che dice cosa cambia', async ({ page }) => {
    await seedArchive(page, fixture());
    await page.goto('routine/?id=routine-b');
    await openPicker(page);
    // il doppione inglese: la destinazione proposta in testa è il predefinito con lo stesso nome
    await sheet(page).getByRole('button', { name: 'Unisci Romanian deadlift in un altro esercizio' }).click();
    const merge = page.getByRole('dialog', { name: 'Unisci «Romanian deadlift» in…' });
    await expect(merge.getByRole('listitem').first()).toContainText('Stacco rumeno bilanciere');
    await expect(merge.getByRole('listitem').first()).toContainText('stesso nome');
    await merge.getByRole('button', { name: /^Stacco rumeno bilanciere/ }).click();

    const confirm = page.getByRole('dialog', { name: 'Unire «Romanian deadlift» a «Stacco rumeno bilanciere»?' });
    await expect(confirm).toContainText('Cambiano 1 allenamento. Non si può annullare.');
    await confirm.getByRole('button', { name: 'Unisci' }).click();

    await expect(page.getByRole('dialog', { name: 'Aggiungi esercizio' }).getByRole('status').filter({ hasText: 'unito' })).toHaveText(
      'Romanian deadlift è stato unito a Stacco rumeno bilanciere.',
    );
    await expect(sheet(page).getByRole('button', { name: /^Romanian deadlift/ })).toHaveCount(0);
    const saved = (await storedArchive(page))!;
    expect(saved.catalog['custom-romanian-deadlift']).toBeUndefined();
    const nov4 = saved.sessions.find((s) => s.date === '2026-11-04')!;
    expect(nov4.exercises[0]).toMatchObject({ exerciseId: 'stacco-rumeno-bilanciere', alternativeOf: 'squat-bilanciere' });

    // custom con custom: sceglie la destinazione chi unisce; Annulla nella conferma non unisce nulla
    await sheet(page).getByRole('button', { name: 'Unisci Leg curl seduto in un altro esercizio' }).click();
    await page.getByRole('dialog', { name: 'Unisci «Leg curl seduto» in…' }).getByLabel('Cerca o scrivi il nome').fill('leg curl');
    await page.getByRole('dialog', { name: 'Unisci «Leg curl seduto» in…' }).getByRole('button', { name: /^Leg curl personalizzato/ }).click();
    const second = page.getByRole('dialog', { name: 'Unire «Leg curl seduto» a «Leg curl»?' });
    await expect(second).toContainText('Cambiano 1 allenamento. Non si può annullare.');
    await second.getByRole('button', { name: 'Annulla' }).click();
    expect((await storedArchive(page))!.catalog['custom-leg-curl-seduto']).toBeDefined();
  });
});

test.describe('US-36 l’ultima volta e la scheda come segnaposto', () => {
  test('US-36 un esercizio aggiunto entra vuoto, con i valori dell’ultima volta come segnaposto da confermare', async ({ page }) => {
    const { archive } = startSession(fixture(), null, NOW.getTime() - 600_000);
    await seedArchive(page, archive);
    await page.goto('workout/');
    await openPicker(page);
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('rematore al cavo basso');
    await sheet(page).getByRole('button', { name: 'Rematore seduto al cavo basso', exact: true }).click();

    // il 4 novembre (con l’id tolto, reindirizzato): 25 × 12, 32 × 14, 39 × 10, 39 × 8, 32 × 10, nei segnaposto e non nei campi
    const row = page.getByRole('region', { name: 'Rematore seduto al cavo basso', exact: true });
    const expected = [
      ['25', '12'],
      ['32', '14'],
      ['39', '10'],
      ['39', '8'],
      ['32', '10'],
    ];
    for (const [i, [kg, reps]] of expected.entries()) {
      const kgField = row.getByRole('textbox', { name: `Peso serie ${i + 1}, kg` });
      const repsField = row.getByRole('textbox', { name: `Ripetizioni serie ${i + 1}` });
      await expect(kgField).toHaveValue('');
      await expect(kgField).toHaveAttribute('placeholder', kg);
      await expect(repsField).toHaveValue('');
      await expect(repsField).toHaveAttribute('placeholder', reps);
    }
    const added = (await storedArchive(page))!.sessions.find((s) => s.end === null)!.exercises[0];
    expect(added.sets.map((s) => [s.kg, s.reps, s.completedAt])).toEqual(Array.from({ length: 5 }, () => [null, null, null]));

    // senza spunte non si conclude
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByText('Registra almeno una serie prima di terminare, oppure annulla l’allenamento.')).toBeVisible();

    // la spunta su una riga vuota conferma il segnaposto
    await row.getByRole('button', { name: 'Segna serie 2 come fatta' }).click();
    await expect(row.getByRole('textbox', { name: 'Peso serie 2, kg' })).toHaveValue('32');
    const set = (await storedArchive(page))!.sessions.find((s) => s.end === null)!.exercises[0].sets[1];
    expect([set.kg, set.reps, set.completedAt !== null]).toEqual([32, 14, true]);
  });

  test('US-36 senza storico il segnaposto è il target della scheda', async ({ page }) => {
    const { archive } = startSession(fixture(), 'routine-a', NOW.getTime() - 600_000);
    await seedArchive(page, archive);
    await page.goto('workout/');
    // leg curl mai spuntato, scheda «10–15» senza carico: 10 ripetizioni, kg vuoto
    const curl = page.getByRole('region', { name: 'Leg curl', exact: true });
    await expect(curl.getByRole('textbox', { name: 'Peso serie 1, kg' })).toHaveAttribute('placeholder', '');
    await expect(curl.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toHaveAttribute('placeholder', '10');
    await curl.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const done = (await storedArchive(page))!.sessions.find((s) => s.end === null)!.exercises[3].sets[0];
    expect([done.kg, done.reps, done.completedAt !== null]).toEqual([null, 10, true]);
  });

  test('US-36 senza storico né scheda niente segnaposto: la spunta porta al campo Rip, mai al kg', async ({ page }) => {
    const free = startSession(fixture(), null, NOW.getTime() - 600_000);
    await seedArchive(page, free.archive);
    await page.goto('workout/');
    await openPicker(page);
    // la leg press non c'è nel diario
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('Leg press');
    await sheet(page).getByRole('button', { name: 'Leg press', exact: true }).click();
    const fresh = page.getByRole('region', { name: 'Leg press', exact: true });
    await fresh.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(fresh.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toBeFocused();
    await expect(fresh.getByRole('button', { name: 'Segna serie 1 come fatta' })).toHaveAttribute('aria-pressed', 'false');
  });
});
