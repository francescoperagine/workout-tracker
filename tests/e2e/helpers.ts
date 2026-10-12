import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';
import { ARCHIVE_KEY, emptyArchive, validateArchive, type Archive, type Session } from '../../src/lib/archive';

// Aiuti comuni dei test e2e. Le pagine si aprono con percorsi relativi ('settings/'), così la suite
// gira anche con WT_BASE (vedi playwright.config.ts).

export const POC_BACKUP = readFileSync(new URL('../fixtures/synthetic-poc-backup.json', import.meta.url), 'utf8');

export function session(id: string, date: string, kg = 50, reps = 8): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  return {
    id,
    date,
    routineId: null,
    name: 'Allenamento libero',
    start,
    end: start + 3_600_000,
    exercises: [
      {
        id: `${id}-e1`,
        exerciseId: 'squat-bilanciere',
        variantOf: null,
        group: null,
        rest: 120,
        warmupRest: 60,
        notes: '',
        sets: [{ id: `${id}-s1`, type: 'normal', kg, reps, completedAt: start + 60_000 }],
      },
    ],
  };
}

/** Archivio v2 valido con le parti indicate */
export function archiveWith(parts: Partial<Archive> = {}): Archive {
  return validateArchive({ ...emptyArchive(), revision: 1, ...parts });
}

/**
 * Mette un contenuto nella chiave indicata prima del primo caricamento della scheda, una volta sola:
 * i ricaricamenti successivi trovano quello che l'app ha salvato.
 */
export async function seedStorage(page: Page, key: string, value: string) {
  await page.addInitScript(
    ([k, v]) => {
      const flag = `seeded:${k}`;
      if (sessionStorage.getItem(flag)) return;
      localStorage.setItem(k, v);
      sessionStorage.setItem(flag, '1');
    },
    [key, value],
  );
}

export async function seedArchive(page: Page, archive: Archive) {
  await seedStorage(page, ARCHIVE_KEY, JSON.stringify(archive));
}

export async function storedArchive(page: Page): Promise<Archive | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), ARCHIVE_KEY);
  return raw === null ? null : (JSON.parse(raw) as Archive);
}

/** Apre la scelta del file toccando il pulsante e vi mette il contenuto indicato */
export async function chooseFile(page: Page, buttonName: string, name: string, content: string | Buffer) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: buttonName }).click();
  await (await chooser).setFiles({ name, mimeType: 'application/json', buffer: Buffer.isBuffer(content) ? content : Buffer.from(content) });
}

/** Il foglio dal basso aperto */
export function sheet(page: Page) {
  return page.locator('dialog[open]');
}

/** Percorso della pagina relativo alla base (es. '' per Oggi, 'welcome/') */
export async function expectPage(page: Page, relative: string) {
  await expect(page).toHaveURL(new RegExp(`/${relative.replace(/\//g, '\\/')}(\\?.*)?$`));
}

/**
 * "Termina" dell'allenamento: con serie ancora da fare chiede conferma (step 9) e qui si conferma.
 * Per i casi in cui "Termina" non conclude (nessuna serie) si usa il pulsante direttamente.
 */
export async function finishWorkout(page: Page) {
  await page.getByRole('button', { name: 'Termina' }).click();
  const confirm = page.getByRole('dialog', { name: 'Terminare l’allenamento?' });
  await expect(page.getByRole('heading', { name: 'Allenamento concluso' }).or(confirm)).toBeVisible();
  if (await confirm.isVisible()) await confirm.getByRole('button', { name: 'Termina' }).click();
}

/** Aspetta che l'isola del controllo sia idratata: sotto carico un clic sull'HTML statico andrebbe perso */
export async function hydrated(control: Locator) {
  await expect(control.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute('ssr');
  return control;
}
