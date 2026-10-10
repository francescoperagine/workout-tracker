import { expect, test, type Locator, type Page } from '@playwright/test';
import { BASE_CATALOG } from '../../src/data/catalog';
import { DEFAULT_SETTINGS, startSession, starterRoutines, type Archive, type Session } from '../../src/lib/archive';
import { REST_TIMER_KEY } from '../../src/lib/rest-timer';
import { archiveWith, expectPage, seedArchive, sheet } from './helpers';

// Timer di recupero (step 7): US-21 recupero alla spunta, US-22 −15 s / +15 s / Salta e spunta tolta,
// US-23 timer ridotto, US-24 avvisi di fine (suono, vibrazione, schermo acceso), US-25 superserie,
// US-26 tempo giusto dopo ricarica e schermo bloccato. L'orologio è quello finto di Playwright
// (page.clock.install): il tempo scorre solo con runFor e fastForward.
// "Oggi" è giovedì 8 ottobre 2026 alle 18:30 (il browser dei test è in Europe/Rome).

const NOW = new Date('2026-10-08T18:30:00+02:00');
const [A] = starterRoutines();
const SQUAT = A.exercises[0];
const BENCH = A.exercises[1];
const ROW = A.exercises[2];
const name = (id: string) => BASE_CATALOG[id].name;

test.beforeEach(async ({ page }) => {
  // il tempo resta fermo finché il test non lo fa scorrere
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(NOW);
  // Audio, vibrazione e wake lock finti: si contano le chiamate
  await page.addInitScript(() => {
    const log = { tones: 0, vibrations: 0, wakeLocks: 0, released: 0 };
    (window as unknown as { __rest: typeof log }).__rest = log;
    class FakeAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume() {
        return Promise.resolve();
      }
      createOscillator() {
        log.tones++;
        return { type: '', frequency: { value: 0 }, connect: (node: unknown) => node, start() {}, stop() {} };
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (node: unknown) => node };
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true });
    Object.defineProperty(Navigator.prototype, 'vibrate', {
      value: () => {
        log.vibrations++;
        return true;
      },
      configurable: true,
    });
    Object.defineProperty(Navigator.prototype, 'wakeLock', {
      get: () => ({
        request: async () => {
          log.wakeLocks++;
          return {
            released: false,
            addEventListener() {},
            release: async () => {
              log.released++;
            },
          };
        },
      }),
      configurable: true,
    });
  });
});

const alerts = (page: Page) => page.evaluate(() => (window as unknown as { __rest: { tones: number; vibrations: number; wakeLocks: number; released: number } }).__rest);

/** Sessione conclusa di Scheda A, con tutte le serie fatte a `kg` × `reps` */
function pastSession(date: string, kg = 40, reps = 8): Session {
  const { session } = startSession(archiveWith({ routines: starterRoutines() }), 'routine-a', new Date(`${date}T18:00:00+02:00`).getTime());
  session.end = session.start + 3_600_000;
  for (const e of session.exercises) for (const s of e.sets) Object.assign(s, { kg, reps, completedAt: session.start + 60_000 });
  return session;
}

function region(page: Page, exerciseId: string): Locator {
  return page.getByRole('region', { name: name(exerciseId), exact: true });
}

function timer(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Recupero' });
}

function reducedBar(page: Page): Locator {
  return page.getByRole('button', { name: /^Recupero[ :].*Tocca per aprire$/ });
}

const storedTimer = (page: Page) => page.evaluate((key) => localStorage.getItem(key), REST_TIMER_KEY);

async function startFromToday(page: Page, archive: Archive) {
  await seedArchive(page, archive);
  await page.goto('');
  await page.getByRole('button', { name: 'Inizia allenamento' }).click();
  await expectPage(page, 'workout/');
}

const withHistory = () => archiveWith({ routines: starterRoutines(), sessions: [pastSession('2026-10-06')] });

