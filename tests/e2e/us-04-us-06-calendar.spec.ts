import { expect, test, type Page } from '@playwright/test';
import { starterRoutines } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// Calendario (step 5): US-04 settimana tipo, US-05 settimana e mese con lo stato dei giorni,
// US-06 eccezione per una sola data. "Oggi" è fissato con page.clock: giovedì 8 ottobre 2026; la
// settimana è la finestra di 7 giorni da oggi (8–14 ottobre).

const THURSDAY = new Date('2026-10-08T10:00:00+02:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(THURSDAY);
});

/** Riga di un giorno nella settimana (pulsante con l'etichetta completa del giorno) */
const dayRow = (page: Page, label: RegExp) => page.getByRole('button', { name: label });

test.describe('US-04 settimana tipo', () => {
  test('US-04 pianifico B il giovedì → giovedì Oggi propone B', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    // senza pianificazione Oggi suggerisce la prima scheda
    await page.goto('');
    await expect(page.getByRole('radio', { name: /^Scheda A/ })).toBeChecked();

    await page.goto('calendar/');
    await expect(page.getByText('Nessun giorno ha ancora una scheda.')).toBeVisible();
    await page.getByLabel('giovedì', { exact: true }).selectOption({ label: 'Scheda B' });
    await expect.poll(async () => (await storedArchive(page))?.schedule).toEqual({ thu: 'routine-b' });
    await expect(page.getByText('Nessun giorno ha ancora una scheda.')).toHaveCount(0);
    await expect(dayRow(page, /^giovedì 8 ottobre, oggi: Scheda B, in programma/)).toBeVisible();
    // vale per tutte le settimane
    await page.getByRole('button', { name: 'Settimana successiva' }).click();
    await expect(page.getByRole('heading', { name: '15–21 ottobre' })).toBeVisible();
    await expect(dayRow(page, /^giovedì 15 ottobre: Scheda B, in programma/)).toBeVisible();

    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Oggi' }).click();
    await expect(page.getByText('In programma: Scheda B')).toBeVisible();
    const planned = page.getByRole('radio', { name: /^Scheda B/ });
    await expect(planned).toBeChecked();
    await expect(page.locator('label', { has: planned }).getByText('Oggi', { exact: true })).toBeVisible();
  });

  test('US-04 riposo e "niente" per un giorno; una scheda archiviata ancora assegnata è segnalata', async ({ page }) => {
    const routines = starterRoutines();
    routines[1].archived = true;
    await seedArchive(page, archiveWith({ routines, schedule: { mon: 'routine-b' } }));
    await page.goto('calendar/');
    await expect(page.getByText('«Scheda B» è archiviata: questo giorno non propone niente.')).toBeVisible();
    await expect(dayRow(page, /^lunedì 12 ottobre: Niente in programma/)).toBeVisible();
    // l'archiviata non si può scegliere
    await expect(page.getByLabel('martedì', { exact: true }).locator('option', { hasText: 'Scheda B' })).toHaveCount(0);

    await page.getByLabel('lunedì', { exact: true }).selectOption({ label: 'Scheda A' });
    await expect(page.getByText('è archiviata')).toHaveCount(0);
    await page.getByLabel('sabato', { exact: true }).selectOption({ label: 'Riposo' });
    await expect(dayRow(page, /^sabato 10 ottobre: Riposo$/)).toBeVisible();
    await page.getByLabel('sabato', { exact: true }).selectOption({ label: 'Niente' });
    await expect.poll(async () => (await storedArchive(page))?.schedule).toEqual({ mon: 'routine-a' });
  });
});

