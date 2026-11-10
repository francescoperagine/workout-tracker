import { expect, test } from '@playwright/test';
import type { Session } from '../../src/lib/archive';
import { archiveWith, seedArchive } from './helpers';

// US-46 (muscle-volume, incremento 6): il tocco su una barra di «Serie per muscolo» apre la linea settimanale del
// gruppo. "Oggi" è mercoledì 14 ottobre 2026 (settimana dal 12).

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T18:30:00+02:00'));
});

/** Sessione conclusa con n serie spuntate di squat */
function squat(id: string, date: string, n: number): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  const sets = Array.from({ length: n }, (_, j) => ({ id: `${id}-s${j}`, type: 'normal' as const, kg: 60, reps: 8, completedAt: start + 60_000 }));
  return {
    id,
    date,
    routineId: null,
    name: 'Allenamento libero',
    start,
    end: start + 3_600_000,
    exercises: [{ id: `${id}-e`, exerciseId: 'squat-bilanciere', alternativeOf: null, group: null, rest: 120, warmupRest: 60, notes: '', sets }],
  };
}

test('US-46 il tocco su una barra apre il foglio con le serie per settimana del gruppo', async ({ page }) => {
  await seedArchive(page, archiveWith({ sessions: [squat('a', '2026-09-29', 3), squat('b', '2026-10-13', 4)] }));
  await page.goto('progress/');

  // 4 settimane: media su 28 settembre (3) e 5 ottobre (0) = 1,5
  await page.getByRole('button', { name: "Quadricipiti: 1,5 serie, apri l'andamento" }).click();
  const sheet = page.getByRole('dialog', { name: 'Quadricipiti: serie per settimana' });
  await expect(sheet).toBeVisible();
  // tre settimane dalla prima con dati: 3, 0 nella settimana vuota, 4 in quella in corso (parziale)
  await expect(sheet.getByRole('group', { name: /^Quadricipiti: serie per settimana: 3 valori, dal 28 settembre \(3 serie\) al 12 ottobre \(4 serie\)/ })).toBeVisible();
  await expect(sheet.getByText('Settimana in corso, parziale')).toBeVisible();
  await sheet.getByRole('group').press('ArrowLeft');
  await expect(sheet.getByText('0 serie', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Settimana 5–11 ottobre')).toBeVisible();
});