test.describe('US-21 recupero alla spunta', () => {
  test('US-21 la spunta apre il recupero a tutto schermo con la prossima serie, e il tempo scende', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const overlay = timer(page);
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('Recupero · 2:00');
    await expect(overlay.locator('.timer-digits')).toHaveText('Mancano 2:00');
    await expect(overlay).toContainText('Prossima Squat bilanciere · serie 2 · 40 kg × 8');
    const level = overlay.locator('.level');
    const full = (await level.boundingBox())!.height;

    await page.clock.runFor(30_000);
    await expect(overlay.locator('.timer-digits')).toHaveText('Mancano 1:30');
    // il livello scende con il tempo: tre quarti di quello pieno
    expect((await level.boundingBox())!.height).toBeCloseTo(full * 0.75, 0);
    // l'istante di fine è salvato nella sua chiave
    expect(JSON.parse((await storedTimer(page))!)).toMatchObject({ end: NOW.getTime() + 120_000, duration: 120, minimized: false });
  });

  test('US-21 una serie di riscaldamento usa il recupero di riscaldamento', async ({ page }) => {
    await startFromToday(page, withHistory());
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('button', { name: 'Serie 1: tipo e opzioni' }).click();
    await sheet(page).getByRole('button', { name: 'Riscaldamento' }).click();
    await squat.getByRole('textbox', { name: 'Ripetizioni riscaldamento' }).fill('10');
    await squat.getByRole('button', { name: 'Segna riscaldamento come fatta' }).click();
    await expect(timer(page)).toContainText(`Recupero di riscaldamento · ${SQUAT.warmupRest / 60}:00`);
  });

  test('US-21 recupero 0 = nessun timer', async ({ page }) => {
    const routines = starterRoutines().map((r) => ({ ...r, exercises: r.exercises.map((e) => ({ ...e, rest: 0 })) }));
    await startFromToday(page, archiveWith({ routines, sessions: [pastSession('2026-10-06')] }));
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(region(page, SQUAT.exerciseId).getByRole('button', { name: 'Annulla serie 1' })).toBeVisible();
    await expect(timer(page)).toHaveCount(0);
    await expect(reducedBar(page)).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();
  });

  test('US-21 un esercizio senza recupero nella scheda usa il recupero predefinito delle Impostazioni', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines(), settings: { ...DEFAULT_SETTINGS, defaultRest: 75 } }));
    await page.goto('');
    await page.getByRole('button', { name: 'Allenamento libero' }).click();
    await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
    await sheet(page).getByRole('searchbox').fill('leg press');
    await sheet(page).getByRole('button', { name: 'Leg press', exact: true }).click();
    const legPress = page.getByRole('region', { name: 'Leg press', exact: true });
    await legPress.getByRole('textbox', { name: 'Ripetizioni serie 1' }).fill('12');
    await legPress.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(timer(page)).toContainText('Recupero · 1:15');
    await expect(timer(page)).toContainText('Prossima Leg press · serie 2');
  });
});

test.describe('US-22 allungare, accorciare, saltare', () => {
  test('US-22 +15 s, −15 s e Salta', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const overlay = timer(page);
    await overlay.getByRole('button', { name: 'Aggiungi 15 secondi' }).click();
    await expect(overlay.locator('.timer-digits')).toHaveText('Mancano 2:15');
    await expect(overlay).toContainText('Recupero · 2:15');
    await overlay.getByRole('button', { name: 'Togli 15 secondi' }).click();
    await overlay.getByRole('button', { name: 'Togli 15 secondi' }).click();
    await expect(overlay.locator('.timer-digits')).toHaveText('Mancano 1:45');
    await overlay.getByRole('button', { name: 'Salta il recupero' }).click();
    await expect(overlay).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();
    // il focus torna alla spunta della serie
    await expect(region(page, SQUAT.exerciseId).getByRole('button', { name: 'Annulla serie 1' })).toBeFocused();
  });

  test('US-22 togliere la spunta annulla il timer; concludere anche', async ({ page }) => {
    await startFromToday(page, withHistory());
    const squat = region(page, SQUAT.exerciseId);
    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();
    await expect(reducedBar(page)).toBeVisible();
    await squat.getByRole('button', { name: 'Annulla serie 1' }).click();
    await expect(reducedBar(page)).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();

    await squat.getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await expect(reducedBar(page)).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();
  });
});

