import { expect, test, type Locator, type Page } from '@playwright/test';
import { BASE_CATALOG } from '../../src/data/catalog';
import { startSession, starterRoutines, type Archive, type Session } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, sheet, storedArchive, finishWorkout } from './helpers';

// Allenamento attivo (step 6): US-12 righe serie e precedente (P1, conteggio dei tocchi), US-13 tipi
// di serie, US-14 varianti, US-15 serie ed esercizi in sessione, US-16 note, US-17 ripresa e mini-barra,
// US-18 riepilogo, US-19 approfondimento, US-20 più sessioni nello stesso giorno, più US-03 (invito
// all'installazione) e US-27 (nome e data in corso).
// "Oggi" è giovedì 8 ottobre 2026 alle 18:30 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');
const [A] = starterRoutines();

/**
 * Le schede di esempio senza recupero: qui si spuntano più serie di fila e il timer a tutto schermo
 * (step 7) le coprirebbe. Il recupero ha la sua suite, us-21-us-26-rest-timer.spec.ts.
 */
function routines() {
  return starterRoutines().map((r) => ({ ...r, exercises: r.exercises.map((e) => ({ ...e, rest: 0, warmupRest: 0 })) }));
}
const SQUAT = A.exercises[0];
const BENCH = A.exercises[1];
const ROW = A.exercises[2];
const name = (id: string) => BASE_CATALOG[id].name;

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

/** Sessione conclusa di Scheda A in una data, con tutte le serie fatte a `kg` × `reps` */
function pastSession(date: string, kg = 40, reps = 8, change: (s: Session) => void = () => {}): Session {
  const { session } = startSession(archiveWith({ routines: routines() }), 'routine-a', new Date(`${date}T18:00:00+02:00`).getTime());
  session.end = session.start + 3_600_000;
  for (const e of session.exercises) for (const s of e.sets) Object.assign(s, { kg, reps, completedAt: session.start + 60_000 });
  change(session);
  return session;
}

function region(page: Page, exerciseId: string): Locator {
  return page.getByRole('region', { name: name(exerciseId), exact: true });
}

const running = async (page: Page) => (await storedArchive(page))!.sessions.find((s) => s.end === null)!;

/** Da Oggi: la suggerita è la Scheda A, un tocco su "Inizia allenamento" */
async function startFromToday(page: Page, archive: Archive) {
  await seedArchive(page, archive);
  await page.goto('');
  await page.getByRole('button', { name: 'Inizia allenamento' }).click();
  await expectPage(page, 'workout/');
}

