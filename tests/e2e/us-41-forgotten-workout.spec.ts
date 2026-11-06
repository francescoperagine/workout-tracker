import { expect, test, type Page } from '@playwright/test';
import { startSession, starterRoutines, type Archive } from '../../src/lib/archive';
import { archiveWith, seedArchive, storedArchive } from './helpers';

// Allenamento dimenticato aperto (US-41): oltre 3 ore dall'ultima serie spuntata (o dall'inizio) l'allenamento
// e Oggi propongono di terminarlo all'ora dell'ultima serie, o di annullarlo se non ha serie.
// "Oggi" è venerdì 6 novembre 2026 alle 9:00 (il browser dei test è in Europe/Rome); l'orologio finto resta
// fermo finché il test non lo fa scorrere.

const NOW = new Date('2026-11-06T09:00:00+01:00');
const at = (time: string) => new Date(`${time}+01:00`).getTime();

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(NOW);
});

/** Scheda A iniziata a `start`; con `lastSet` la prima serie è spuntata a quell'ora */
function running(start: number, lastSet: number | null = null): Archive {
  const { archive, session } = startSession(archiveWith({ routines: starterRoutines() }), 'routine-a', start);
  if (lastSet !== null) Object.assign(session.exercises[0].sets[0], { kg: 45, reps: 6, completedAt: lastSet });
  return archive;
}

const forgottenSheet = (page: Page) => page.getByRole('dialog', { name: 'Allenamento ancora aperto' });
const stored = async (page: Page) => (await storedArchive(page))!.sessions;

test.describe('US-41 allenamento dimenticato', () => {
  test('US-41 aprendo l’allenamento, «Termina alle 17:42» lo conclude all’ora dell’ultima serie', async ({ page }) => {
    await seedArchive(page, running(at('2026-11-05T17:30:00'), at('2026-11-05T17:42:00')));
    await page.goto('workout/');
    const sheet = forgottenSheet(page);
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Ultima serie alle 17:42 di ieri.');
    await sheet.getByRole('button', { name: 'Termina alle 17:42' }).click();

    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await expect(page).toHaveURL(/\/workout\/\?summary=/);
    expect((await stored(page))[0].end).toBe(at('2026-11-05T17:42:00'));
  });

  test('US-41 da Oggi «Continua» lo lascia in corso e non si ripropone nella stessa visita', async ({ page }) => {
    await seedArchive(page, running(at('2026-11-05T17:30:00'), at('2026-11-05T17:42:00')));
    await page.goto('');
    const sheet = forgottenSheet(page);
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Continua' }).click();
    await expect(sheet).toBeHidden();

    // il tempo passa (Oggi aggiorna l'ora ogni 30 s): il foglio non torna, l'allenamento resta in corso
    await page.clock.runFor(65_000);
    await expect(sheet).toBeHidden();
    expect((await stored(page))[0].end).toBeNull();
    await expect(page.getByRole('link', { name: 'Riprendi allenamento' })).toBeVisible();

    // una visita nuova lo ripropone
    await page.reload();
    await expect(forgottenSheet(page)).toBeVisible();
  });

  test('US-41 senza serie fatte «Annulla allenamento», con «Annulla» nell’avviso', async ({ page }) => {
    await seedArchive(page, running(at('2026-11-06T05:30:00')));
    await page.goto('workout/');
    const sheet = forgottenSheet(page);
    await expect(sheet).toContainText('Iniziato alle 05:30, senza serie fatte.');
    await expect(sheet.getByRole('button', { name: /^Termina/ })).toHaveCount(0);
    await sheet.getByRole('button', { name: 'Annulla allenamento' }).click();

    const toast = page.getByRole('status').filter({ hasText: 'Allenamento annullato.' });
    await expect(toast).toBeVisible();
    expect(await stored(page)).toEqual([]);
    await toast.getByRole('button', { name: 'Annulla' }).click();
    await expect.poll(async () => (await stored(page)).map((s) => s.end)).toEqual([null]);
  });

  test('US-41 entro 3 ore dall’ultima serie nessun foglio', async ({ page }) => {
    // iniziato da più di 3 ore, ma l'ultima serie è di 2 ore fa
    await seedArchive(page, running(at('2026-11-06T05:30:00'), at('2026-11-06T07:00:00')));
    await page.goto('workout/');
    await expect(page.getByRole('heading', { name: 'Scheda A' })).toBeVisible();
    await expect(forgottenSheet(page)).toBeHidden();
    await page.goto('');
    await expect(page.getByRole('link', { name: 'Riprendi allenamento' })).toBeVisible();
    await expect(forgottenSheet(page)).toBeHidden();
  });
});
