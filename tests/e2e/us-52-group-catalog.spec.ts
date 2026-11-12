import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive, session } from './helpers';

// US-52 (INC-041): nel foglio di un gruppo gli esercizi del catalogo che lo allenano, per quota e poi per nome. Anche i
// gruppi di «Nessuna serie» sono pulsanti: il loro foglio ha solo questa sezione, senza grafico.

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T18:30:00+02:00'));
  // squat bilanciere il 1° ottobre: quadricipiti, glutei, adduttori, lombari e addominali; i flessori dell'anca a zero
  await seedArchive(page, archiveWith({ sessions: [session('a', '2026-10-01')] }));
  await page.goto('progress/');
});

test('US-52 il tocco su un gruppo a zero apre il foglio con gli esercizi del catalogo; la card apre l’esercizio', async ({ page }) => {
  await page.getByRole('button', { name: "Flessori dell'anca: nessuna serie, vedi gli esercizi" }).click();
  const sheet = page.getByRole('dialog', { name: "Flessori dell'anca", exact: true });
  await expect(sheet.getByRole('group', { name: /Usa le frecce/ })).toHaveCount(0);
  await expect(sheet.getByRole('region')).toHaveCount(1);
  const rows = sheet.getByRole('region', { name: 'Esercizi che lo allenano' }).getByRole('listitem');
  await expect(rows).toHaveText([
    /^Leg raise alla sbarra.*ogni serie conta 1\s*$/,
    /^Leg raise alla sedia romana.*ogni serie conta 1\s*$/,
    /^Leg raise su panca inclinata.*ogni serie conta 1\s*$/,
    /^Sit-up alla panca romana.*ogni serie conta 1\s*$/,
    /^Sit-up.*ogni serie conta 0,5\s*$/,
    /^Sit-up su panca inclinata.*ogni serie conta 0,5\s*$/,
  ]);

  await rows.first().getByRole('link').click();
  await expect(page).toHaveURL(/exercise\/\?id=leg-raise-alla-sbarra$/);
});

test('US-52 nel foglio di un gruppo allenato il catalogo viene sotto gli esercizi fatti', async ({ page }) => {
  await page.getByRole('button', { name: /^Quadricipiti: .*apri l'andamento$/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Quadricipiti: serie per settimana' });
  await expect(sheet.getByRole('region')).toHaveText([/^Esercizi, tutte le settimane/, /^Esercizi che lo allenano/]);
  const squat = sheet.getByRole('region', { name: 'Esercizi che lo allenano' }).getByRole('listitem').filter({ hasText: /^Squat bilanciere/ });
  await expect(squat).toHaveText(/Ultima volta: .*1 allenamento.*ogni serie conta 1\s*$/);
});