test.describe('US-12 registrare le serie', () => {
  test('US-12 registra una serie copiando il precedente: 1 tocco per serie (P1)', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    const squat = region(page, SQUAT.exerciseId);
    await expect(squat.getByRole('button', { name: 'Copia il precedente: 40 × 8' })).toHaveCount(SQUAT.sets);
    // il precedente è il segnaposto dei campi vuoti
    await expect(squat.getByRole('textbox', { name: 'Peso serie 1, kg' })).toHaveAttribute('placeholder', '40');
    await expect(squat.getByRole('textbox', { name: 'Peso serie 1, kg' })).toHaveValue('');

    let taps = 0;
    for (let n = 1; n <= SQUAT.sets; n++) {
      taps++;
      await squat.getByRole('button', { name: `Segna serie ${n} come fatta` }).click();
      await expect(squat.getByRole('button', { name: `Annulla serie ${n}` })).toHaveAttribute('aria-pressed', 'true');
    }
    expect(taps / SQUAT.sets).toBe(1);
    const sets = (await running(page)).exercises[0].sets;
    expect(sets.map((s) => [s.kg, s.reps, s.completedAt])).toEqual(sets.map(() => [40, 8, NOW.getTime()]));
    await expect(squat.getByRole('textbox', { name: 'Peso serie 1, kg' })).toHaveValue('40');
  });

  test('US-12 valori diversi: al massimo 2 campi più la spunta; togliere la spunta annulla', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('42,5');
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('6');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    expect((await running(page)).exercises[0].sets[0]).toMatchObject({ kg: 42.5, reps: 6, completedAt: NOW.getTime() });
    // solo le ripetizioni: il peso viene dalla serie sopra (42,5), non dal precedente (40)
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 2' }).fill('7');
    await squat.getByRole('button', { name: 'Segna serie 2 come fatta' }).click();
    expect((await running(page)).exercises[0].sets[1]).toMatchObject({ kg: 42.5, reps: 7 });

    await squat.getByRole('button', { name: 'Annulla serie 1' }).click();
    expect((await running(page)).exercises[0].sets[0]).toMatchObject({ kg: 42.5, reps: 6, completedAt: null });
    await expect(squat.getByRole('button', { name: 'Segna serie 1 come fatta' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('US-12 senza precedente la riga vuota non si spunta e il cursore va al primo campo vuoto', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    await expect(squat.getByLabel('Nessun precedente')).toHaveCount(SQUAT.sets);
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(squat.getByRole('textbox', { name: 'Peso serie 1, kg' })).toBeFocused();
    await page.keyboard.type('50');
    await page.keyboard.press('Enter');
    await expect(squat.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toBeFocused();
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(squat.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toBeFocused();
    expect((await running(page)).exercises[0].sets[0]).toMatchObject({ kg: 50, reps: null, completedAt: null });
    // un valore non valido non si salva
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('8,5');
    await expect(squat.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toHaveAttribute('aria-invalid', 'true');
    expect((await running(page)).exercises[0].sets[0].reps).toBeNull();
  });

  test('US-12 toccando il precedente i valori vengono copiati', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 37.5, 9)] }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('button', { name: 'Copia il precedente: 37,5 × 9' }).first().click();
    await expect(squat.getByRole('textbox', { name: 'Peso serie 1, kg' })).toHaveValue('37,5');
    await expect(squat.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toHaveValue('9');
    expect((await running(page)).exercises[0].sets[0]).toMatchObject({ kg: 37.5, reps: 9, completedAt: null });
  });

  test('US-12 US-31 in libbre: intestazione, precedente e campi in lb, dati salvati in kg', async ({ page }) => {
    const archive = archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] });
    await startFromToday(page, { ...archive, settings: { ...archive.settings, weightUnit: 'lb' } });
    const squat = region(page, SQUAT.exerciseId);
    await expect(squat.getByText('lb', { exact: true })).toBeVisible();
    await expect(squat.getByRole('button', { name: 'Copia il precedente: 88 × 8' })).toHaveCount(SQUAT.sets);
    await squat.getByRole('textbox', { name: 'Peso serie 1, lb' }).fill('135');
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('5');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    expect((await running(page)).exercises[0].sets[0].kg).toBeCloseTo(135 * 0.45359237, 6);
    await page.reload();
    await expect(region(page, SQUAT.exerciseId).getByRole('textbox', { name: 'Peso serie 1, lb' })).toHaveValue('135');
  });
});

test.describe('US-13 tipi di serie', () => {
  test('US-13 il tocco sul numero apre il foglio della serie e cambia tipo; il riscaldamento non ha numero', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    const first = squat.getByRole('button', { name: /: tipo e opzioni$/ }).first();
    await expect(first).toHaveText('1');
    await expect(first).toHaveAccessibleName('Serie 1: tipo e opzioni');
    await first.click();
    await expect(sheet(page).getByRole('heading', { name: 'Squat bilanciere · serie 1' })).toBeVisible();
    await expect(sheet(page).getByRole('button', { name: 'Normale' })).toHaveAttribute('aria-pressed', 'true');
    await sheet(page).getByRole('button', { name: 'Riscaldamento' }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(first).toHaveText('R');
    await expect(first).toHaveAccessibleName('Riscaldamento: tipo e opzioni');
    // le serie successive si rinumerano
    await expect(squat.getByRole('button', { name: /: tipo e opzioni$/ }).nth(1)).toHaveText('1');
    await expect(squat.getByRole('textbox', { name: 'Peso riscaldamento, kg' })).toBeVisible();
    expect((await running(page)).exercises[0].sets[0].type).toBe('warmup');
    for (const [label, badge] of [['Drop', 'D'], ['Cedimento', 'C'], ['Normale', '1']]) {
      await first.click();
      await sheet(page).getByRole('button', { name: label }).click();
      await expect(first).toHaveText(badge);
    }
    expect((await running(page)).exercises[0].sets[0].type).toBe('normal');
  });
});

