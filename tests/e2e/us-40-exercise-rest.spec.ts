import { expect, test, type Locator, type Page } from '@playwright/test';
import { BASE_CATALOG } from '../../src/data/catalog';
import { addSessionExercise, startSession, starterRoutines, type Session } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, sheet, storedArchive } from './helpers';

// Card dell'esercizio sfoltita (exercise-card-layout): il recupero si cambia dal menu ⋯, uno per esercizio,
// e vale anche nella voce della scheda (US-40); in testa restano maniglia, nome e menu.
// "Oggi" è giovedì 8 ottobre 2026 alle 18:30 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');
const [A, B] = starterRoutines();
const SQUAT = A.exercises[0];
const name = (id: string) => BASE_CATALOG[id].name;

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

/** Sessione conclusa di una scheda, con tutte le serie fatte a 40 × 8 */
function pastSession(routineId: string, date: string): Session {
  const { session } = startSession(archiveWith({ routines: starterRoutines() }), routineId, new Date(`${date}T18:00:00+02:00`).getTime());
  session.end = session.start + 3_600_000;
  for (const e of session.exercises) for (const s of e.sets) Object.assign(s, { kg: 40, reps: 8, completedAt: session.start + 60_000 });
  return session;
}

function region(page: Page, exerciseId: string): Locator {
  return page.getByRole('region', { name: name(exerciseId), exact: true });
}

async function openOptions(page: Page, card: Locator) {
  await card.getByRole('button', { name: /^Altre azioni: / }).click();
}

const running = async (page: Page) => (await storedArchive(page))!.sessions.find((s) => s.end === null)!;

