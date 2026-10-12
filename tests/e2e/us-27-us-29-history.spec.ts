import { expect, test, type Page } from '@playwright/test';
import { REST_TIMER_KEY } from '../../src/lib/rest-timer';
import type { Session, SetType } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// Storico e progressi (step 8): US-27 l'elenco degli allenamenti conclusi e la loro correzione, US-28 i
// progressi di un esercizio (record, grafico, cronologia delle serie) e US-29 i record segnalati
// nell'elenco. "Oggi" è giovedì 8 ottobre 2026 alle 18:30 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

/** Una serie di una sessione di prova: normale se non è indicato il tipo */
type SetSpec = { kg: number | null; reps: number | null; type?: SetType };

/**
 * Sessione conclusa con una sola voce e le serie indicate, tutte fatte all'ora di inizio.
 * Parte da `session()` (helpers.ts) e cambia solo quello che serve al test.
 */
function finished(
  id: string,
  date: string,
  sets: SetSpec[],
  { name = 'Allenamento libero', hour = 18, exerciseId = 'squat-bilanciere', variantOf = null }: { name?: string; hour?: number; exerciseId?: string; variantOf?: string | null } = {},
): Session {
  const base = session(id, date);
  const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();
  return {
    ...base,
    name,
    start,
    end: start + 3_600_000,
    exercises: [
      {
        ...base.exercises[0],
        exerciseId,
        variantOf,
        sets: sets.map((s, i) => ({ id: `${id}-s${i + 1}`, type: s.type ?? 'normal', kg: s.kg, reps: s.reps, completedAt: start + 60_000 })),
      },
    ],
  };
}

/** Sessione in corso: stessa forma di una conclusa, senza fine */
function running(id: string, date: string, name: string): Session {
  return { ...finished(id, date, [{ kg: 40, reps: 8 }], { name }), end: null };
}

/** Le righe dell'elenco per mese dello Storico */
const historyRows = (page: Page) => page.locator('main ol > li > a');
/** Le voci della "Cronologia delle serie" della pagina dell'esercizio */
const chronology = (page: Page) => page.locator('main ol > li > a');
/** Il valore letto sopra il grafico: l'ultimo punto, o quello scelto con le frecce */
const readout = (page: Page) => page.locator('p[aria-live="polite"]');
/** La trama del grafico, dove le frecce scelgono il punto */
const plot = (page: Page) => page.getByRole('group', { name: /^(Carico massimo|1RM stimato|Volume) per allenamento:/ });
/** Un record personale: il blocco che contiene il termine dato ("Carico massimo") */
const record = (page: Page, term: string) => page.locator('main dl > div').filter({ hasText: term });
/** Lo stato del timer di recupero salvato: null = nessun recupero in corso */
const storedTimer = (page: Page) => page.evaluate((key) => localStorage.getItem(key), REST_TIMER_KEY);