test.describe('US-14 varianti', () => {
  test('US-14 macchina occupata: le serie fatte restano, la variante continua sotto con il suo precedente; Annulla', async ({ page }) => {
    const alternative = SQUAT.alternatives[0];
    const past = pastSession('2026-10-06', 40, 8, (s) => {
      s.exercises[0].exerciseId = alternative;
      s.exercises[0].variantOf = SQUAT.exerciseId;
      for (const set of s.exercises[0].sets) set.kg = 100;
    });
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [past] }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('60');
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('8');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();

    await squat.getByRole('button', { name: 'Cambia esercizio' }).click();
    await expect(sheet(page).getByRole('radio', { name: /^Squat bilanciere/ })).toBeChecked();
    await sheet(page).getByRole('radio', { name: name(alternative) }).check();
    await sheet(page).getByRole('button', { name: 'Usa questo esercizio' }).click();
    // nessuna conferma: la serie fatta resta allo squat, la variante prende le serie da fare
    await expect(page.getByRole('dialog', { name: 'Cambiare esercizio?' })).toHaveCount(0);
    await expect(page.getByText(`Le serie fatte restano a Squat bilanciere; continui con ${name(alternative)}.`)).toBeVisible();

    const variant = region(page, alternative);
    await expect(variant).toContainText('Al posto di Squat bilanciere');
    await expect(variant.getByRole('button', { name: 'Copia il precedente: 100 × 8' })).toHaveCount(SQUAT.sets - 1);
    const [kept, stored] = (await running(page)).exercises;
    expect(kept).toMatchObject({ exerciseId: SQUAT.exerciseId, variantOf: null });
    expect(kept.sets.map((s) => [s.kg, s.reps])).toEqual([[60, 8]]);
    expect(stored).toMatchObject({ exerciseId: alternative, variantOf: SQUAT.exerciseId });
    expect(stored.sets).toHaveLength(SQUAT.sets - 1);
    expect(stored.sets.every((s) => s.kg === null && s.reps === null && s.completedAt === null)).toBe(true);
    // la scheda non cambia
    expect((await storedArchive(page))!.routines[0].exercises[0].exerciseId).toBe(SQUAT.exerciseId);

    // "Annulla" rimette l'esercizio com'era
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(variant).toHaveCount(0);
    expect((await running(page)).exercises[0].sets).toHaveLength(SQUAT.sets);
  });

  test('US-14 senza serie fatte la variante prende il posto dell’esercizio previsto, e si torna indietro', async ({ page }) => {
    const alternative = SQUAT.alternatives[0];
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('60');
    await squat.getByRole('button', { name: 'Cambia esercizio' }).click();
    await sheet(page).getByRole('radio', { name: name(alternative) }).check();
    await sheet(page).getByRole('button', { name: 'Usa questo esercizio' }).click();
    await expect(page.getByText(`${name(alternative)} al posto di Squat bilanciere: i valori scritti si sono svuotati.`)).toBeVisible();
    const variant = region(page, alternative);
    expect((await running(page)).exercises[0]).toMatchObject({ exerciseId: alternative, variantOf: SQUAT.exerciseId });

    // si torna all'esercizio previsto
    await variant.getByRole('button', { name: 'Cambia variante' }).click();
    await sheet(page).getByRole('radio', { name: /^Squat bilanciere/ }).check();
    await sheet(page).getByRole('button', { name: 'Usa questo esercizio' }).click();
    await expect(region(page, SQUAT.exerciseId)).toBeVisible();
    expect((await running(page)).exercises[0]).toMatchObject({ exerciseId: SQUAT.exerciseId, variantOf: null });
  });

  test('US-14 "Altro esercizio…" scritto a mano diventa un esercizio personalizzato', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Cambia esercizio' }).click();
    await sheet(page).getByRole('radio', { name: 'Altro esercizio…' }).check();
    const field = sheet(page).getByRole('textbox', { name: 'Che esercizio fai al posto di quello previsto?' });
    await expect(field).toBeFocused();
    await field.fill('Squat con cintura elastica');
    await field.press('Enter');
    await expect(page.getByRole('region', { name: 'Squat con cintura elastica' })).toContainText('Al posto di Squat bilanciere');
    const stored = (await storedArchive(page))!;
    expect(stored.catalog['custom-squat-con-cintura-elastica']).toEqual({ id: 'custom-squat-con-cintura-elastica', name: 'Squat con cintura elastica' });
    expect(stored.sessions[0].exercises[0]).toMatchObject({ exerciseId: 'custom-squat-con-cintura-elastica', variantOf: SQUAT.exerciseId });
  });
});

