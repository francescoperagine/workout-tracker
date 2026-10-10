import { expect, test } from '@playwright/test';
import { BASE_CATALOG } from '../../src/data/catalog';
import { starterRoutines, type Routine, type Session } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// Oggi (step 5): US-11 avvio rapido dalle ultime 4 schede con la suggerita già selezionata,
// US-17 "Riprendi" con una sessione in corso, US-20 più sessioni nello stesso giorno.
// "Oggi" è fissato con page.clock: giovedì 8 ottobre 2026 alle 18:30 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

const done = (id: string, date: string, routine: Routine): Session => ({ ...session(id, date), routineId: routine.id, name: routine.name });

function routine(id: string, name: string): Routine {
  return { ...starterRoutines()[0], id, name };
}

test.describe('US-11 avvio rapido', () => {
  test('US-11 la suggerita è già selezionata: 1 tocco su "Inizia" crea la sessione dalla scheda', async ({ page }) => {
    const [a, b] = starterRoutines();
    await seedArchive(page, archiveWith({ routines: [a, b], sessions: [done('s1', '2026-10-01', b), done('s2', '2026-10-06', a)] }));
    await page.goto('');
    // dopo A tocca a B (la recente fatta da più tempo)
    await expect(page.getByRole('radio', { name: /^Scheda B/ })).toBeChecked();
    await expect(page.locator('label', { has: page.getByRole('radio', { name: /^Scheda A/ }) })).toContainText('martedì');
    await expect(page.locator('label', { has: page.getByRole('radio', { name: /^Scheda B/ }) })).toContainText('7 giorni fa');

    await page.getByRole('button', { name: 'Inizia allenamento' }).click();
    await expectPage(page, 'workout/');
    await expect(page.getByRole('heading', { name: 'Scheda B' })).toBeVisible();
    await expect(page.getByText('Iniziato alle 18:30')).toBeVisible();
    const running = (await storedArchive(page))!.sessions.find((s) => s.end === null)!;
    expect(running).toMatchObject({ routineId: 'routine-b', name: 'Scheda B', date: '2026-10-08', start: NOW.getTime() });
    expect(running.exercises.map((e) => e.exerciseId)).toEqual(b.exercises.map((e) => e.exerciseId));
    expect(running.exercises.map((e) => e.sets.length)).toEqual(b.exercises.map((e) => e.sets));
    await expect(page.getByRole('list', { name: 'Esercizi' }).getByRole('listitem')).toHaveCount(b.exercises.length);
  });

  test('US-11 toccare un’altra riga la seleziona e non avvia: 2 tocchi', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('');
    await expect(page.getByRole('radio', { name: /^Scheda A/ })).toBeChecked();
    await page.locator('label').getByText('Scheda B', { exact: true }).click();
    await expect(page.getByRole('radio', { name: /^Scheda B/ })).toBeChecked();
    await expectPage(page, '');
    expect((await storedArchive(page))?.sessions).toEqual([]);
    await page.getByRole('button', { name: 'Inizia allenamento' }).click();
    await expectPage(page, 'workout/');
    expect((await storedArchive(page))?.sessions[0].routineId).toBe('routine-b');
  });

  test('US-11 le ultime 4 schede fatte più la pianificata; "Altra scheda" in un foglio dal basso', async ({ page }) => {
    const routines = ['A', 'B', 'C', 'D', 'E', 'F', 'P'].map((l) => routine(`r-${l.toLowerCase()}`, `Scheda ${l}`));
    const sessions = ['a', 'b', 'c', 'd', 'e'].map((l, i) => done(`s-${l}`, `2026-10-0${i + 1}`, routines[i]));
    await seedArchive(page, archiveWith({ routines, sessions, schedule: { thu: 'r-p' } }));
    await page.goto('');
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(5);
    for (const [i, name] of ['Scheda E', 'Scheda D', 'Scheda C', 'Scheda B', 'Scheda P'].entries()) {
      await expect(radios.nth(i)).toHaveAccessibleName(new RegExp(`^${name}`));
    }
    await expect(page.getByRole('radio', { name: /^Scheda P/ })).toBeChecked();
    await expect(page.getByText('In programma: Scheda P')).toBeVisible();

    await page.getByRole('button', { name: 'Altra scheda' }).click();
    await sheet(page).getByRole('button', { name: /^Scheda F/ }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /^Scheda F/ })).toBeChecked();
    await page.getByRole('button', { name: 'Inizia allenamento' }).click();
    await expectPage(page, 'workout/');
    expect((await storedArchive(page))?.sessions.find((s) => s.end === null)?.routineId).toBe('r-f');
  });

  test('US-11 allenamento libero, e "Annulla allenamento" con "Annulla"', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('');
    await page.getByRole('button', { name: 'Allenamento libero' }).click();
    await expectPage(page, 'workout/');
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    expect((await storedArchive(page))?.sessions[0]).toMatchObject({ routineId: null, name: 'Allenamento libero', exercises: [], end: null });

    await page.getByRole('button', { name: 'Annulla allenamento' }).click();
    await expect(page.getByText('Nessun allenamento in corso')).toBeVisible();
    expect((await storedArchive(page))?.sessions).toEqual([]);
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    expect((await storedArchive(page))?.sessions).toHaveLength(1);
  });

  test('US-11 senza schede: "Allenamento libero" è l’azione principale', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('');
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Vai alle schede' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Allenamento libero' })).toHaveClass(/btn-primary/);
  });

  test('US-11 a 390×844 righe e "Inizia" in vista senza scorrere; a 320×568 "Inizia" resta sopra la tab bar', async ({ page }) => {
    const [a, b] = starterRoutines();
    const routines = [a, b, routine('r-c', 'Scheda C'), routine('r-d', 'Scheda D')];
    const sessions = routines.map((r, i) => done(`s${i}`, `2026-10-0${i + 1}`, r));
    await seedArchive(page, archiveWith({ routines, sessions }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('');
    const start = page.getByRole('button', { name: 'Inizia allenamento' });
    const tabs = page.getByRole('navigation', { name: 'Sezioni' });
    await expect(page.getByRole('radio')).toHaveCount(4);
    for (const radio of await page.getByRole('radio').all()) await expect(radio).toBeInViewport();
    await expect(start).toBeInViewport();
    // nella metà inferiore dello schermo (zona del pollice)
    expect((await start.boundingBox())!.y).toBeGreaterThan(844 / 2);

    await page.setViewportSize({ width: 320, height: 568 });
    await expect(start).toBeInViewport();
    const button = (await start.boundingBox())!;
    expect(button.y + button.height).toBeLessThanOrEqual((await tabs.boundingBox())!.y + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe('US-17 US-20 sessione in corso e sessioni dello stesso giorno', () => {
  test('US-17 con una sessione in corso il pulsante principale è "Riprendi"', async ({ page }) => {
    const [a] = starterRoutines();
    const start = NOW.getTime() - 25 * 60_000;
    const running: Session = {
      ...done('run', '2026-10-08', a),
      start,
      end: null,
      exercises: [
        { ...session('x', '2026-10-08').exercises[0], exerciseId: a.exercises[0].exerciseId },
        { ...session('y', '2026-10-08').exercises[0], exerciseId: a.exercises[1].exerciseId, sets: [{ id: 'y-s', type: 'normal', kg: null, reps: null, completedAt: null }] },
      ],
    };
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [running] }));
    await page.goto('');
    await expect(page.getByText('Allenamento in corso')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Inizia allenamento' })).toHaveCount(0);
    // durata ed esercizio corrente (il primo con serie da fare)
    await expect(page.getByText(`da 25 min · ${BASE_CATALOG[a.exercises[1].exerciseId].name} · 1 serie fatta`)).toBeVisible();
    await page.getByRole('link', { name: 'Riprendi allenamento' }).click();
    await expectPage(page, 'workout/');
    await expect(page.getByRole('heading', { name: 'Scheda A' })).toBeVisible();
    // una sessione con valori si annulla solo con conferma
    await page.getByRole('button', { name: 'Annulla allenamento' }).click();
    await expect(page.getByRole('dialog', { name: 'Annullare l’allenamento?' })).toContainText('Si perde quanto registrato in «Scheda A»: 1 serie fatta.');
  });

  test('US-20 allenamento di oggi già concluso: riepilogo breve, "Riapri" o un nuovo allenamento', async ({ page }) => {
    const [a, b] = starterRoutines();
    await seedArchive(page, archiveWith({ routines: [a, b], schedule: { thu: 'routine-a' }, sessions: [done('today', '2026-10-08', a)] }));
    await page.goto('');
    await expect(page.getByText('Fatto oggi: Scheda A')).toBeVisible();
    // la scheda già fatta oggi non è più la suggerita
    await expect(page.getByRole('radio', { name: /^Scheda B/ })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Nuovo allenamento' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ultimo allenamento' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Scheda A oggi · 1 h 00 min · 1 esercizio · 1 serie/ })).toBeVisible();

    await page.getByRole('button', { name: 'Riapri' }).click();
    await expectPage(page, 'workout/');
    expect((await storedArchive(page))?.sessions[0].end).toBeNull();
  });
});
