import { expect, test, type Page } from '@playwright/test';
import type { Session } from '../../src/lib/archive';
import { archiveWith, seedArchive } from './helpers';

// US-49 e US-50 (delavier-catalog, incremento 5): sotto il grafico di un gruppo gli esercizi che gli hanno dato
// serie, filtrati sulla settimana toccata; nella pagina dell'esercizio il punto toccato evidenzia la riga della
// cronologia. "Oggi" è mercoledì 14 ottobre 2026 (settimana dal 12).

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T18:30:00+02:00'));
});

/** Sessione conclusa con n serie spuntate di un esercizio */
function workout(id: string, date: string, exerciseId: string, n: number, kg = 60): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  const sets = Array.from({ length: n }, (_, j) => ({ id: `${id}-s${j}`, type: 'normal' as const, kg, reps: 8, completedAt: start + 60_000 }));
  return { id, date, routineId: null, name: 'Allenamento libero', start, end: start + 3_600_000, exercises: [{ id: `${id}-e`, exerciseId, alternativeOf: null, group: null, rest: 120, warmupRest: 60, notes: '', sets }] };
}

const plot = (scope: ReturnType<Page['getByRole']>) => scope.getByRole('group', { name: /Usa le frecce/ });

/** tocco sul primo o sull'ultimo punto della trama */
async function tapPoint(page: Page, scope: ReturnType<Page['getByRole']>, which: 'first' | 'last') {
  const box = (await plot(scope).locator('svg').boundingBox())!;
  await page.mouse.click(which === 'first' ? box.x + 49 : box.x + box.width - 13, box.y + box.height / 2);
}

test('US-49 il tocco su un punto filtra gli esercizi del gruppo sulla settimana; un secondo tocco o «Tutte le settimane» toglie il filtro', async ({ page }) => {
  await seedArchive(page, archiveWith({ sessions: [workout('a', '2026-09-29', 'squat-bilanciere', 3), workout('b', '2026-10-13', 'leg-extension', 4)] }));
  await page.goto('progress/');
  await page.getByRole('button', { name: "Quadricipiti: 1,5 serie, apri l'andamento" }).click();
  const sheet = page.getByRole('dialog', { name: 'Quadricipiti: serie per settimana' });
  const rows = sheet.getByRole('region', { name: /^Esercizi/ }).getByRole('listitem');

  // tutte le settimane del grafico, con le serie contate e quanto conta una serie
  await expect(sheet.getByRole('heading', { name: 'Esercizi, tutte le settimane' })).toBeVisible();
  await expect(rows).toHaveText([/^Leg extension.*4 serie · ogni serie conta 1/, /^Squat bilanciere.*3 serie · ogni serie conta 1/]);
  await expect(sheet.getByRole('button', { name: 'Tutte le settimane' })).toHaveCount(0);

  // tocco sull'ultimo punto (settimana in corso): solo la leg extension; di nuovo sullo stesso punto: tutte
  await tapPoint(page, sheet, 'last');
  await expect(rows).toHaveText([/^Leg extension/]);
  await expect(sheet.getByRole('button', { name: 'Tutte le settimane' })).toBeVisible();
  await tapPoint(page, sheet, 'last');
  await expect(rows).toHaveCount(2);

  // con le frecce sulla settimana del 28 settembre, poi il comando visibile
  await plot(sheet).press('ArrowLeft');
  await expect(sheet.getByText('Nessun esercizio in questa settimana.')).toBeVisible();
  await plot(sheet).press('ArrowLeft');
  await expect(rows).toHaveText([/^Squat bilanciere/]);
  await sheet.getByRole('button', { name: 'Tutte le settimane' }).click();
  await expect(rows).toHaveCount(2);
});

test('US-50 il tocco su un punto evidenzia la riga dell’allenamento nella cronologia, senza focus sulla riga né scorrimento', async ({ page }) => {
  await seedArchive(
    page,
    archiveWith({
      sessions: [workout('a', '2026-09-01', 'squat-bilanciere', 3, 50), workout('b', '2026-09-15', 'squat-bilanciere', 3, 55), workout('c', '2026-10-01', 'squat-bilanciere', 3, 60)],
    }),
  );
  await page.goto('exercise/?id=squat-bilanciere');
  const chart = page.getByRole('tabpanel', { name: 'Progressi' });
  const history = page.getByRole('region', { name: 'Cronologia delle serie' }).getByRole('listitem');
  await expect(history).toHaveCount(3);
  await expect(history.and(page.locator('[aria-current="true"]'))).toHaveCount(0);

  await plot(chart).scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  await tapPoint(page, chart, 'first');
  // la cronologia è dal più recente: il primo punto (1 settembre) è l'ultima riga
  await expect(history.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(history.nth(0)).not.toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  expect(await history.nth(2).evaluate((li) => li.contains(document.activeElement))).toBe(false);
});
