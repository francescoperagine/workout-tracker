import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { exerciseName, startSession, validateArchive, type Archive } from '../../src/lib/archive';
import { seedArchive, sheet, storedArchive } from './helpers';

// Riordino con la maniglia (US-38): trascinamento con il puntatore, Su/Giù da tastiera e «Sposta su/giù»
// dal foglio ⋯; le stesse maniglie nell'editor della scheda. La maniglia è il numero di ogni card (e di ogni
// voce della scheda): appena parte il gesto la lista passa alle righe compatte. Allenamento dalla Scheda B
// del fixture al 5 novembre 2026; «oggi» è giovedì 5 novembre 2026 alle 18:00, con l'orologio finto fermo.

const NOW = new Date('2026-11-05T18:00:00+01:00');
const fixture = (): Archive =>
  validateArchive(JSON.parse(readFileSync(new URL('../fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8')));

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(NOW);
});

/** Sessione appena avviata dalla Scheda B, con l'archivio da mettere in localStorage */
function routineB() {
  const { archive, session } = startSession(fixture(), 'routine-b', NOW.getTime() - 600_000);
  return { archive, session };
}

/** Gli esercizi della sessione come li ha davvero salvati l'app */
async function storedExercises(page: Page, sessionId: string) {
  const archive = (await storedArchive(page))!;
  return archive.sessions.find((s) => s.id === sessionId)!.exercises;
}

const ids = (list: readonly { id: string }[]) => list.map((e) => e.id);

/**
 * Porta la maniglia al centro dello schermo e ne restituisce il punto da premere: l'intestazione è sticky,
 * quindi va lasciata fuori (sul telefono coprirebbe la prima maniglia).
 */
