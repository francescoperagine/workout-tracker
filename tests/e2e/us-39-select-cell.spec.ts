import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { exerciseName, startSession, validateArchive, type Archive } from '../../src/lib/archive';
import { seedArchive, storedArchive } from './helpers';

// Selezione del contenuto al focus (US-39): toccare o raggiungere con la tastiera il campo kg o ripetizioni
// seleziona tutto, così scrivere sostituisce il valore senza cancellarlo prima. Nell'editor della scheda
// valgono gli stessi campi numerici; il nome della scheda no. Allenamento dalla Scheda B del diario di
// Francesco al 5 novembre 2026 (sola lettura). "Oggi" è giovedì 5 novembre 2026 alle 18:00.

const NOW = new Date('2026-11-05T18:00:00+01:00');
const fixture = (): Archive =>
  validateArchive(JSON.parse(readFileSync(new URL('../fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8')));

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(NOW);
});

/**
 * Sessione di Scheda B e primo esercizio che arriva con tutte le serie precompilate (US-36), peso e
 * ripetizioni: lo stacco da terra, primo esercizio della scheda, nel fixture non ha storico e le sue
 * serie nascerebbero vuote, senza niente da selezionare.
 */
function exerciseFromRoutineB() {
  const { archive, session } = startSession(fixture(), 'routine-b', NOW.getTime() - 600_000);
  const exercise = session.exercises.find((e) => e.sets.every((s) => s.reps !== null && s.kg !== null))!;
  return { archive, session, exercise, name: exerciseName(archive, exercise.exerciseId) };
}

async function openWorkout(page: Page, archive: Archive) {
  await seedArchive(page, archive);
  await page.goto('workout/');
}

function card(page: Page, name: string): Locator {
  return page.getByRole('region', { name, exact: true });
}

/** Le serie che l'app ha davvero salvato per quell'esercizio */
async function savedSets(page: Page, sessionId: string, exerciseId: string) {
  const archive = (await storedArchive(page))!;
  return archive.sessions.find((s) => s.id === sessionId)!.exercises.find((e) => e.id === exerciseId)!.sets;
}

/** Inizio, fine e lunghezza del valore del campo: dice se è tutto selezionato o se c'è il cursore */
function selection(input: Locator) {
  return input.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd, el.value.length] as const);
}

/** Aspetta che il campo abbia tutto il valore selezionato (la selezione arriva con il focus) */
async function expectAllSelected(input: Locator) {
  await expect
    .poll(async () => {
      const [start, end, length] = await selection(input);
      return length > 0 && start === 0 && end === length;
    }, { message: 'tutto il valore selezionato' })
    .toBe(true);
}

/** Aspetta che la selezione sia vuota, cioè che ci sia solo il cursore */
async function expectCaret(input: Locator) {
  const [start, end, length] = await selection(input);
  expect(start).toBe(end);
  expect(length).toBeGreaterThan(0);
}

test.describe('US-39 selezione al focus', () => {
  test('US-39 al tocco il valore di kg e ripetizioni si sostituisce scrivendo', async ({ page }) => {
    const { archive, session, exercise, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const kg = region.getByRole('textbox', { name: 'Peso serie 1, kg' });
    const reps = region.getByRole('textbox', { name: 'Ripetizioni serie 1' });
    const firstSet = async () => (await savedSets(page, session.id, exercise.id))[0];

    // il peso è precompilato dall'ultima volta: c'è qualcosa da sostituire
    expect(await kg.inputValue()).not.toBe('');

    await kg.click();
    expect(await selection(kg)).toEqual([0, (await kg.inputValue()).length, (await kg.inputValue()).length]);
    await page.keyboard.type('22,5');
    await expect(kg).toHaveValue('22,5');
    await expect.poll(async () => (await firstSet()).kg).toBe(22.5);

    await reps.click();
    expect(await selection(reps)).toEqual([0, (await reps.inputValue()).length, (await reps.inputValue()).length]);
    await page.keyboard.type('7');
    await expect(reps).toHaveValue('7');
    await expect.poll(async () => (await firstSet()).reps).toBe(7);
  });

  test('US-39 con la tastiera il focus seleziona tutto', async ({ page }) => {
    const { archive, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const kg = region.getByRole('textbox', { name: 'Peso serie 2, kg' });
    const reps = region.getByRole('textbox', { name: 'Ripetizioni serie 2' });

    await kg.focus();
    await expectAllSelected(kg);

    // il campo dopo il peso, nella stessa riga, è quello delle ripetizioni
    await page.keyboard.press('Tab');
    await expect(reps).toBeFocused();
    await expectAllSelected(reps);

    await page.keyboard.type('9');
    await expect(reps).toHaveValue('9');
  });

  test('US-39 un secondo tocco nel campo già attivo mette il cursore', async ({ page }) => {
    const { archive, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const region = card(page, name);
    const kg = region.getByRole('textbox', { name: 'Peso serie 1, kg' });

    await kg.click();
    await expectAllSelected(kg);

    // il campo ora è già attivo: il secondo tocco porta il cursore dove si tocca, non riseleziona tutto
    await kg.click();
    await expectCaret(kg);

    // ...e scrivere aggiunge, invece di sostituire
    const length = (await selection(kg))[2];
    await page.keyboard.type('9');
    expect((await kg.inputValue()).length).toBe(length + 1);
  });

  test('US-39 tocco vero: la selezione regge', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Il tocco vero si prova solo sul telefono');

    const { archive, name } = exerciseFromRoutineB();
    await openWorkout(page, archive);
    const reps = card(page, name).getByRole('textbox', { name: 'Ripetizioni serie 1' });
    const box = (await reps.boundingBox())!;
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    // un dito vero, non il mouse: il tocco che dà il focus può togliere la selezione subito dopo
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(100);

    await expectAllSelected(reps);
    await page.keyboard.type('5');
    await expect(reps).toHaveValue('5');
  });

  test("US-39 nell'editor della scheda i campi numerici selezionano, il nome no", async ({ page }) => {
    await seedArchive(page, fixture());
    await page.goto('routine/?id=routine-b');

    // la prima voce della scheda, aperta in linea toccando la sua riga
    await page.locator('[id$="-toggle"]').first().click();
    const reps = page.getByLabel('Ripetizioni', { exact: true });
    await expect(reps).toBeVisible();

    await reps.focus();
    await expectAllSelected(reps);

    // il nome della scheda è un campo di testo come gli altri: non si seleziona da solo
    const routineName = page.getByLabel('Nome della scheda', { exact: true });
    await routineName.focus();
    await expectCaret(routineName);
  });
});
