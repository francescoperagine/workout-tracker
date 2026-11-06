import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { exerciseName, startSession, validateArchive, type Archive } from '../../src/lib/archive';
import { seedArchive, storedArchive } from './helpers';

// «Completa esercizio» (US-37): un tocco spunta tutte le serie con le ripetizioni (il peso può mancare),
// con un solo recupero dall'ultima spuntata e un avviso con «Annulla»; le serie senza ripetizioni restano
// da fare ed evidenziate. Allenamento dalla Scheda B del diario di Francesco al 5 novembre 2026 (sola lettura).
// "Oggi" è giovedì 5 novembre 2026 alle 18:00: l'orologio finto resta fermo finché il test non lo muove.

const NOW = new Date('2026-11-05T18:00:00+01:00');
const fixture = (): Archive =>
  validateArchive(JSON.parse(readFileSync(new URL('../fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8')));

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(NOW);
});

/**
 * Sessione di Scheda B e primo esercizio che arriva con le serie precompilate dall'ultima volta (US-36).
 * Lo stacco da terra, primo esercizio della scheda, non ha storico nel fixture: le sue serie nascerebbero
 * vuote, senza ripetizioni da spuntare.
 */
function exerciseFromRoutineB() {
  const { archive, session } = startSession(fixture(), 'routine-b', NOW.getTime() - 600_000);
  const exercise = session.exercises.find((e) => e.sets.every((s) => s.reps !== null))!;
  return { archive, session, exercise, name: exerciseName(archive, exercise.exerciseId) };
}

async function openWorkout(page: Page, archive: Archive) {
  await seedArchive(page, archive);
  await page.goto('workout/');
}

function card(page: Page, name: string): Locator {
  return page.getByRole('region', { name, exact: true });
}

function timer(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Recupero' });
}

function timerBar(page: Page): Locator {
  return page.getByRole('button', { name: /^Recupero[ :].*Tocca per aprire$/ });
}

/** L'avviso in basso: role=status con quel testo */
function toast(page: Page, text: string): Locator {
  return page.getByRole('status').filter({ hasText: text });
}

/** Le serie che l'app ha davvero salvato per quell'esercizio */
async function savedSets(page: Page, sessionId: string, exerciseId: string) {
  const archive = (await storedArchive(page))!;
  return archive.sessions.find((s) => s.id === sessionId)!.exercises.find((e) => e.id === exerciseId)!.sets;
}

test.describe('US-37 completa esercizio', () => {
  test('US-37 completa un esercizio in un tocco, con un solo recupero e «Annulla»', async ({ page }) => {
    const { archive, session, exercise, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const count = exercise.sets.length;

    await region.getByRole('button', { name: `Completa ${name}` }).click();

    // tutte le serie spuntate, comprese quelle senza peso, con la stessa spunta: un tocco, un istante;
    // l'esercizio fatto si chiude (§3.7)
    await expect.poll(async () => (await savedSets(page, session.id, exercise.id)).map((s) => s.completedAt)).toEqual(Array(count).fill(NOW.getTime()));
    await expect(region.getByRole('button', { name, exact: true })).toHaveAttribute('aria-expanded', 'false');

    // un solo recupero, dall'ultima serie spuntata, già ridotto: il timer a tutto schermo coprirebbe «Annulla»
    await expect(timerBar(page)).toBeVisible();
    await expect(timer(page)).toBeHidden();

    const undo = toast(page, `${name}: ${count} serie spuntate.`);
    await expect(undo).toContainText(`${name}: ${count} serie spuntate.`);
    await undo.getByRole('button', { name: 'Annulla' }).click();

    expect((await savedSets(page, session.id, exercise.id)).map((s) => s.completedAt)).toEqual(Array(count).fill(null));
    await expect(region.getByRole('button', { name: 'Segna serie 1 come fatta' })).toHaveAttribute('aria-pressed', 'false');
    // «Annulla» ferma anche il recupero che quelle spunte avevano avviato
    await expect(timerBar(page)).toHaveCount(0);
    await expect(timer(page)).toHaveCount(0);
  });

  test('US-37 le serie senza ripetizioni restano da fare e si vedono', async ({ page }) => {
    const { archive, session, exercise, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const count = exercise.sets.length;
    const last = count;
    const reps = region.getByRole('textbox', { name: `Ripetizioni serie ${last}` });

    await reps.fill('');
    await expect.poll(async () => (await savedSets(page, session.id, exercise.id))[last - 1].reps).toBeNull();

    await region.getByRole('button', { name: `Completa ${name}` }).click();
    await expect(region.getByRole('button', { name: `Segna serie ${last} come fatta` })).toHaveAttribute('aria-pressed', 'false');
    await expect(toast(page, 'senza ripetizioni')).toContainText(`${name}: ${count - 1} serie spuntate, 1 senza ripetizioni.`);
    await expect(region.getByRole('status')).toContainText(`Mancano le ripetizioni: serie ${last}.`);

    // appena la serie ha le ripetizioni, la nota sparisce
    await reps.fill('8');
    await expect(region.getByRole('status')).toHaveCount(0);
  });

  test('US-37 senza ripetizioni il tocco lo dice e non spunta nulla', async ({ page }) => {
    const { archive, session, exercise, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const count = exercise.sets.length;

    for (let n = 1; n <= count; n++) await region.getByRole('textbox', { name: `Ripetizioni serie ${n}` }).fill('');
    await expect.poll(async () => (await savedSets(page, session.id, exercise.id)).map((s) => s.reps)).toEqual(Array(count).fill(null));

    await region.getByRole('button', { name: `Completa ${name}` }).click();
    await expect(toast(page, 'nessuna serie con ripetizioni')).toContainText(`${name}: nessuna serie con ripetizioni.`);
    expect((await savedSets(page, session.id, exercise.id)).map((s) => s.completedAt)).toEqual(Array(count).fill(null));
    await expect(timer(page)).toHaveCount(0);
  });

  test('US-37 riuscito, l’esercizio si chiude e il focus passa all’intestazione del successivo; «Annulla» lo riapre', async ({ page }) => {
    const { archive, session, exercise, name } = exerciseFromRoutineB();
    const following = session.exercises[session.exercises.indexOf(exercise) + 1];
    const nextName = exerciseName(archive, following.exerciseId);
    await openWorkout(page, archive);

    await card(page, name).getByRole('button', { name: `Completa ${name}` }).click();
    await expect(page.getByRole('button', { name: `Completa ${name}` })).toHaveCount(0);
    await expect(card(page, name).getByRole('button', { name, exact: true })).toHaveAttribute('aria-expanded', 'false');
    const nextHeader = card(page, nextName).getByRole('button', { name: nextName, exact: true });
    await expect(nextHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(nextHeader).toBeFocused();
    await expect(nextHeader).toBeInViewport();

    await toast(page, 'serie spuntate').getByRole('button', { name: 'Annulla' }).click();
    await expect(card(page, name).getByRole('button', { name, exact: true })).toHaveAttribute('aria-expanded', 'true');
  });
});