test.describe('US-23 timer ridotto', () => {
  test('US-23 "Riduci" lo porta in una barra sopra la barra dell’allenamento; un tocco lo riapre; Esc lo riduce', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci il timer' }).click();
    const bar = reducedBar(page);
    await expect(bar).toBeVisible();
    await expect(timer(page)).toHaveCount(0);
    // si continua a usare l'allenamento: correggere una serie
    await region(page, SQUAT.exerciseId).getByRole('textbox', { name: 'Peso serie 1, kg' }).fill('42,5');
    await page.clock.runFor(5_000);
    await expect(bar).toContainText('1:55');
    const box = (await bar.boundingBox())!;
    const finish = (await page.getByRole('button', { name: 'Termina' }).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(finish.y);

    await bar.click();
    await expect(timer(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(timer(page)).toHaveCount(0);
    await expect(bar).toBeVisible();
    expect(JSON.parse((await storedTimer(page))!).minimized).toBe(true);
  });

  test('US-23 sulle altre pagine il timer ridotto sta nella mini-barra; su Oggi solo con un recupero', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();
    const tabs = page.getByRole('navigation', { name: 'Sezioni' });
    await tabs.getByRole('link', { name: 'Calendario' }).click();
    await expectPage(page, 'calendar/');
    const bar = reducedBar(page);
    await expect(bar).toBeVisible();
    const back = page.getByRole('link', { name: 'Torna all’allenamento: Scheda A' });
    await expect(back).toBeVisible();
    // un tocco riapre lo schermo intero anche qui
    await bar.click();
    await expect(timer(page)).toBeVisible();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();

    // su Oggi la mini-barra compare solo con il recupero in corso
    await tabs.getByRole('link', { name: 'Oggi' }).click();
    await expectPage(page, '');
    await expect(bar).toBeVisible();
    await bar.click();
    await timer(page).getByRole('button', { name: 'Salta il recupero' }).click();
    await expect(bar).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Allenamento in corso/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Riprendi allenamento' })).toBeVisible();

    await tabs.getByRole('link', { name: 'Schede' }).click();
    await expect(page.getByRole('link', { name: /^Allenamento in corso/ })).toBeVisible();
  });

  test('US-23 dalla mini-barra la freccia riporta all’allenamento, con il recupero ancora in corso', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();
    await page.getByRole('navigation', { name: 'Sezioni' }).getByRole('link', { name: 'Schede' }).click();
    await page.clock.runFor(20_000);
    await page.getByRole('link', { name: 'Torna all’allenamento: Scheda A' }).click();
    await expectPage(page, 'workout/');
    await expect(reducedBar(page)).toContainText('1:40');
  });
});