test.describe('US-27 l’elenco degli allenamenti conclusi', () => {
  test('US-27 US-20 lo Storico elenca per mese, dal più recente, anche due nello stesso giorno', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [
          finished('sera', '2026-10-08', [{ kg: 50, reps: 8 }], { hour: 18, name: 'Sessione della sera' }),
          finished('mattino', '2026-10-08', [{ kg: 40, reps: 8 }], { hour: 10, name: 'Sessione del mattino' }),
          finished('settembre', '2026-09-30', [{ kg: 45, reps: 6 }], { name: 'Sessione di settembre' }),
        ],
      }),
    );
    await page.goto('history/');

    // i due mesi, dal più recente, e dentro il mese la sessione iniziata più tardi per prima
    await expect(page.locator('main section > h2')).toHaveText(['Ottobre 2026', 'Settembre 2026']);
    const rows = historyRows(page);
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('Sessione della sera');
    await expect(rows.nth(1)).toContainText('Sessione del mattino');
    await expect(rows.nth(2)).toContainText('Sessione di settembre');
    // giorno, durata, serie e volume della sessione
    await expect(rows.nth(0)).toContainText('giovedì 8 ottobre · 1 h 00 min · 1 serie · 400 kg');
    await expect(rows.nth(2)).toContainText('mercoledì 30 settembre');

    // ogni riga porta al dettaglio dell’allenamento
    await rows.nth(1).click();
    await expectPage(page, 'session/');
    await expect(page).toHaveURL(/id=mattino/);
    await expect(page.getByRole('heading', { name: 'Sessione del mattino' })).toBeVisible();
  });

  test('US-27 senza allenamenti conclusi lo Storico spiega dove compariranno', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('history/');

    await expect(page.getByRole('heading', { name: 'Ancora nessun allenamento' })).toBeVisible();
    await expect(page.getByText('Quando termini un allenamento lo ritrovi qui, per data, con serie e volume. Da qui puoi anche correggerlo.')).toBeVisible();
    await expect(historyRows(page)).toHaveCount(0);
    await page.getByRole('link', { name: 'Vai a Oggi' }).click();
    await expectPage(page, '');
  });

  test('US-27 un allenamento in corso sta in cima, con "Riprendi"', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [
          finished('mattino', '2026-10-08', [{ kg: 40, reps: 8 }], { hour: 9, name: 'Sessione del mattino' }),
          running('in-corso', '2026-10-08', 'Sessione di adesso'),
        ],
      }),
    );
    await page.goto('history/');

    const riprendi = page.getByRole('link', { name: 'Riprendi' });
    await expect(riprendi).toBeVisible();
    await expect(page.getByText('In corso · iniziato alle 18:00')).toBeVisible();
    // sopra l’elenco, che resta sotto
    expect((await riprendi.boundingBox())!.y).toBeLessThan((await page.getByRole('heading', { name: 'Ottobre 2026' }).boundingBox())!.y);
    await expect(historyRows(page)).toHaveCount(1);

    await riprendi.click();
    await expectPage(page, 'workout/');
  });

  test('US-27 il dettaglio si corregge e la spunta non avvia il recupero', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('concluso', '2026-10-06', [{ kg: 60, reps: 8 }, { kg: 60, reps: 8 }])] }));
    await page.goto('session/?id=concluso');

    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Storico' })).toBeVisible();
    await expect(page.getByText('martedì 6 ottobre · 18:00–19:00 · 2 serie · volume 960 kg')).toBeVisible();
    // l’esercizio con tutte le serie fatte è compatto
    await expect(page.getByRole('textbox', { name: 'Ripetizioni serie 1' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Mostra serie' }).click();
    const reps = page.getByRole('textbox', { name: 'Ripetizioni serie 1' });
    await expect(reps).toHaveValue('8');
    await reps.fill('10');
    await expect.poll(async () => (await storedArchive(page))!.sessions[0].exercises[0].sets[0].reps).toBe(10);
    await expect(page.getByText('martedì 6 ottobre · 18:00–19:00 · 2 serie · volume 1080 kg')).toBeVisible();

    // una sessione conclusa si corregge: la spunta non fa partire nessun recupero
    await page.getByRole('button', { name: 'Annulla serie 1' }).click();
    await expect(page.getByRole('button', { name: 'Segna serie 1 come fatta' })).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(page.getByRole('button', { name: 'Annulla serie 1' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('dialog', { name: 'Recupero' })).toHaveCount(0);
    await expect(sheet(page)).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();
    expect((await storedArchive(page))!.sessions[0].exercises[0].sets[0]).toMatchObject({ kg: 60, reps: 10 });
  });

  test('US-27 eliminare un allenamento chiede conferma e si può annullare', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('concluso', '2026-10-06', [{ kg: 60, reps: 8 }, { kg: 60, reps: 8 }])] }));
    await page.goto('session/?id=concluso');

    await page.getByRole('button', { name: 'Elimina allenamento' }).click();
    const dialog = page.getByRole('dialog', { name: 'Eliminare l’allenamento?' });
    await expect(dialog).toContainText('Si perde quanto registrato in «Allenamento libero»');
    await expect(dialog).toContainText('2 serie fatte');
    // primo tocco annullato: non si perde niente
    await dialog.getByRole('button', { name: 'Annulla' }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    expect((await storedArchive(page))!.sessions).toHaveLength(1);

    await page.getByRole('button', { name: 'Elimina allenamento' }).click();
    await page.getByRole('dialog', { name: 'Eliminare l’allenamento?' }).getByRole('button', { name: 'Elimina allenamento' }).click();
    await expect.poll(async () => (await storedArchive(page))!.sessions.length).toBe(0);
    await expect(page.getByRole('heading', { name: 'Allenamento non trovato' })).toBeVisible();

    // l’avviso permette di tornare indietro
    const toast = page.getByRole('status').filter({ hasText: 'Allenamento eliminato.' });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Annulla' }).click();
    await expect.poll(async () => (await storedArchive(page))!.sessions.length).toBe(1);
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Allenamento non trovato' })).toHaveCount(0);
  });

  test('US-27 "Riapri allenamento" lo rimette in corso', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('concluso', '2026-10-06', [{ kg: 60, reps: 8 }])] }));
    await page.goto('session/?id=concluso');

    await page.getByRole('button', { name: 'Riapri allenamento' }).click();
    await expectPage(page, 'workout/');
    await expect.poll(async () => (await storedArchive(page))!.sessions[0].end).toBeNull();
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Termina' })).toBeVisible();
  });

  test('US-27 dal calendario si apre il dettaglio e si torna al giorno', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('concluso', '2026-10-06', [{ kg: 50, reps: 8 }])] }));
    await page.goto('calendar/?date=2026-10-06');

    await expect(sheet(page).getByRole('heading', { name: 'martedì 6 ottobre' })).toBeVisible();
    await sheet(page).getByRole('link', { name: /^Allenamento libero/ }).click();
    await expectPage(page, 'session/');
    await expect(page).toHaveURL(/id=concluso/);
    await expect(page).toHaveURL(/date=2026-10-06/);
    await expect(page.getByRole('heading', { name: 'Allenamento libero' })).toBeVisible();

    await page.getByRole('link', { name: 'Torna al calendario' }).click();
    await expectPage(page, 'calendar/');
    await expect(page).toHaveURL(/date=2026-10-06/);
    await expect(sheet(page).getByRole('heading', { name: 'martedì 6 ottobre' })).toBeVisible();
    await expect(sheet(page).getByRole('link', { name: /^Allenamento libero/ })).toBeVisible();
  });
});