test.describe('US-05 la settimana a colpo d’occhio', () => {
  const plan = { mon: 'routine-a', tue: 'routine-b', thu: 'routine-a', sat: null };

  test('US-05 ogni giorno mostra scheda e stato: fatto, saltato, oggi, riposo', async ({ page }) => {
    const done = { ...session('done-mon', '2026-10-05'), routineId: 'routine-a', name: 'Scheda A' };
    const extra = session('free-wed', '2026-10-07');
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: plan, sessions: [done, extra] }));
    await page.goto('calendar/');

    await expect(page.getByRole('heading', { name: '8–14 ottobre' })).toBeVisible();
    await expect(page.getByText('Prossimi 7 giorni')).toBeVisible();
    await expect(dayRow(page, /^giovedì 8 ottobre, oggi: Scheda A, in programma$/)).toContainText('Da fare');
    await expect(dayRow(page, /^venerdì 9 ottobre: Niente in programma$/)).toBeVisible();
    await expect(dayRow(page, /^sabato 10 ottobre: Riposo$/)).toBeVisible();
    await expect(dayRow(page, /^martedì 13 ottobre: Scheda B, in programma$/)).toBeVisible();

    // la finestra prima: fatto, saltato, allenamento libero
    await page.getByRole('button', { name: 'Settimana precedente' }).click();
    await expect(page.getByRole('heading', { name: '1–7 ottobre' })).toBeVisible();
    await expect(dayRow(page, /^lunedì 5 ottobre: Scheda A, fatto$/)).toBeVisible();
    await expect(dayRow(page, /^martedì 6 ottobre: Scheda B, saltato$/)).toContainText('Saltato');
    await expect(dayRow(page, /^mercoledì 7 ottobre: Allenamento libero, fatto$/)).toBeVisible();

    // un giorno passato apre le sue sessioni
    await dayRow(page, /^lunedì 5 ottobre/).click();
    await expect(sheet(page).getByRole('heading', { name: 'lunedì 5 ottobre' })).toBeVisible();
    const sessions = sheet(page).getByRole('listitem').filter({ hasText: 'Scheda A' });
    await expect(sessions).toHaveCount(1);
    await expect(sessions).toContainText(/\d\d:\d\d · 1 h 00 min · 1 serie/);
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();

    // dallo storico in poi: la finestra prima della prima sessione non si apre
    await expect(page.getByRole('button', { name: 'Settimana precedente' })).toBeDisabled();
    await page.getByRole('button', { name: 'Torna a oggi' }).click();
    await expect(page.getByRole('heading', { name: '8–14 ottobre' })).toBeVisible();
  });

  test('US-05 vista mese compatta con i segni dei giorni e la legenda', async ({ page }) => {
    const done = { ...session('done-mon', '2026-10-05'), routineId: 'routine-a', name: 'Scheda A' };
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: plan, sessions: [done] }));
    await page.goto('calendar/');
    await page.getByText('Mese', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ottobre 2026' })).toBeVisible();
    const month = page.getByRole('table');
    await expect(month.getByRole('button')).toHaveCount(31);
    await expect(month.getByRole('button', { name: /^lunedì 5 ottobre: Scheda A, fatto$/ })).toBeVisible();
    await expect(month.getByRole('button', { name: /^martedì 13 ottobre: Scheda B, in programma$/ })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Legenda' })).toContainText('Fatto');
    await month.getByRole('button', { name: /^martedì 6 ottobre/ }).click();
    await expect(sheet(page).getByText('Saltato: nessun allenamento registrato.')).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await page.getByRole('button', { name: 'Mese successivo' }).click();
    await expect(page.getByRole('heading', { name: 'novembre 2026' })).toBeVisible();
    await expect(page.getByRole('table').getByRole('button')).toHaveCount(30);
  });

  test('US-05 la striscia della settimana in Oggi porta al giorno nel calendario', async ({ page }) => {
    const done = { ...session('done-mon', '2026-10-05'), routineId: 'routine-a', name: 'Scheda A' };
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: plan, sessions: [done] }));
    await page.goto('');
    const strip = page.getByRole('navigation', { name: 'Questa settimana' });
    await expect(strip.getByRole('link')).toHaveCount(7);
    await expect(strip.getByRole('link', { name: /^martedì 6 ottobre: Scheda B, saltato$/ })).toBeVisible();
    await strip.getByRole('link', { name: /^lunedì 5 ottobre/ }).click();
    await expectPage(page, 'calendar/');
    await expect(sheet(page).getByRole('heading', { name: 'lunedì 5 ottobre' })).toBeVisible();
  });
});

