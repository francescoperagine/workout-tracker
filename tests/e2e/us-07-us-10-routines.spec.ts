import { expect, test, type Page } from '@playwright/test';
import { BASE_CATALOG } from '../../src/data/catalog';
import { starterRoutines, type RoutineExercise } from '../../src/lib/archive';
import { toKg } from '../../src/lib/units';
import { archiveWith, expectPage, seedArchive, session, sheet, storedArchive } from './helpers';

// Schede (step 4): US-07 crea e modifica, US-08 alternative, US-09 superserie, US-10 elenco.
// Elenco in routines/, editor in routine/?id=… (sito statico: id in query string).

const nameOf = (id: string) => BASE_CATALOG[id]?.name ?? id;

/** Sceglie un esercizio nel foglio del catalogo, cercandolo per nome */
async function pickExercise(page: Page, name: string) {
  await sheet(page).getByLabel('Cerca o scrivi il nome').fill(name);
  await sheet(page).getByRole('button', { name, exact: true }).click();
  await expect(sheet(page)).toHaveCount(0);
}

async function createRoutine(page: Page) {
  await page.getByRole('button', { name: 'Crea scheda' }).click();
  await expectPage(page, 'routine/');
  await expect(page.getByLabel('Nome della scheda')).toBeVisible();
}

async function addExercise(page: Page, name: string) {
  await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
  await pickExercise(page, name);
}

/** Editor della voce aperta */
function openEntry(page: Page) {
  return page.getByRole('group', { name: /^Modifica / });
}

/** Porta un valore a passi da 15 s al valore indicato */
async function setRest(page: Page, label: string, from: number, to: number) {
  const group = openEntry(page).getByRole('group', { name: label, exact: true });
  const button = group.getByRole('button', { name: to > from ? `${label}: +15 s` : `${label}: −15 s` });
  for (let i = 0; i < Math.abs(to - from) / 15; i++) await button.click();
}

const routineByName = async (page: Page, name: string) => (await storedArchive(page))?.routines.find((r) => r.name === name);