test.describe('US-40 recupero dal menu dell’esercizio', () => {
  test('US-40 il recupero cambiato dal menu vale per la prossima spunta e nella scheda', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [pastSession('routine-a', '2026-10-06')] }));
    await page.goto('');
    await page.getByRole('button', { name: 'Inizia allenamento' }).click();
    await expectPage(page, 'workout/');
    const squat = region(page, SQUAT.exerciseId);

    await openOptions(page, squat);
    await sheet(page).getByRole('button', { name: 'Recupero · 2:00' }).click();
    await expect(sheet(page)).toContainText('Vale per tutte le serie di questo esercizio, anche nella scheda «Scheda A».');
    await sheet(page).getByRole('button', { name: 'Recupero: +15 s' }).click();
    await expect(sheet(page).locator('output')).toHaveText('2:15');
    // si salva a ogni passo, senza "Salva" (P4)
    await expect.poll(async () => (await running(page)).exercises[0].rest).toBe(135);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);

    await openOptions(page, squat);
    await expect(sheet(page).getByRole('button', { name: 'Recupero · 2:15' })).toBeVisible();
    await page.keyboard.press('Escape');

    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const timer = page.getByRole('dialog', { name: 'Recupero' });
    await expect(timer.locator('.timer-digits')).toHaveText('Mancano 2:15');
    await timer.getByRole('button', { name: 'Salta il recupero' }).click();

    await page.goto('routine/?id=routine-a');
    await expect(page.getByRole('button', { name: /^1\. Squat bilanciere/ })).toContainText('rec. 2:15');
  });

  test('US-40 in un allenamento libero il recupero resta alla sessione', async ({ page }) => {
    const base = archiveWith({ routines: starterRoutines() });
    const started = startSession(base, null, NOW.getTime() - 600_000);
    const { archive } = addSessionExercise(started.archive, started.session.id, SQUAT.exerciseId);
    await seedArchive(page, archive);
    await page.goto('workout/');
    const rest = (await running(page)).exercises[0].rest;

    await openOptions(page, region(page, SQUAT.exerciseId));
    await sheet(page).getByRole('button', { name: /^Recupero · / }).click();
    await expect(sheet(page).getByText('Vale per tutte le serie di questo esercizio.', { exact: true })).toBeVisible();
    await expect(sheet(page)).not.toContainText('scheda');
    await sheet(page).getByRole('button', { name: 'Recupero: −15 s' }).click();
    await expect.poll(async () => (await running(page)).exercises[0].rest).toBe(rest - 15);
    expect((await storedArchive(page))!.routines).toEqual(archive.routines);
  });

  test('US-40 nella sessione conclusa il menu non ha il recupero', async ({ page }) => {
    const past = pastSession('routine-a', '2026-10-06');
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [past] }));
    await page.goto(`session/?id=${past.id}`);
    await openOptions(page, region(page, SQUAT.exerciseId));
    await expect(sheet(page).getByRole('button', { name: 'Cambia esercizio' })).toBeVisible();
    await expect(sheet(page).getByRole('button', { name: /^Recupero/ })).toHaveCount(0);
  });

  test('US-40 la card tiene in testa maniglia, nome e menu; il nome lungo sta in 2 righe a 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const { session } = startSession(archiveWith({ routines: starterRoutines() }), 'routine-b', NOW.getTime() - 600_000);
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [session] }));
    await page.goto('workout/');

    const long = B.exercises.find((e) => name(e.exerciseId) === 'Distensioni manubri panca inclinata')!;
    const button = region(page, long.exerciseId).getByRole('button', { name: /: come si esegue$/ });
    const { height, lineHeight, padding } = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { height: el.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight), padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) };
    });
    expect(height).toBeLessThanOrEqual(2 * lineHeight + padding + 1);

    const first = region(page, B.exercises[0].exerciseId);
    // niente obiettivo della scheda, niente "Cambia esercizio" nella card: sta nel menu
    await expect(first).not.toContainText('rec.');
    await expect(first).not.toContainText('3 ×');
    await expect(first.getByRole('button', { name: 'Cambia esercizio' })).toHaveCount(0);
    await openOptions(page, first);
    await expect(sheet(page).getByRole('button', { name: 'Cambia esercizio' })).toBeVisible();
    await page.keyboard.press('Escape');

    // solo l'esercizio della serie da fare adesso è corrente, e il suo blocco ha il bordo accento
    await expect(page.locator('section.exercise.current')).toHaveCount(1);
    await expect(first).toHaveClass(/current/);
    await expect(page.locator('li.block.current')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test('US-40 i fogli del menu tornano al menu, il focus parte dal titolo e «Progressi» torna all’allenamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [pastSession('routine-a', '2026-10-06')] }));
    await page.goto('');
    await page.getByRole('button', { name: 'Inizia allenamento' }).click();
    await expectPage(page, 'workout/');
    const squat = region(page, SQUAT.exerciseId);
    const title = name(SQUAT.exerciseId);

    await openOptions(page, squat);
    // all'apertura il focus è sul titolo del foglio, non su ✕
    await expect(sheet(page).getByRole('heading', { name: title })).toBeFocused();
    for (const [item, heading] of [
      ['Recupero · 2:00', title],
      ['Come si esegue', title],
      ['Cambia esercizio', 'Cambia esercizio'],
    ] as const) {
      await sheet(page).getByRole('button', { name: item }).click();
      await expect(sheet(page).getByRole('heading', { name: heading })).toBeFocused();
      await sheet(page).getByRole('button', { name: 'Torna al menu' }).click();
      await expect(sheet(page).getByRole('button', { name: item })).toBeVisible();
    }
    // ✕ chiude tutto
    await sheet(page).getByRole('button', { name: 'Recupero · 2:00' }).click();
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await expect(sheet(page)).toHaveCount(0);
    // aperto da ⓘ, «Come si esegue» non ha il ritorno al menu
    await squat.getByRole('button', { name: /: come si esegue$/ }).click();
    await expect(sheet(page).getByRole('button', { name: 'Torna al menu' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    // il timer a tutto schermo prende il focus sulla finestra, non su «Riduci il timer»
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const timer = page.getByRole('dialog', { name: 'Recupero' });
    await expect(timer).toBeFocused();
    await timer.getByRole('button', { name: 'Salta il recupero' }).click();

    await openOptions(page, squat);
    await sheet(page).getByRole('link', { name: 'Progressi' }).click();
    await expect(page).toHaveURL(/\/exercise\/\?id=.*&from=workout$/);
    await page.getByRole('link', { name: 'Allenamento', exact: true }).click();
    await expectPage(page, 'workout/');
  });
});