test.describe('US-24 fine del recupero', () => {
  test('US-24 annunci a 30 s e 10 s, poi "Vai" con suono e vibrazione; si chiude da solo', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const overlay = timer(page);
    const status = overlay.getByRole('status');
    await page.clock.runFor(90_000);
    await expect(status).toHaveText('Mancano 30 secondi di recupero');
    await page.clock.runFor(20_000);
    await expect(status).toHaveText('Mancano 10 secondi di recupero');
    await expect(overlay.locator('.screen')).toHaveClass(/final/);
    expect((await alerts(page)).tones).toBe(0);

    await page.clock.runFor(10_000);
    await expect(overlay.locator('.timer-digits')).toHaveText('Vai');
    await expect(overlay).toContainText('Adesso Squat bilanciere · serie 2 · 40 kg × 8');
    await expect(overlay.locator('.screen')).toHaveClass(/go/);
    await expect(status).toHaveText('Recupero finito. Adesso: Squat bilanciere · serie 2 · 40 kg × 8');
    expect(await alerts(page)).toMatchObject({ tones: 3, vibrations: 1 });

    await page.clock.runFor(6_500);
    await expect(overlay).toHaveCount(0);
    expect(await storedTimer(page)).toBeNull();
    // una volta sola
    expect(await alerts(page)).toMatchObject({ tones: 3, vibrations: 1 });
  });

  test('US-24 suono e vibrazione spenti nelle Impostazioni: nessun avviso, solo lo schermo', async ({ page }) => {
    await startFromToday(
      page,
      archiveWith({ routines: starterRoutines(), sessions: [pastSession('2026-10-06')], settings: { ...DEFAULT_SETTINGS, sound: false, vibration: false } }),
    );
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await page.clock.runFor(120_500);
    await expect(timer(page).locator('.timer-digits')).toHaveText('Vai');
    expect(await alerts(page)).toMatchObject({ tones: 0, vibrations: 0 });
  });

  test('US-24 schermo acceso durante l’allenamento, rilasciato alla fine', async ({ page }) => {
    await startFromToday(page, withHistory());
    await expect.poll(async () => (await alerts(page)).wakeLocks).toBe(1);
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Salta il recupero' }).click();
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByRole('heading', { name: 'Allenamento concluso' })).toBeVisible();
    await expect.poll(async () => (await alerts(page)).released).toBe(1);
  });
});

test.describe('US-25 superserie', () => {
  test('US-25 il recupero parte solo a fine giro: dopo 2a nessun timer, dopo 2b sì', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, BENCH.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(region(page, BENCH.exerciseId).getByRole('button', { name: 'Annulla serie 1' })).toBeVisible();
    await expect(timer(page)).toHaveCount(0);
    await expect(region(page, ROW.exerciseId)).toContainText('Adesso');

    await region(page, ROW.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await expect(timer(page)).toContainText(`Recupero · ${Math.floor(ROW.rest / 60)}:${String(ROW.rest % 60).padStart(2, '0')}`);
    // e il giro ricomincia da 2a
    await expect(timer(page)).toContainText(`Prossima ${name(BENCH.exerciseId)} · serie 2`);
  });
});

test.describe('US-26 interruzioni', () => {
  test('US-26 dopo una ricarica il tempo è quello giusto', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await page.clock.runFor(20_000);
    await page.reload();
    await expect(timer(page).locator('.timer-digits')).toHaveText('Mancano 1:40');
    await page.clock.runFor(10_000);
    await expect(timer(page).locator('.timer-digits')).toHaveText('Mancano 1:30');
  });

  test('US-26 al rientro dallo schermo bloccato il recupero è già finito, e lo dice', async ({ page }) => {
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    await timer(page).getByRole('button', { name: 'Riduci', exact: true }).click();
    // nessuno scatto per 3 minuti e 20 secondi: il telefono era bloccato
    await page.clock.fastForward('03:20');
    await expect(reducedBar(page)).toContainText('Vai');
    await reducedBar(page).click();
    await expect(timer(page)).toContainText('Recupero finito da 1:20');
    // finito da più di un minuto: niente suono fuori tempo
    expect(await alerts(page)).toMatchObject({ tones: 0, vibrations: 0 });
  });
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
]) {
  test(`P2 P3 a ${width}×${height} il timer entra nello schermo: cifre grandi, lastre da 64px nella metà bassa`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await startFromToday(page, withHistory());
    await region(page, SQUAT.exerciseId).getByRole('button', { name: 'Segna serie 1 come fatta' }).click();
    const overlay = timer(page);
    const digits = (await overlay.locator('.timer-digits').boundingBox())!;
    expect(digits.height).toBeGreaterThanOrEqual(100);
    for (const label of ['Togli 15 secondi', 'Aggiungi 15 secondi', 'Salta il recupero']) {
      const box = (await overlay.getByRole('button', { name: label }).boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(64);
      expect(box.y).toBeGreaterThan(height / 2);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