test.describe('US-07 US-08 US-09 editor della scheda', () => {
  test('US-09 crea scheda C con superserie e la ritrovi dopo il ricaricamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routines/');
    await createRoutine(page);
    await expect(page.getByLabel('Nome della scheda')).toHaveValue('Scheda C');

    await addExercise(page, 'Squat bilanciere');
    await addExercise(page, 'Panca piana bilanciere');
    await addExercise(page, 'Rematore al cavo basso');
    // la voce appena aggiunta è aperta: la si unisce a quella sopra
    await openEntry(page).getByRole('switch', { name: 'In superserie con l’esercizio sopra' }).check();
    await expect(page.getByText('Superserie · 2 esercizi')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: /^1\. Squat bilanciere/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^2a\. Panca piana bilanciere/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^2b\. Rematore al cavo basso/ })).toBeVisible();
    const saved = await routineByName(page, 'Scheda C');
    expect(saved?.exercises.map((e) => e.exerciseId)).toEqual(['squat-bilanciere', 'panca-piana-bilanciere', 'rematore-al-cavo-basso']);
    const [single, a, b] = saved!.exercises;
    expect(single.group).toBeNull();
    expect(a.group).not.toBeNull();
    expect(b.group).toBe(a.group);

    // separare di nuovo
    await page.getByRole('button', { name: /^2b\./ }).click();
    await openEntry(page).getByRole('switch', { name: 'In superserie con l’esercizio sopra' }).uncheck();
    await expect(page.getByRole('button', { name: /^3\. Rematore al cavo basso/ })).toBeVisible();
  });

  test('US-07 le schede A/B del PoC si ricreano identiche nell’editor', async ({ page }) => {
    test.slow();
    const [source] = starterRoutines();
    await seedArchive(page, archiveWith());
    await page.goto('routines/');
    await createRoutine(page);
    await page.getByLabel('Nome della scheda').fill('Scheda A bis');

    let previous: RoutineExercise | null = null;
    for (const entry of source.exercises) {
      await addExercise(page, nameOf(entry.exerciseId));
      const editor = openEntry(page);
      await editor.getByLabel('Ripetizioni').fill(entry.reps);
      if (entry.loadMin !== null) await editor.getByLabel('Carico (kg)').fill(String(entry.loadMin).replace('.', ','));
      if (entry.loadMax !== null && entry.loadMax !== entry.loadMin) await editor.getByLabel('Fino a (kg)').fill(String(entry.loadMax));
      if (entry.unit) await editor.getByLabel('Il carico è').fill(entry.unit);
      if (entry.loadNote) await editor.getByLabel('Nota sul carico').fill(entry.loadNote);
      await setRest(page, 'Recupero', 90, entry.rest);
      for (const alternative of entry.alternatives) {
        await editor.getByRole('button', { name: 'Aggiungi alternativa' }).click();
        await pickExercise(page, nameOf(alternative));
      }
      if (previous && entry.group !== null && entry.group === previous.group) {
        await editor.getByRole('switch', { name: 'In superserie con l’esercizio sopra' }).check();
      }
      previous = entry;
    }

    await page.reload();
    const saved = await routineByName(page, 'Scheda A bis');
    const comparable = (list: RoutineExercise[]) => list.map(({ id: _id, group, ...rest }) => ({ ...rest, grouped: group !== null }));
    expect(comparable(saved!.exercises)).toEqual(comparable(source.exercises));
    // stessi raggruppamenti, anche se le stringhe dei gruppi possono essere diverse
    const pairs = (list: RoutineExercise[]) => list.map((e, i) => i > 0 && e.group !== null && e.group === list[i - 1].group);
    expect(pairs(saved!.exercises)).toEqual(pairs(source.exercises));
    await expect(page.getByRole('button', { name: /^4b\. Curl manubri su panca inclinata/ })).toContainText('3 × 10–12 · 8 kg · rec. 1:00');
  });

  test('US-07 carico nell’unità scelta: 135 lb restano 135 lb, salvati in kg', async ({ page }) => {
    const archive = archiveWith({ routines: starterRoutines() });
    archive.settings.weightUnit = 'lb';
    await seedArchive(page, archive);
    await page.goto('routine/?id=routine-a');
    await page.getByRole('button', { name: /^1\. Squat bilanciere/ }).click();
    const editor = openEntry(page);
    await editor.getByLabel('Carico (lb)').fill('135');
    await editor.getByLabel('Fino a (lb)').fill('145,5');
    await expect.poll(async () => (await storedArchive(page))?.routines[0].exercises[0].loadMax).toBeCloseTo(toKg(145.5, 'lb'), 6);
    expect((await storedArchive(page))?.routines[0].exercises[0].loadMin).toBeCloseTo(toKg(135, 'lb'), 6);

    // un valore non valido resta nel campo con l'errore e non si salva
    await editor.getByLabel('Fino a (lb)').fill('100');
    await expect(editor.getByText('Deve essere almeno uguale al carico.')).toBeVisible();
    expect((await storedArchive(page))?.routines[0].exercises[0].loadMax).toBeCloseTo(toKg(145.5, 'lb'), 6);

    await page.reload();
    await expect(page.getByRole('button', { name: /^1\. Squat bilanciere/ })).toContainText('135–145,5 lb');
    await page.getByRole('button', { name: /^1\. Squat bilanciere/ }).click();
    await expect(openEntry(page).getByLabel('Carico (lb)')).toHaveValue('135');
  });

  test('US-07 serie, ripetizioni a intervallo e recupero 0 senza timer', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=routine-b');
    await page.getByRole('button', { name: /^1\./ }).click();
    const editor = openEntry(page);
    await editor.getByRole('button', { name: 'Serie: +1' }).click();
    await editor.getByLabel('Ripetizioni').fill('10-12');
    await editor.getByLabel('Ripetizioni').blur();
    await expect(editor.getByLabel('Ripetizioni')).toHaveValue('10–12');
    const first = (await storedArchive(page))!.routines[1].exercises[0];
    await setRest(page, 'Recupero', first.rest, 0);
    await expect(editor.getByText('Nessun timer dopo le serie di questo esercizio.')).toBeVisible();
    await expect.poll(async () => (await storedArchive(page))?.routines[1].exercises[0]).toMatchObject({ sets: 4, reps: '10–12', rest: 0 });
    await expect(page.getByRole('button', { name: /^1\./ })).toContainText('4 × 10–12');
    await expect(page.getByRole('button', { name: /^1\./ })).toContainText('nessun recupero');
  });

  test('US-07 un nome scritto a mano diventa un esercizio personalizzato, riusato dopo', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=routine-a');
    await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('Croci ai cavi alti');
    await sheet(page).getByRole('button', { name: /Crea «Croci ai cavi alti»/ }).click();
    await expect(page.getByRole('button', { name: /^6\. Croci ai cavi alti/ })).toBeVisible();
    const saved = await storedArchive(page);
    expect(saved?.catalog['custom-croci-ai-cavi-alti']).toEqual({ id: 'custom-croci-ai-cavi-alti', name: 'Croci ai cavi alti' });
    expect(saved?.routines[0].exercises.at(-1)?.exerciseId).toBe('custom-croci-ai-cavi-alti');

    // la volta dopo il nome si trova nel catalogo, senza doppioni
    await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('croci ai cavi');
    await expect(sheet(page).getByRole('button', { name: /^Croci ai cavi alti/ })).toContainText('personalizzato');
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('croci ai cavi alti');
    await expect(sheet(page).getByRole('button', { name: /^Crea/ })).toHaveCount(0);
  });

  test('US-07 cambia esercizio, togli una voce e rimettila con Annulla', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=routine-a');
    await page.getByRole('button', { name: /^3\. Hip thrust bilanciere/ }).click();
    await openEntry(page).getByRole('button', { name: 'Cambia' }).click();
    await pickExercise(page, 'Hip thrust machine');
    // l'esercizio scelto esce dalle alternative
    await expect.poll(async () => (await storedArchive(page))?.routines[0].exercises[3]).toMatchObject({
      exerciseId: 'hip-thrust-machine',
      alternatives: ['glute-bridge-con-manubrio', 'pull-through-al-cavo'],
    });

    await openEntry(page).getByRole('button', { name: 'Togli dalla scheda' }).click();
    await expect(page.getByText('Hip thrust machine: tolto dalla scheda.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^3a\. Distensioni manubri seduto/ })).toBeVisible();
    await page.getByRole('button', { name: 'Annulla' }).click();
    await expect(page.getByRole('button', { name: /^3\. Hip thrust machine/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^4a\. Distensioni manubri seduto/ })).toBeVisible();
  });

  test('US-07 riordino con le frecce, da tastiera, con il focus che resta sulla freccia', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=routine-a');
    await page.getByRole('button', { name: 'Riordina' }).click();
    const down = page.getByRole('button', { name: 'Sposta giù Squat bilanciere' });
    await expect(page.getByRole('button', { name: 'Sposta su Squat bilanciere' })).toBeDisabled();
    await down.focus();
    await page.keyboard.press('Enter');
    // la voce singola scavalca la superserie senza entrarci
    await expect(page.getByRole('status').filter({ hasText: 'Squat bilanciere: ora 2.' })).toBeAttached();
    await expect(down).toBeFocused();
    // dentro la superserie le voci si scambiano; dal bordo si sposta la superserie intera
    await page.getByRole('button', { name: 'Sposta giù Panca piana bilanciere' }).click();
    await page.getByRole('button', { name: 'Sposta giù la superserie con Panca piana bilanciere' }).click();
    await page.getByRole('button', { name: 'Fine' }).click();
    const ids = (await storedArchive(page))?.routines[0].exercises.map((e) => e.exerciseId);
    expect(ids?.slice(0, 4)).toEqual(['squat-bilanciere', 'rematore-manubri-petto-su-panca-inclinata', 'panca-piana-bilanciere', 'hip-thrust-bilanciere']);
    await expect(page.getByRole('button', { name: /^2a\. Rematore manubri/ })).toBeVisible();
  });

  test('US-08 alternative: aggiungi dal catalogo e togli', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=routine-a');
    await page.getByRole('button', { name: /^2a\. Panca piana bilanciere/ }).click();
    const editor = openEntry(page);
    await editor.getByRole('button', { name: 'Aggiungi alternativa' }).click();
    // l'esercizio stesso e le alternative già scelte non si propongono
    await sheet(page).getByLabel('Cerca o scrivi il nome').fill('panca piana');
    await expect(sheet(page).getByRole('button', { name: 'Panca piana manubri', exact: true })).toHaveCount(0);
    await expect(sheet(page).getByRole('button', { name: 'Panca piana bilanciere', exact: true })).toHaveCount(0);
    await pickExercise(page, 'Distensioni manubri panca inclinata');
    await editor.getByRole('button', { name: 'Togli l’alternativa Chest press' }).click();
    await page.reload();
    expect((await storedArchive(page))?.routines[0].exercises[1].alternatives).toEqual(['panca-piana-manubri', 'distensioni-manubri-panca-inclinata']);
    await expect(page.getByRole('button', { name: /^2a\./ })).toContainText('2 alternative');
  });
});

