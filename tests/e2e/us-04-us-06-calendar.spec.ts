import { expect, test, type Page } from '@playwright/test';
import { starterRoutines } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// Calendario (step 5): US-04 settimana tipo, US-05 settimana e mese con lo stato dei giorni,
// US-06 eccezione per una sola data. "Oggi" è fissato con page.clock: giovedì 8 ottobre 2026.

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
    await expect(page.getByRole('heading', { name: '12–18 ottobre' })).toBeVisible();
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
    await expect(dayRow(page, /^lunedì 5 ottobre: Niente in programma/)).toBeVisible();
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

    await expect(page.getByRole('heading', { name: '5–11 ottobre' })).toBeVisible();
    await expect(page.getByText('Questa settimana')).toBeVisible();
    await expect(dayRow(page, /^lunedì 5 ottobre: Scheda A, fatto$/)).toBeVisible();
    await expect(dayRow(page, /^martedì 6 ottobre: Scheda B, saltato$/)).toContainText('Saltato');
    await expect(dayRow(page, /^mercoledì 7 ottobre: Allenamento libero, fatto$/)).toBeVisible();
    await expect(dayRow(page, /^giovedì 8 ottobre, oggi: Scheda A, in programma$/)).toContainText('Da fare');
    await expect(dayRow(page, /^venerdì 9 ottobre: Niente in programma$/)).toBeVisible();
    await expect(dayRow(page, /^sabato 10 ottobre: Riposo$/)).toBeVisible();

    // un giorno passato apre le sue sessioni
    await dayRow(page, /^lunedì 5 ottobre/).click();
    await expect(sheet(page).getByRole('heading', { name: 'lunedì 5 ottobre' })).toBeVisible();
    const sessions = sheet(page).getByRole('listitem');
    await expect(sessions).toHaveCount(1);
    await expect(sessions).toContainText('Scheda A');
    await expect(sessions).toContainText(/\d\d:\d\d · 1 h 00 min · 1 serie/);
    await sheet(page).getByRole('button', { name: 'Chiudi' }).click();

    // dallo storico in poi: la settimana prima della prima sessione non si apre
    await expect(page.getByRole('button', { name: 'Settimana precedente' })).toBeDisabled();
    await page.getByRole('button', { name: 'Settimana successiva' }).click();
    await expect(page.getByText('Settimana prossima')).toBeVisible();
    await page.getByRole('button', { name: 'Torna a questa settimana' }).click();
    await expect(page.getByRole('heading', { name: '5–11 ottobre' })).toBeVisible();
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
    await page.getByRole('button', { name: 'Torna a questa settimana' }).click();

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

  test('US-06 dal foglio del giorno si arriva alla settimana tipo', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('calendar/?date=2026-10-13');
    await expect(sheet(page).getByRole('heading', { name: 'martedì 13 ottobre' })).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Cambia la settimana tipo' }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByLabel('martedì', { exact: true })).toBeFocused();
  });
});