test.describe('US-05 la finestra parte da oggi', () => {
  test('US-05 il calendario si apre su oggi e i 6 giorni dopo', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('calendar/');
    await expect(page.getByRole('heading', { name: '8–14 ottobre' })).toBeVisible();
    await expect(page.locator('ul.days > li')).toHaveCount(7);
    await expect(page.locator('ul.days > li').first()).toContainText('oggi');
    await expect(page.getByRole('button', { name: 'Torna a oggi' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Settimana successiva' }).click();
    await expect(page.getByRole('heading', { name: '15–21 ottobre' })).toBeVisible();
    await expect(page.getByText('Prossimi 7 giorni')).toHaveCount(0);

    // ?date= dentro la finestra di partenza non la sposta, fuori la fa cominciare da quella data
    await page.goto('calendar/?date=2026-10-12');
    await expect(page.getByRole('heading', { name: '8–14 ottobre' })).toBeVisible();
    await expect(sheet(page).getByRole('heading', { name: 'lunedì 12 ottobre' })).toBeVisible();
    await page.goto('calendar/?date=2026-10-20');
    await expect(page.getByRole('heading', { name: '20–26 ottobre' })).toBeVisible();
    await expect(sheet(page).getByRole('heading', { name: 'martedì 20 ottobre' })).toBeVisible();
  });

  test('US-05 il suggerimento sparisce dopo il primo foglio aperto', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('calendar/');
    const hint = page.getByText('Tocca un giorno per pianificarlo, iniziare l’allenamento o registrarne uno fatto.');
    await expect(hint).toBeVisible();
    await dayRow(page, /^venerdì 9 ottobre/).click();
    await expect(hint).toHaveCount(0);
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: '8–14 ottobre' })).toBeVisible();
    await expect(hint).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker.calendarHint'))).toBe('seen');
  });
});

test.describe('US-04 senza schede', () => {
  test('US-04 senza schede il calendario propone Crea scheda', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('calendar/');
    await expect(page.getByText('Per pianificare serve una scheda.')).toBeVisible();
    await expect(page.getByText('Nessun giorno ha ancora una scheda.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Crea scheda' }).click();
    await expectPage(page, 'routine/');
    expect((await storedArchive(page))?.routines).toHaveLength(1);
    await expect(page.getByRole('link', { name: 'Tutte le schede' })).toBeVisible();
  });
});

test.describe('US-06 eccezione per una sola data', () => {
  test('US-06 un’altra scheda o il riposo per una data, senza toccare la settimana tipo', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: { thu: 'routine-a', fri: 'routine-b' } }));
    await page.goto('calendar/');

    // venerdì: Scheda A al posto di B, solo per questa data
    await dayRow(page, /^venerdì 9 ottobre/).click();
    await expect(sheet(page).getByRole('radio', { name: /^Come la settimana tipo/ })).toBeChecked();
    await sheet(page).getByRole('radio', { name: 'Scheda A, solo per questa data' }).check();
    await expect.poll(async () => (await storedArchive(page))?.overrides).toEqual({ '2026-10-09': 'routine-a' });
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await expect(dayRow(page, /^venerdì 9 ottobre: Scheda A, in programma, solo per questa data$/)).toContainText('solo per questa data');
    // la settimana dopo resta B
    await page.getByRole('button', { name: 'Settimana successiva' }).click();
    await expect(dayRow(page, /^venerdì 16 ottobre: Scheda B, in programma$/)).toBeVisible();
    await page.getByRole('button', { name: 'Torna a oggi' }).click();

    // oggi diventa riposo: Oggi lo dice e propone "Allenati comunque"
    await dayRow(page, /^giovedì 8 ottobre/).click();
    await sheet(page).getByRole('radio', { name: 'Riposo, solo per questa data' }).check();
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Oggi' }).click();
    await expect(page.getByText('Oggi riposo, solo per oggi')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Allenati comunque' })).toBeVisible();

    // tornare alla settimana tipo toglie l'eccezione
    await page.goto('calendar/?date=2026-10-08');
    await sheet(page).getByRole('radio', { name: /^Come la settimana tipo/ }).check();
    await expect.poll(async () => (await storedArchive(page))?.overrides).toEqual({ '2026-10-09': 'routine-a' });
    expect((await storedArchive(page))?.schedule).toEqual({ thu: 'routine-a', fri: 'routine-b' });
  });

  test('US-06 dal foglio del giorno crea una scheda nuova e la assegna a quella data', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('calendar/');
    await dayRow(page, /^venerdì 9 ottobre/).click();
    await sheet(page).getByRole('button', { name: '+ Nuova scheda' }).click();
    await expectPage(page, 'routine/');
    await expect(page).toHaveURL(/date=2026-10-09/);
    const archive = (await storedArchive(page))!;
    const created = archive.routines[2];
    expect(created.name).toBe('Scheda C');
    expect(archive.overrides).toEqual({ '2026-10-09': created.id });

    await page.getByRole('link', { name: 'Torna al calendario' }).click();
    await expectPage(page, 'calendar/');
    await expect(sheet(page).getByRole('heading', { name: 'venerdì 9 ottobre' })).toBeVisible();
    await expect(sheet(page).getByRole('radio', { name: 'Scheda C, solo per questa data' })).toBeChecked();
  });

  test('US-06 dal foglio del giorno si arriva alla settimana tipo', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('calendar/?date=2026-10-13');
    await expect(sheet(page).getByRole('heading', { name: 'martedì 13 ottobre' })).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Cambia la settimana tipo' }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByLabel('martedì', { exact: true })).toBeFocused();
  });
});