test.describe('US-10 elenco delle schede', () => {
  test('US-10 senza schede: crea o aggiungi le schede di esempio', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('routines/');
    await expect(page.getByRole('heading', { name: 'Nessuna scheda' })).toBeVisible();
    await page.getByRole('button', { name: 'Aggiungi le schede di esempio' }).click();
    await expect(page.getByRole('link', { name: /Scheda A/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Scheda B/ })).toContainText('8 esercizi · mai fatta');
  });

  test('US-10 l’elenco mostra esercizi, giorni assegnati e ultima volta', async ({ page }) => {
    const done = { ...session('s1', '2026-10-06'), routineId: 'routine-a' };
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: { mon: 'routine-a', thu: 'routine-a' }, sessions: [done] }));
    await page.goto('routines/');
    await expect(page.getByRole('link', { name: /Scheda A/ })).toContainText(/8 esercizi · lun, gio · ultima volta il 6 ottobre/);
  });

  test('US-10 duplica, rinomina e riordina', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routines/');
    await page.getByRole('button', { name: 'Azioni per Scheda A' }).click();
    await sheet(page).getByRole('button', { name: 'Duplica' }).click();
    await expect(page.getByText('Creata «Scheda A (copia)».')).toBeVisible();

    await page.getByRole('button', { name: 'Azioni per Scheda A (copia)' }).click();
    await sheet(page).getByRole('button', { name: 'Rinomina' }).click();
    await expect(page.getByLabel('Nome della scheda')).toBeFocused();
    await page.getByLabel('Nome della scheda').fill('');
    await page.getByRole('button', { name: 'Salva' }).click();
    await expect(page.getByText('Scrivi il nome della scheda.')).toBeVisible();
    await page.getByLabel('Nome della scheda').fill('Scheda A2');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Azioni per Scheda A2' })).toBeFocused();

    await page.getByRole('button', { name: 'Riordina' }).click();
    await page.getByRole('button', { name: 'Sposta su Scheda A2' }).click();
    await page.getByRole('button', { name: 'Fine' }).click();
    await page.reload();
    const names = (await storedArchive(page))?.routines.map((r) => r.name);
    expect(names).toEqual(['Scheda A2', 'Scheda A', 'Scheda B']);
    const copy = (await storedArchive(page))!.routines[0];
    expect(copy.exercises.map((e) => e.exerciseId)).toEqual(starterRoutines()[0].exercises.map((e) => e.exerciseId));
    await expect(page.getByRole('link').filter({ hasText: 'Scheda' }).first()).toContainText('Scheda A2');
  });

  test('US-10 archiviare non cancella lo storico; l’archiviata è in sola lettura con Ripristina', async ({ page }) => {
    const done = { ...session('s1', '2026-10-06'), routineId: 'routine-b' };
    await seedArchive(page, archiveWith({ routines: starterRoutines(), sessions: [done] }));
    await page.goto('routines/');
    await page.getByRole('button', { name: 'Azioni per Scheda B' }).click();
    await expect(sheet(page).getByText('Non si può eliminare: 1 allenamento nello storico usa questa scheda.')).toBeVisible();
    await expect(sheet(page).getByRole('button', { name: 'Elimina' })).toHaveCount(0);
    await sheet(page).getByRole('button', { name: 'Archivia' }).click();
    await expect(page.getByRole('heading', { name: /Archiviate/ })).toBeVisible();
    const saved = await storedArchive(page);
    expect(saved?.routines[1].archived).toBe(true);
    expect(saved?.sessions).toHaveLength(1);

    await page.getByRole('link', { name: /Scheda B/ }).click();
    await expectPage(page, 'routine/');
    await expect(page.getByText(/Scheda archiviata/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aggiungi esercizio' })).toHaveCount(0);
    await expect(page.getByLabel('Nome della scheda')).toHaveCount(0);
    await page.getByRole('button', { name: 'Ripristina' }).click();
    await expect(page.getByLabel('Nome della scheda')).toHaveValue('Scheda B');
    expect((await storedArchive(page))?.routines[1].archived).toBe(false);
  });

  test('US-10 eliminare chiede conferma, toglie i giorni assegnati e si può annullare', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines(), schedule: { tue: 'routine-b' } }));
    await page.goto('routines/');
    await page.getByRole('button', { name: 'Azioni per Scheda B' }).click();
    await sheet(page).getByRole('button', { name: 'Elimina' }).click();
    const dialog = page.getByRole('dialog', { name: 'Eliminare «Scheda B»?' });
    await expect(dialog).toContainText('Si perdono i suoi 8 esercizi e l’assegnazione a martedì.');
    await dialog.getByRole('button', { name: 'Annulla' }).click();
    expect((await storedArchive(page))?.routines).toHaveLength(2);

    await page.getByRole('button', { name: 'Azioni per Scheda B' }).click();
    await sheet(page).getByRole('button', { name: 'Elimina' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Elimina scheda' }).click();
    await expect(page.getByText('«Scheda B» eliminata.')).toBeVisible();
    let saved = await storedArchive(page);
    expect(saved?.routines.map((r) => r.id)).toEqual(['routine-a']);
    expect(saved?.schedule).toEqual({});

    await page.getByRole('button', { name: 'Annulla' }).click();
    await expect(page.getByRole('link', { name: /Scheda B/ })).toBeVisible();
    saved = await storedArchive(page);
    expect(saved?.routines.map((r) => r.id)).toEqual(['routine-a', 'routine-b']);
    expect(saved?.schedule).toEqual({ tue: 'routine-b' });
  });

  test('US-10 una scheda inesistente porta all’elenco', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: starterRoutines() }));
    await page.goto('routine/?id=non-esiste');
    await expect(page.getByRole('heading', { name: 'Scheda non trovata' })).toBeVisible();
    await page.getByRole('link', { name: 'Vai alle schede' }).click();
    await expectPage(page, 'routines/');
  });
});