test.describe('US-15 serie ed esercizi durante la sessione', () => {
  test('US-15 "Aggiungi serie" riprende il peso dell’ultima; togliere una serie con valori si annulla', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: `Peso serie ${SQUAT.sets}, kg` }).fill('55');
    await squat.getByRole('button', { name: 'Aggiungi serie' }).click();
    const added = squat.getByRole('textbox', { name: `Peso serie ${SQUAT.sets + 1}, kg` });
    await expect(added).toHaveValue('55');
    await expect(squat.getByRole('textbox', { name: `Ripetizioni serie ${SQUAT.sets + 1}` })).toHaveValue('');

    await squat.getByRole('button', { name: `Serie ${SQUAT.sets + 1}: tipo e opzioni` }).click();
    await sheet(page).getByRole('button', { name: 'Togli serie' }).click();
    await expect(added).toHaveCount(0);
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(added).toHaveValue('55');
    expect((await running(page)).exercises[0].sets).toHaveLength(SQUAT.sets + 1);
  });

  test('US-15 si toglie una serie in mezzo dal suo foglio, con "Annulla"; l’ultima serie rimasta non si toglie', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 2, kg' }).fill('47,5');
    const ids = (await running(page)).exercises[0].sets.map((s) => s.id);
    await squat.getByRole('button', { name: 'Serie 2: tipo e opzioni' }).click();
    await sheet(page).getByRole('button', { name: 'Togli serie' }).click();
    // la terza diventa la seconda
    await expect(squat.getByRole('textbox', { name: /^Peso serie \d, kg$/ })).toHaveCount(SQUAT.sets - 1);
    await expect(squat.getByRole('textbox', { name: 'Peso serie 2, kg' })).toHaveValue('');
    expect((await running(page)).exercises[0].sets.map((s) => s.id)).toEqual([ids[0], ...ids.slice(2)]);
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(squat.getByRole('textbox', { name: 'Peso serie 2, kg' })).toHaveValue('47,5');
    expect((await running(page)).exercises[0].sets.map((s) => s.id)).toEqual(ids);

    // con una serie sola il foglio lo dice e "Togli serie" è spento
    for (let n = SQUAT.sets; n > 1; n--) {
      await squat.getByRole('button', { name: `Serie ${n}: tipo e opzioni` }).click();
      await sheet(page).getByRole('button', { name: 'Togli serie' }).click();
    }
    await squat.getByRole('button', { name: 'Serie 1: tipo e opzioni' }).click();
    await expect(sheet(page).getByRole('button', { name: 'Togli serie' })).toBeDisabled();
    await expect(sheet(page)).toContainText('Resta almeno una serie');
  });

  test('US-15 aggiungi un esercizio dal catalogo, toglilo con "Annulla", riordina con le frecce', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
    await sheet(page).getByRole('searchbox').fill('leg press');
    await sheet(page).getByRole('button', { name: 'Leg press', exact: true }).click();
    const legPress = page.getByRole('region', { name: 'Leg press', exact: true });
    await expect(legPress).toBeVisible();
    await expect(legPress.getByRole('button', { name: /: tipo e opzioni$/ })).toHaveCount(3);
    expect((await running(page)).exercises.at(-1)?.exerciseId).toBe('leg-press');

    await legPress.getByRole('button', { name: 'Altre azioni: Leg press' }).click();
    await sheet(page).getByRole('button', { name: 'Togli dall’allenamento' }).click();
    await expect(legPress).toHaveCount(0);
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(legPress).toBeVisible();

    await page.getByRole('button', { name: 'Riordina esercizi' }).click();
    await page.getByRole('button', { name: 'Sposta giù Squat bilanciere' }).click();
    await expect(page.getByRole('button', { name: 'Sposta giù Squat bilanciere' })).toBeFocused();
    await page.getByRole('button', { name: 'Fine', exact: true }).click();
    const order = (await running(page)).exercises.map((e) => e.exerciseId);
    expect(order.slice(0, 3)).toEqual([BENCH.exerciseId, ROW.exerciseId, SQUAT.exerciseId]);
    await expect(page.getByRole('list', { name: 'Esercizi' }).getByRole('region').first()).toHaveAccessibleName(name(BENCH.exerciseId));
  });
});