test.describe('US-28 i progressi di un esercizio', () => {
  /** Tre sessioni dello stesso esercizio, con il riscaldamento più pesante delle serie di lavoro */
  const progress = [
    finished('prog-1', '2026-08-20', [{ kg: 100, reps: 5, type: 'warmup' }, { kg: 50, reps: 8 }]),
    finished('prog-2', '2026-09-15', [{ kg: 120, reps: 3, type: 'warmup' }, { kg: 60, reps: 10 }]),
    finished('prog-3', '2026-10-01', [{ kg: 140, reps: 2, type: 'warmup' }, { kg: 55, reps: 8 }]),
  ];

  test('US-28 record, grafico e cronologia dell’esercizio, senza il riscaldamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: progress }));
    await page.goto('exercise/?id=squat-bilanciere');

    await expect(page.getByRole('heading', { name: 'Squat bilanciere' })).toBeVisible();
    await expect(page.getByText('3 allenamenti dal 20 agosto')).toBeVisible();

    // il riscaldamento più pesante (100, 120 e 140 kg) non conta per record e volume
    await expect(page.getByRole('heading', { name: 'Record personali' })).toBeVisible();
    await expect(record(page, 'Carico massimo')).toContainText('60 kg × 10');
    await expect(record(page, '1RM stimato')).toContainText('80 kg');
    await expect(record(page, 'Volume')).toContainText('600 kg');

    // il grafico parte dall’ultimo allenamento
    await expect(readout(page)).toContainText('55 kg');
    await expect(readout(page)).toContainText('1 ottobre');

    // la cronologia, dal più recente, con la sigla R sul riscaldamento
    const items = chronology(page);
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('1 ottobre');
    await expect(items.nth(0)).toContainText('R 140 × 2 · 55 × 8');
    await expect(items.nth(0)).toContainText('1 serie · 1RM 69,75 kg · volume 440 kg');
    await expect(items.nth(2)).toContainText('20 agosto');
    await expect(items.nth(2)).toContainText('R 100 × 5 · 50 × 8');
  });

  test('US-28 misura e periodo cambiano il grafico, e le frecce scelgono il punto', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [
          finished('vecchia', '2025-06-10', [{ kg: 70, reps: 5 }]),
          finished('agosto', '2026-08-20', [{ kg: 50, reps: 8 }]),
          finished('settembre', '2026-09-15', [{ kg: 60, reps: 10 }]),
        ],
      }),
    );
    await page.goto('exercise/?id=squat-bilanciere');

    // di partenza: carico, ultimi 3 mesi
    await expect(page.getByRole('radio', { name: 'Carico', exact: true })).toBeChecked();
    await expect(page.getByRole('radio', { name: '3 mesi', exact: true })).toBeChecked();
    await expect(readout(page)).toContainText('60 kg');
    await expect(readout(page)).toContainText('15 settembre');
    await expect(chronology(page)).toHaveCount(2);
    // i record personali valgono su tutto lo storico, quindi la data del 2025 compare lì comunque:
    // qui conta la cronologia, che è quella filtrata dal periodo
    await expect(chronology(page).filter({ hasText: '10 giugno 2025' })).toHaveCount(0);

    // la misura cambia cosa si legge
    await page.getByRole('radio', { name: '1RM', exact: true }).check();
    await expect(readout(page)).toContainText('80 kg');
    await expect(page.getByText(/Stima con la formula di Epley/)).toBeVisible();

    // il periodo allarga la cronologia: la sessione di oltre un anno fa compare solo con "Tutto"
    await page.getByRole('radio', { name: '1 anno', exact: true }).check();
    await expect(chronology(page)).toHaveCount(2);
    await page.getByRole('radio', { name: 'Tutto', exact: true }).check();
    await expect(chronology(page)).toHaveCount(3);
    await expect(chronology(page).filter({ hasText: '10 giugno 2025' })).toHaveCount(1);

    // le frecce scorrono i valori
    await plot(page).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(readout(page)).toContainText('63,25 kg');
    await page.keyboard.press('End');
    await expect(readout(page)).toContainText('80 kg');
    await page.keyboard.press('Home');
    await expect(readout(page)).toContainText('81,75 kg');
  });

  test('US-28 la variante ha i suoi progressi, separati da quelli dell’esercizio previsto', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [
          finished('leg', '2026-09-15', [{ kg: 100, reps: 5 }], { exerciseId: 'leg-press', variantOf: 'squat-bilanciere' }),
          finished('squat', '2026-10-01', [{ kg: 60, reps: 8 }]),
        ],
      }),
    );

    await page.goto('exercise/?id=squat-bilanciere');
    await expect(page.getByRole('heading', { name: 'Squat bilanciere' })).toBeVisible();
    await expect(page.getByText('1 allenamento dal 1 ottobre')).toBeVisible();
    await expect(record(page, 'Carico massimo')).toContainText('60 kg × 8');
    await expect(chronology(page)).toHaveCount(1);
    await expect(page.getByText('Leg press')).toHaveCount(0);

    await page.goto('exercise/?id=leg-press');
    await expect(page.getByRole('heading', { name: 'Leg press' })).toBeVisible();
    await expect(page.getByText('1 allenamento dal 15 settembre')).toBeVisible();
    await expect(record(page, 'Carico massimo')).toContainText('100 kg × 5');
    await expect(chronology(page)).toHaveCount(1);
    await expect(page.getByText('Squat bilanciere')).toHaveCount(0);
  });

  test('US-28 i valori sono nell’unità scelta', async ({ page }) => {
    const archive = archiveWith({ sessions: [finished('lb', '2026-10-01', [{ kg: 60, reps: 8 }])] });
    await seedArchive(page, { ...archive, settings: { ...archive.settings, weightUnit: 'lb' } });
    await page.goto('exercise/?id=squat-bilanciere');

    await expect(record(page, 'Carico massimo')).toContainText('132,5 lb × 8');
    await expect(readout(page)).toContainText('132,5 lb');
    await expect(chronology(page).nth(0)).toContainText('132,5 × 8');
  });

  test('US-28 con solo riscaldamento niente grafico, e la pagina lo spiega', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('riscaldamento', '2026-10-01', [{ kg: 100, reps: 5, type: 'warmup' }])] }));
    await page.goto('exercise/?id=squat-bilanciere');

    await expect(page.getByText('Solo serie di riscaldamento o senza carico: non contano per record e grafici.')).toBeVisible();
    await expect(page.getByText(/Nessuna serie con il carico/)).toBeVisible();
    await expect(page.locator('figure')).toHaveCount(0);
    await expect(readout(page)).toHaveCount(0);
    // la serie resta comunque in cronologia
    await expect(chronology(page)).toHaveCount(1);
    await expect(chronology(page).nth(0)).toContainText('R 100 × 5');
  });

  test('US-28 dallo Storico, vista Esercizi, si apre l’esercizio e la vista resta', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [finished('concluso', '2026-10-01', [{ kg: 60, reps: 10 }])] }));
    await page.goto('history/');
    await page.getByRole('radio', { name: 'Esercizi' }).check();
    await expect(page).toHaveURL(/view=exercises/);

    const row = page.getByRole('link', { name: /^Squat bilanciere/ });
    await expect(row).toContainText('Ultima volta: 7 giorni fa · 1 allenamento');
    await expect(page.getByRole('heading', { name: 'Ottobre 2026' })).toHaveCount(0);
    await row.click();

    await expectPage(page, 'exercise/');
    await expect(page.getByRole('heading', { name: 'Squat bilanciere' })).toBeVisible();
    await page.getByRole('link', { name: 'Esercizi' }).click();

    // la vista scelta è nell’indirizzo: torna e resta anche dopo un ricaricamento
    await expectPage(page, 'history/');
    await expect(page.getByRole('radio', { name: 'Esercizi' })).toBeChecked();
    await expect(page.getByRole('link', { name: /^Squat bilanciere/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Esercizi' })).toBeChecked();
    await expect(page.getByRole('link', { name: /^Squat bilanciere/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ottobre 2026' })).toHaveCount(0);
  });
});

test.describe('US-29 i record nell’elenco', () => {
  test('US-29 la riga dello Storico segnala i record battuti', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        sessions: [
          finished('primo', '2026-09-15', [{ kg: 50, reps: 8 }], { name: 'Allenamento del 15 settembre' }),
          finished('secondo', '2026-10-01', [{ kg: 60, reps: 10 }], { name: 'Allenamento del 1 ottobre' }),
          finished('terzo', '2026-10-05', [{ kg: 65, reps: 1 }], { name: 'Allenamento del 5 ottobre' }),
        ],
      }),
    );
    await page.goto('history/');

    const row = (name: string) => page.getByRole('link', { name: new RegExp(`^${name}`) });
    // carico, 1RM stimato e volume tutti migliori
    await expect(row('Allenamento del 1 ottobre')).toContainText('3 record');
    // il carico più alto, ma con una sola ripetizione: un record solo (al singolare)
    await expect(row('Allenamento del 5 ottobre')).toContainText('Record');
    // la prima volta non batte niente
    await expect(row('Allenamento del 15 settembre')).not.toContainText('record');
  });
});