async function centerOf(handle: Locator): Promise<{ x: number; y: number }> {
  await handle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = (await handle.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Preme la maniglia e la trascina come farebbe un dito: il gesto si chiude con il rilascio. Il primo
 * spostamento è corto per lasciare che la lista compatta si misuri; quando il blocco è «dragged» la
 * misura c'è, e solo da lì il posto di rilascio è quello sotto il puntatore.
 */
async function drag(page: Page, handle: Locator, block: Locator, dy: number) {
  const { x, y } = await centerOf(handle);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 24);
  await expect(block).toHaveClass(/(^|\s)dragged(\s|$)/);
  await page.mouse.move(x, y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Il blocco della lista, nell'ordine in cui si vede */
function blockAt(page: Page, index: number): Locator {
  return page.locator('ol.blocks > li.block').nth(index);
}

test.describe('US-38 riordino con la maniglia', () => {
  test('US-38 trascina un esercizio più in basso e l’ordine resta', async ({ page }) => {
    const { archive, session } = routineB();
    const before = session.exercises;
    await seedArchive(page, archive);
    await page.goto('workout/');

    await drag(page, page.locator(`#handle-${before[0].id}`), blockAt(page, 0), 250);

    // il primo è sceso, gli altri restano nello stesso ordine tra loro
    await expect.poll(async () => (await storedExercises(page, session.id))[0].id).not.toBe(before[0].id);
    const after = await storedExercises(page, session.id);
    expect(after.map((e) => e.id).filter((id) => id !== before[0].id)).toEqual(ids(before.slice(1)));

    // il riordino non tocca le serie: valori e spunte restano quelli di prima
    const sets = (list: Archive['sessions'][number]['exercises']) =>
      new Map(list.map((e) => [e.id, e.sets.map((s) => [s.id, s.kg, s.reps, s.completedAt])]));
    expect(sets(after)).toEqual(sets(before));

    // ricaricando, l'ordine nuovo è quello che si vede
    await page.reload();
    const first = after[0].exerciseId;
    await expect(page.getByRole('list', { name: 'Esercizi' }).getByRole('region').first()).toHaveAccessibleName(exerciseName(archive, first));
  });

  test('US-38 Esc durante il trascinamento non cambia nulla', async ({ page }) => {
    const { archive, session } = routineB();
    const before = session.exercises;
    await seedArchive(page, archive);
    await page.goto('workout/');

    const { x, y } = await centerOf(page.locator(`#handle-${before[0].id}`));
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 24);
    await expect(blockAt(page, 0)).toHaveClass(/(^|\s)dragged(\s|$)/);
    await page.mouse.move(x, y + 250, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();

    // il gesto è finito senza salvare: l'ordine è quello di partenza
    await expect(page.locator('html')).not.toHaveClass(/reorder-dragging/);
    expect(ids(await storedExercises(page, session.id))).toEqual(ids(before));
  });

  test('US-38 con la tastiera Su e Giù spostano di un posto e lo annunciano', async ({ page }) => {
    const { archive, session } = routineB();
    const before = session.exercises;
    const second = before[1];
    const name = exerciseName(archive, second.exerciseId);
    const count = before.length;
    await seedArchive(page, archive);
    await page.goto('workout/');

    const handle = page.locator(`#handle-${second.id}`);
    await handle.focus();
    await page.keyboard.press('ArrowUp');

    await expect.poll(async () => (await storedExercises(page, session.id))[0].id).toBe(second.id);
    await expect(page.getByRole('status').filter({ hasText: `${name}: posizione 1 di ${count}.` })).toHaveText(
      `${name}: posizione 1 di ${count}.`,
    );
    // il focus resta sulla stessa maniglia, che è scesa di un posto insieme all'esercizio
    await expect(handle).toBeFocused();

    // già in cima: niente si muove
    await page.keyboard.press('ArrowUp');
    expect(ids(await storedExercises(page, session.id))).toEqual([second.id, ...ids(before.slice(0, 1)), ...ids(before.slice(2))]);
    await expect(handle).toBeFocused();
  });

  test('US-38 superserie: la voce resta nel gruppo, la maniglia del gruppo sposta tutto', async ({ page }) => {
    const { archive, session } = routineB();
    // una superserie vera: le voci 2 e 3 condividono il gruppo, le altre restano singole
    const grouped: Archive = {
      ...archive,
      sessions: archive.sessions.map((s) =>
        s.id === session.id
          ? { ...s, exercises: s.exercises.map((e, i) => ({ ...e, group: i === 1 || i === 2 ? '1' : null })) }
          : s,
      ),
    };
    const [first, second, third] = grouped.sessions.find((s) => s.id === session.id)!.exercises;
    await seedArchive(page, grouped);
    await page.goto('workout/');

    // la seconda voce del gruppo sale: scambia il posto con la prima, il gruppo resta dov'è
    const member = page.locator(`#handle-${third.id}`);
    await member.focus();
    await page.keyboard.press('ArrowUp');
    await expect.poll(async () => (await storedExercises(page, session.id))[1].id).toBe(third.id);
    let after = await storedExercises(page, session.id);
    expect([after[1].id, after[2].id]).toEqual([third.id, second.id]);
    expect([after[0].id, after[1].group, after[2].group]).toEqual([first.id, '1', '1']);

    // la maniglia dell'intestazione porta la superserie intera sopra la voce singola
    const groupHandle = page.locator(`#handle-group-${third.id}`);
    await groupHandle.focus();
    await page.keyboard.press('ArrowUp');
    await expect.poll(async () => (await storedExercises(page, session.id))[0].id).toBe(third.id);
    after = await storedExercises(page, session.id);
    expect([after[0].id, after[1].id]).toEqual([third.id, second.id]);
    expect([after[0].group, after[1].group]).toEqual(['1', '1']);
  });

  test('US-38 «Sposta giù» dal foglio ⋯', async ({ page }) => {
    const { archive, session } = routineB();
    const before = session.exercises;
    const name = exerciseName(archive, before[0].exerciseId);
    await seedArchive(page, archive);
    await page.goto('workout/');

    await page.getByRole('button', { name: `Altre azioni: ${name}` }).click();
    await sheet(page).getByRole('button', { name: 'Sposta giù', exact: true }).click();

    await expect.poll(async () => (await storedExercises(page, session.id))[1].id).toBe(before[0].id);
    expect((await storedExercises(page, session.id))[0].id).toBe(before[1].id);
  });

  test('US-38 nell’editor della scheda la voce si trascina', async ({ page }) => {
    const archive = fixture();
    const before = archive.routines.find((r) => r.id === 'routine-b')!.exercises;
    await seedArchive(page, archive);
    await page.goto('routine/?id=routine-b');

    await drag(page, page.locator(`#handle-${before[0].id}`), blockAt(page, 0), 200);

    await expect
      .poll(async () => (await storedArchive(page))!.routines.find((r) => r.id === 'routine-b')!.exercises[0].id)
      .not.toBe(before[0].id);
    const after = (await storedArchive(page))!.routines.find((r) => r.id === 'routine-b')!.exercises;
    expect(after.length).toBe(before.length);
    expect(after.map((e) => e.id).filter((id) => id !== before[0].id)).toEqual(ids(before.slice(1)));
  });
});