test.describe('US-16 note sul carico', () => {
  test('US-16 la nota si scrive in sessione e si ritrova accanto al precedente la volta dopo', async ({ page }) => {
    const past = pastSession('2026-10-06', 40, 8, (s) => (s.exercises[1].notes = 'per manubrio, sedile 4'));
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [past] }));
    await expect(region(page, BENCH.exerciseId)).toContainText('Nota del 6 ottobre: «per manubrio, sedile 4»');

    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('button', { name: 'Altre azioni: Squat bilanciere' }).click();
    await sheet(page).getByRole('button', { name: 'Nota sul carico' }).click();
    const note = squat.getByRole('textbox', { name: 'Nota sul carico' });
    await expect(note).toBeFocused();
    await note.fill('cintura, bilanciere da 20');
    expect((await running(page)).exercises[0].notes).toBe('cintura, bilanciere da 20');
  });
});

test.describe('US-17 ripresa e mini-barra', () => {
  test('US-17 sessione completa da scheda con ricaricamento a metà: tutto resta dov’era', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    const squat = region(page, SQUAT.exerciseId);
    for (let n = 1; n <= SQUAT.sets; n++) await squat.getByRole('button', { name: `Segna serie ${n} come fatta` }).click();
    await region(page, BENCH.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();

    await page.reload();
    // lo squat fatto è compatto, la panca ha la sua serie spuntata e la serie da fare è il rematore (2b)
    await expect(region(page, SQUAT.exerciseId).getByRole('button', { name: 'Mostra serie' })).toBeVisible();
    await expect(region(page, BENCH.exerciseId).getByRole('button', { name: 'Annulla serie 1' })).toBeVisible();
    await expect(region(page, ROW.exerciseId)).toContainText('Adesso');
    await expect(page.getByText('Iniziato alle 18:30 · 1 di 8 esercizi fatti')).toBeVisible();
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Mostra serie' }).click();
    await expect(region(page, SQUAT.exerciseId).getByRole('textbox', { name: 'Peso serie 3, kg' })).toHaveValue('40');
  });

  test('US-17 dalle altre schermate una mini-barra riporta alla sessione; su Oggi c’è "Riprendi"', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await expect(page.getByRole('link', { name: /^Allenamento in corso/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Torna a Oggi' }).click();
    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Calendario' }).click();
    await expectPage(page, 'calendar/');
    const mini = page.getByRole('link', { name: /^Allenamento in corso: Scheda A, da 0 min · Squat bilanciere/ });
    await expect(mini).toBeVisible();
    // la mini-barra sta sopra la tab bar e il contenuto le lascia spazio
    const bar = (await mini.boundingBox())!;
    const tabs = (await page.getByRole('navigation', { name: 'Sezioni' }).boundingBox())!;
    expect(bar.y + bar.height).toBeLessThanOrEqual(tabs.y + 1);
    expect(await page.evaluate(() => document.body.style.getPropertyValue('--bottom-bars-height'))).toBe(`${57 + Math.round(bar.height)}px`);

    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Schede' }).click();
    await expectPage(page, 'routines/');
    await expect(mini).toBeVisible();
    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Oggi' }).click();
    await expectPage(page, '');
    await expect(mini).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Riprendi allenamento' })).toBeVisible();
    await page.goto('settings/');
    await page.getByRole('link', { name: /^Allenamento in corso/ }).click();
    await expectPage(page, 'workout/');
    await expect(page.getByRole('heading', { name: 'Scheda A' })).toBeVisible();
  });

  test('US-17 in superserie, dopo una serie di 2a tocca a 2b', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    const squat = region(page, SQUAT.exerciseId);
    for (let n = 1; n <= SQUAT.sets; n++) await squat.getByRole('button', { name: `Segna serie ${n} come fatta` }).click();
    await expect(region(page, BENCH.exerciseId)).toContainText('Adesso');
    await region(page, BENCH.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(region(page, ROW.exerciseId)).toContainText('Adesso');
    await expect(region(page, BENCH.exerciseId)).not.toContainText('Adesso');
    await region(page, ROW.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(region(page, BENCH.exerciseId)).toContainText('Adesso');
  });
});

test.describe('US-18 fine dell’allenamento', () => {
  test('US-18 "Termina" porta al riepilogo con durata, serie, volume e record; "Riapri" lo rimette in corso', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('45');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(squat.getByRole('button', { name: /^Annulla serie 1/ })).toBeVisible();
    await expect(squat.getByLabel('Copia il precedente: 40 × 8. Record di carico')).toBeVisible();
    // la seconda serie, vuota, prende il peso scritto nella prima (45) e le ripetizioni della volta scorsa
    await expect(squat.getByRole('textbox', { name: 'Peso serie 2, kg' })).toHaveAttribute('placeholder', '45');
    await squat.getByRole('button', { name: 'Segna serie 2 come fatta' }).click();
    // un'ora dopo
    await page.clock.setFixedTime(new Date(NOW.getTime() + 65 * 60_000));
    // restano serie da fare: "Termina" non è pieno e chiede conferma
    await expect(page.getByRole('button', { name: 'Termina' })).toHaveClass(/btn-secondary/);
    await page.getByRole('button', { name: 'Termina' }).click();
    const confirm = page.getByRole('dialog', { name: 'Terminare l’allenamento?' });
    await expect(confirm).toContainText(`Restano ${A.exercises.reduce((n, e) => n + e.sets, 0) - 2} serie da fare in ${A.exercises.length} esercizi.`);
    await confirm.getByRole('button', { name: 'Termina' }).click();

    await expect(page).toHaveURL(/\/workout\/\?summary=/);
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await expect(page.getByText('Scheda A · giovedì 8 ottobre · 18:30–19:35')).toBeVisible();
    const stats = page.locator('dl');
    await expect(stats).toContainText('Durata 1 h 05 min');
    await expect(stats).toContainText('Esercizi 1');
    await expect(stats).toContainText('Serie 2');
    await expect(stats).toContainText(`Volume ${45 * 8 * 2} kg`);
    // stesse ripetizioni con più carico: record di carico e di 1RM stimato (45 × 8 → 57 kg); il volume no,
    // perché la volta scorsa tutte le serie erano fatte
    await expect(page.getByRole('heading', { name: 'Record battuti' })).toBeVisible();
    await expect(page.getByText('Carico 45 kg, prima 40 kg · 1RM stimato 57 kg')).toBeVisible();
    await expect(page.getByText(/Volume \d+ kg, prima/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Allenamento in corso/ })).toHaveCount(0);
    const done = (await storedArchive(page))!.sessions.find((s) => s.routineId === 'routine-a' && s.date === '2026-10-08')!;
    expect(done.end).toBe(NOW.getTime() + 65 * 60_000);

    // dopo un ricaricamento il riepilogo resta
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await page.getByRole('button', { name: 'Riapri allenamento' }).click();
    await expectPage(page, 'workout/');
    await expect(region(page, SQUAT.exerciseId).getByRole('button', { name: 'Annulla serie 1' })).toBeVisible();
    expect((await running(page)).id).toBe(done.id);
  });

  test('US-18 senza serie registrate "Termina" lo dice e non conclude', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByText('Registra almeno una serie prima di terminare, oppure annulla l’allenamento.')).toBeVisible();
    await expectPage(page, 'workout/');
    expect((await running(page)).end).toBeNull();
  });

  test('US-03 dopo il primo allenamento concluso, l’invito discreto a installare l’app', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    // il browser permette l'installazione: un evento finto, trattenuto dall'app
    await page.evaluate(() => {
      const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: async () => void ((window as unknown as { prompted: boolean }).prompted = true),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });
      window.dispatchEvent(event);
    });
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('50');
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('5');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await finishWorkout(page);
    await expect(page.getByRole('heading', { name: 'Tienila sul telefono' })).toBeVisible();
    await page.getByRole('button', { name: 'Installa l’app' }).click();
    expect(await page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  });

  test('US-03 dal secondo allenamento concluso l’invito non c’è più', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06')] }));
    await page.evaluate(() => {
      const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
      window.dispatchEvent(event);
    });
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await finishWorkout(page);
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tienila sul telefono' })).toHaveCount(0);
  });
});