test.describe('US-11 e US-20 avviare e registrare dal calendario', () => {
  /** Schede senza recupero: il timer a tutto schermo coprirebbe i pulsanti */
  const routines = () => starterRoutines().map((r) => ({ ...r, exercises: r.exercises.map((e) => ({ ...e, rest: 0, warmupRest: 0 })) }));

  test('US-11 dal foglio di oggi inizia l’allenamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: routines(), schedule: { thu: 'routine-b' } }));
    await page.goto('calendar/');
    await dayRow(page, /^giovedì 8 ottobre/).click();
    await sheet(page).getByRole('button', { name: 'Inizia «Scheda B»' }).click();
    await expectPage(page, 'workout/');
    const started = (await storedArchive(page))!.sessions;
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ routineId: 'routine-b', date: '2026-10-08', end: null });

    // con un allenamento in corso il foglio propone di riprenderlo, in qualsiasi giorno
    await page.goto('calendar/?date=2026-10-09');
    await expect(sheet(page).getByRole('link', { name: 'Riprendi l’allenamento in corso' })).toBeVisible();
    await expect(sheet(page).getByRole('button', { name: /^Inizia/ })).toHaveCount(0);
  });

  test('US-11 senza niente in programma oggi il foglio avvia un allenamento libero', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: routines() }));
    await page.goto('calendar/?date=2026-10-08');
    await sheet(page).getByRole('button', { name: 'Inizia allenamento libero' }).click();
    await expectPage(page, 'workout/');
    expect((await storedArchive(page))!.sessions[0]).toMatchObject({ routineId: null, date: '2026-10-08', end: null });
  });

  test('US-20 dal foglio di un giorno passato registra un allenamento fatto', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: routines(), schedule: { tue: 'routine-b' } }));
    await page.goto('calendar/?date=2026-10-06');
    await sheet(page).getByRole('button', { name: 'Registra un allenamento fatto' }).click();
    await expectPage(page, 'workout/');
    const started = (await storedArchive(page))!.sessions[0];
    expect(started).toMatchObject({ routineId: 'routine-b', date: '2026-10-06', end: null });

    await page.getByRole('textbox', { name: 'Peso serie 1, kg' }).first().fill('50');
    await page.getByRole('button', { name: 'Segna serie 1 come fatta' }).first().click();
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();

    await page.goto('calendar/?date=2026-10-06');
    await expect(sheet(page).getByRole('heading', { name: 'martedì 6 ottobre' })).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();
    await expect(dayRow(page, /^martedì 6 ottobre: Scheda B, fatto$/)).toBeVisible();
  });
});
