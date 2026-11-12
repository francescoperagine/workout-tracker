import { expect, test, type Page } from '@playwright/test';
import type { Session } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive } from './helpers';

// US-45 (muscle-volume, incremento 5): serie per gruppo muscolare in cima a Progressi, nella settimana in corso
// o in media sulle ultime 4 o 12 settimane concluse. "Oggi" è mercoledì 14 ottobre 2026 (settimana dal 12).

const NOW = new Date('2026-10-14T18:30:00+02:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

/** Sessione conclusa con le voci indicate: [exerciseId, serie spuntate] */
function workout(id: string, date: string, entries: [string, number][]): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  return {
    id,
    date,
    routineId: null,
    name: 'Allenamento libero',
    start,
    end: start + 3_600_000,
    exercises: entries.map(([exerciseId, n], i) => ({
      id: `${id}-e${i}`,
      exerciseId,
      alternativeOf: null,
      group: null,
      rest: 120,
      warmupRest: 60,
      notes: '',
      sets: Array.from({ length: n }, (_, j) => ({ id: `${id}-e${i}-s${j}`, type: 'normal' as const, kg: 50, reps: 8, completedAt: start + 60_000 })),
    })),
  };
}

const crunch = { 'custom-crunch': { id: 'custom-crunch', name: 'Crunch', muscles: {}, variantOf: null } };
const section = (page: Page) => page.getByRole('region', { name: 'Serie per muscolo' });
const bars = (page: Page) => section(page).locator('ol > li');

test.describe('US-45 serie per muscolo', () => {
  test('US-45 solo i gruppi con serie, in ordine decrescente; il periodo cambia valori e riga di lettura', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        catalog: crunch,
        sessions: [
          workout('a', '2026-09-29', [['squat-manubri', 3]]),
          workout('b', '2026-10-06', [['squat-manubri', 3], ['panca-piana-manubri', 2]]),
          workout('c', '2026-10-13', [['squat-manubri', 4], ['custom-crunch', 2]]),
        ],
      }),
    );
    await page.goto('progress/');

    // 4 settimane (predefinito): media sulle 2 settimane concluse dal primo allenamento; 0,5 dai valori della panca
    await expect(page.getByRole('radio', { name: '4 settimane' })).toBeChecked();
    await expect(bars(page)).toHaveText([
      /Glutei\s*3 serie/,
      /Quadricipiti\s*3 serie/,
      /Petto\s*1 serie/,
      /Deltoidi anteriori\s*0,5 serie/,
      /Tricipiti\s*0,5 serie/,
    ]);
    await expect(section(page)).toContainText('Media per settimana, ultime 2 settimane concluse.');
    await expect(section(page)).toContainText('Nessuna serie:');
    // ogni gruppo a zero è un pulsante che apre il suo foglio (US-52)
    await expect(section(page).getByRole('button', { name: /: nessuna serie, vedi gli esercizi$/ })).toHaveText(
      "Dorsali, Trapezio, Deltoidi laterali, Deltoidi posteriori, Bicipiti, Brachiale, Avambracci, Addominali, Lombari, Flessori dell'anca, Femorali, Popliteo, Adduttori, Polpacci".split(', '),
    );
    await expect(section(page)).not.toContainText('Senza muscoli');

    // settimana in corso: totali, fino a oggi
    await page.getByRole('radio', { name: 'Settimana', exact: true }).check();
    await expect(bars(page)).toHaveText([/Glutei\s*4 serie/, /Quadricipiti\s*4 serie/]);
    await expect(section(page)).toContainText('Settimana in corso, fino a oggi.');
  });

  test('US-45 un personalizzato senza muscoli finisce in «Senza muscoli» con il link alla sua pagina', async ({ page }) => {
    await seedArchive(
      page,
      archiveWith({
        catalog: crunch,
        sessions: [workout('a', '2026-10-06', [['custom-crunch', 3]]), workout('b', '2026-10-07', [['squat-manubri', 1]])],
      }),
    );
    await page.goto('progress/');

    await expect(section(page)).toContainText('Senza muscoli: 3 serie');
    await section(page).getByRole('link', { name: 'Crunch' }).click();
    await expectPage(page, 'exercise/');
    await expect(page).toHaveURL(/id=custom-crunch&tab=info$/);
    await expect(page.getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'Crunch' })).toBeVisible();
  });

  test('US-45 con i soli allenamenti di questa settimana, «4 settimane» chiede una settimana conclusa', async ({ page }) => {
    await seedArchive(page, archiveWith({ sessions: [workout('a', '2026-10-13', [['squat-manubri', 2]])] }));
    await page.goto('progress/');

    await expect(section(page)).toContainText('Serve almeno una settimana conclusa: intanto guarda la settimana in corso.');
    await expect(bars(page)).toHaveCount(0);
    await page.getByRole('radio', { name: 'Settimana', exact: true }).check();
    await expect(bars(page)).toHaveText([/Glutei\s*2 serie/, /Quadricipiti\s*2 serie/]);
  });
});
