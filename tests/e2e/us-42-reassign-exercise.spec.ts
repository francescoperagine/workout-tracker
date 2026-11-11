import { expect, test, type Page } from '@playwright/test';
import type { Session } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// US-42: correggere un allenamento concluso in cui si è scelto l'esercizio sbagliato, dalla cronologia
// della pagina dei progressi. "Oggi" è giovedì 8 ottobre 2026 alle 18:30 (Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

/** Sessione conclusa con una voce dell'esercizio indicato */
function done(id: string, date: string, exerciseId: string, kg: number, reps: number): Session {
  const base = session(id, date, kg, reps);
  return { ...base, exercises: [{ ...base.exercises[0], exerciseId }] };
}

/** Le voci della cronologia delle serie */
const chronology = (page: Page) => page.locator('main ol > li > a');

test.describe('US-42 correggere l’esercizio di un allenamento', () => {
  test('US-42 dalla cronologia le serie di un allenamento passano all’esercizio giusto, e si può annullare', async ({ page }) => {
    const sessions = [
      done('giusta', '2026-09-20', 'hack-squat', 70, 10),
      done('sbagliata', '2026-10-01', 'leg-press', 73, 10),
      done('vera', '2026-10-05', 'leg-press', 100, 8),
    ];
    const archive = archiveWith({ sessions });
    await seedArchive(page, archive);
    await page.goto('exercise/?id=leg-press');
    await expect(chronology(page)).toHaveCount(2);

    // l'allenamento del 1 ottobre era un hack squat
    await page.getByRole('button', { name: 'Era un altro esercizio: allenamento del 1 ottobre' }).click();
    await expect(sheet(page)).toBeVisible();
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('hack');
    await sheet(page).getByRole('button', { name: 'Hack squat', exact: true }).click();

    // la riga sparisce da qui, le serie sono le stesse, il resto non cambia
    await expect(chronology(page)).toHaveCount(1);
    await expect(chronology(page).nth(0)).toContainText('5 ottobre');
    const toast = page.getByRole('status').filter({ hasText: 'Allenamento del 1 ottobre spostato in Hack squat.' });
    await expect(toast).toBeVisible();
    const saved = (await storedArchive(page))!;
    expect(saved.sessions.find((s) => s.id === 'sbagliata')!.exercises[0]).toMatchObject({
      exerciseId: 'hack-squat',
      sets: archive.sessions[1].exercises[0].sets,
    });
    expect(saved.sessions.find((s) => s.id === 'vera')).toEqual(archive.sessions[2]);

    // "Annulla" rimette tutto com'era
    await toast.getByRole('button', { name: 'Annulla' }).click();
    await expect(chronology(page)).toHaveCount(2);
    expect((await storedArchive(page))!.sessions).toEqual(archive.sessions);
  });

  test('US-42 i progressi dell’esercizio giusto contano l’allenamento spostato', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [done('giusta', '2026-09-20', 'hack-squat', 70, 10), done('sbagliata', '2026-10-01', 'leg-press', 73, 10)],
      }),
    );
    await page.goto('exercise/?id=leg-press');
    await page.getByRole('button', { name: 'Era un altro esercizio: allenamento del 1 ottobre' }).click();
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('hack');
    await sheet(page).getByRole('button', { name: 'Hack squat', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'spostato in Hack squat' })).toBeVisible();

    await page.goto('exercise/?id=hack-squat');
    await expectPage(page, 'exercise/');
    await expect(page.getByText('2 allenamenti dal 20 settembre')).toBeVisible();
    await expect(page.locator('p[aria-live="polite"]')).toContainText('+3 kg rispetto al 20 settembre');
  });
});