test.describe('US-19 US-20 US-27 approfondimento, più sessioni, nome e data', () => {
  test('US-19 il nome dell’esercizio apre l’approfondimento in un foglio dal basso', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Squat bilanciere: come si esegue' }).click();
    const details = page.getByRole('dialog', { name: 'Squat bilanciere' });
    await expect(details).toContainText('L’approfondimento per questo esercizio non è ancora disponibile.');
    await expect(details.getByRole('heading', { name: 'Ultima volta, 6 ottobre' })).toBeVisible();
    await expect(details).toContainText('40 kg × 8 rip');
    await page.keyboard.press('Escape');
    await expect(details).toHaveCount(0);
  });

  test('US-20 dopo un allenamento concluso se ne fa un altro nello stesso giorno', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('50');
    await squat.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('5');
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await finishWorkout(page);
    await page.getByRole('link', { name: 'Fatto' }).click();
    await expectPage(page, '');
    await expect(page.getByText('Fatto oggi: Scheda A')).toBeVisible();
    await page.getByRole('button', { name: 'Nuovo allenamento' }).click();
    await expectPage(page, 'workout/');
    await expect(page.getByRole('heading', { name: 'Scheda B' })).toBeVisible();
    const sessions = (await storedArchive(page))!.sessions;
    expect(sessions.map((s) => [s.date, s.end === null])).toEqual([
      ['2026-10-08', false],
      ['2026-10-08', true],
    ]);
  });

  test('US-27 nome e data dell’allenamento si cambiano anche in corso', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await page.getByRole('button', { name: 'Nome e data' }).click();
    await page.getByRole('textbox', { name: 'Nome dell’allenamento' }).fill('Scheda A, mattina');
    await expect(page.getByRole('heading', { name: 'Scheda A, mattina' })).toBeVisible();
    await page.getByLabel('Data').fill('2026-10-07');
    await page.getByLabel('Data').blur();
    await expect(page.getByText('Iniziato ieri')).toBeVisible();
    expect(await running(page)).toMatchObject({ name: 'Scheda A, mattina', date: '2026-10-07' });
  });

  test('US-11 allenamento libero: stato vuoto che insegna ad aggiungere un esercizio', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: routines() }));
    await page.goto('');
    await page.getByRole('button', { name: 'Allenamento libero' }).click();
    await expect(page.getByRole('heading', { name: 'Da quale esercizio inizi?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aggiungi esercizio' })).toHaveClass(/btn-primary/);
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByText('Aggiungi almeno un esercizio prima di concludere.')).toBeVisible();
  });
});

test.describe('US-33 P2 P3 barra fissa e misure', () => {
  test('US-33 la barra dell’allenamento mostra sempre durata e salvataggio, con "Termina"', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await page.clock.setFixedTime(new Date(NOW.getTime() + 25 * 60_000));
    await page.reload();
    const status = page.getByRole('status').filter({ hasText: 'Salvato' });
    await expect(status).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Durata: 25 min' })).toBeVisible();
    // nessuna tab bar sotto (step 9): la barra è in fondo allo schermo, nella zona del pollice
    const termina = (await page.getByRole('button', { name: 'Termina' }).boundingBox())!;
    expect(termina.y + termina.height).toBeGreaterThan(page.viewportSize()!.height - 80);
    expect(termina.y + termina.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(termina.height).toBeGreaterThanOrEqual(48);
  });

  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [430, 932],
    [1280, 800],
  ]) {
    test(`P2 P3 a ${width}×${height} la riga serie entra senza scorrere di lato, cifre ≥ 20px e bersagli ≥ 48px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 102.5, 12)] }));
      const squat = region(page, SQUAT.exerciseId);
      const check = squat.getByRole('button', { name: 'Segna serie 1 come fatta' });
      await expect(check).toBeInViewport();
      const box = (await check.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      const field = squat.getByRole('textbox', { name: 'Peso serie 1, kg' });
      expect(parseFloat(await field.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);
      expect((await field.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});

// Righe della tabella "Assorbimento del PoC" (PIANO.md) senza un altro e2e: indicazioni della scheda
// sull'esercizio e limite delle serie, come nel PoC.
test.describe('US-12 US-15 funzioni del PoC', () => {
  test('US-12 l’esercizio mostra le indicazioni della scheda: serie × ripetizioni, carico con l’unità, recupero', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: starterRoutines() }));
    await expect(region(page, SQUAT.exerciseId)).toContainText('3 × 6–8 · 45–50 kg · rec. 2:00');
    const dumbbell = A.exercises.find((e) => e.unit === 'per manubrio')!;
    await expect(region(page, dumbbell.exerciseId)).toContainText(`${dumbbell.loadMin}–${dumbbell.loadMax} kg per manubrio`);
  });

  test('US-15 con 100 serie "Aggiungi serie" è disattivato e il motivo è scritto', async ({ page }) => {
    const archive = archiveWith({ routines: routines() });
    const { session } = startSession(archive, 'routine-a', NOW.getTime() - 600_000);
    const first = session.exercises[0];
    first.sets = Array.from({ length: 100 }, (_, i) => ({ id: `set-${i}`, type: 'normal' as const, kg: null, reps: null, completedAt: null }));
    await seedArchive(page, archiveWith({ routines: routines(), sessions: [session] }));
    await page.goto('workout/');
    const squat = region(page, SQUAT.exerciseId);
    await expect(squat.getByRole('button', { name: 'Aggiungi serie' })).toBeDisabled();
    await expect(squat.getByText('Al massimo 100 serie per esercizio.')).toBeVisible();
  });
});

test.describe('US-17 US-18 allenamento come modalità (step 9)', () => {
  test('US-17 senza tab bar sull’allenamento: si torna a Oggi dall’intestazione e la mini-barra riporta qui', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines() }));
    await expect(page.getByRole('navigation', { name: 'Sezioni' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Torna a Oggi' }).click();
    await expectPage(page, '');
    await expect(page.getByRole('navigation', { name: 'Sezioni' })).toBeVisible();
    await page.getByRole('link', { name: 'Riprendi allenamento' }).click();
    await expectPage(page, 'workout/');
  });

  test('US-18 con tutte le serie spuntate "Termina" è pieno e chiude senza chiedere', async ({ page }) => {
    const archive = archiveWith({ routines: routines() });
    const { session } = startSession(archive, 'routine-a', NOW.getTime() - 3_600_000);
    session.exercises = session.exercises.slice(0, 1);
    for (const set of session.exercises[0].sets) Object.assign(set, { kg: 40, reps: 8, completedAt: NOW.getTime() - 60_000 });
    await seedArchive(page, archiveWith({ routines: routines(), sessions: [session] }));
    await page.goto('workout/');
    await expect(page.getByRole('button', { name: 'Termina' })).toHaveClass(/btn-primary/);
    await finishWorkout(page);
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
  });

  test('US-18 "Termina" con serie da fare: "Annulla" lascia l’allenamento in corso', async ({ page }) => {
    await startFromToday(page, archiveWith({ routines: routines(), sessions: [pastSession('2026-10-06', 40, 8)] }));
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await page.getByRole('button', { name: 'Termina' }).click();
    await page.getByRole('dialog', { name: 'Terminare l’allenamento?' }).getByRole('button', { name: 'Annulla' }).click();
    await expect(page.getByRole('dialog', { name: 'Terminare l’allenamento?' })).toHaveCount(0);
    expect((await running(page)).end).toBeNull();
  });
});
