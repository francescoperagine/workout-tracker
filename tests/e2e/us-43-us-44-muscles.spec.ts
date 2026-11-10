import { expect, test } from '@playwright/test';
import type { Routine } from '../../src/lib/archive';
import { archiveWith, expectPage, seedArchive, sheet, storedArchive } from './helpers';

// US-43 e US-44 (muscle-volume, incremento 4): i muscoli nella pagina dell'esercizio, l'editor dei
// personalizzati e la variante di un esercizio di catalogo, che lo sostituisce nelle schede attive.

const entry = { sets: 3, reps: '8', loadMin: null, loadMax: null, loadNote: '', unit: '', rest: 90, warmupRest: 60, group: null };
const routine = (id: string, archived: boolean): Routine => ({
  id,
  name: archived ? 'Vecchia' : 'Gambe',
  notes: '',
  archived,
  exercises: [{ ...entry, id: `${id}-e1`, exerciseId: 'squat-bilanciere', alternatives: ['leg-press'] }],
});

test.describe('US-43 muscoli di un esercizio', () => {
  test('US-43 in un personalizzato i tocchi girano nessuno, principale, secondario e lo stato resta dopo un ricaricamento', async ({ page }) => {
    await seedArchive(page, archiveWith({ catalog: { 'custom-crunch': { id: 'custom-crunch', name: 'Crunch', muscles: { primary: [], secondary: [] }, variantOf: null } } }));
    await page.goto('exercise/?id=custom-crunch');
    await expect(page.getByText('Scegli i muscoli: finché sono vuoti')).toBeVisible();

    await page.getByRole('button', { name: 'Addominali, nessuno' }).click();
    await expect(page.getByRole('button', { name: 'Addominali, principale' })).toBeVisible();
    await page.getByRole('button', { name: 'Lombari, nessuno' }).click();
    await page.getByRole('button', { name: 'Lombari, principale' }).click();
    await expect(page.getByRole('button', { name: 'Lombari, secondario' })).toBeVisible();
    await expect(page.getByText('Scegli i muscoli: finché sono vuoti')).toHaveCount(0);
    expect((await storedArchive(page))!.catalog['custom-crunch'].muscles).toEqual({ primary: ['abs'], secondary: ['lower-back'] });

    await page.reload();
    await expect(page.getByRole('button', { name: 'Addominali, principale' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lombari, secondario' })).toBeVisible();
    // il terzo tocco torna a nessuno
    await page.getByRole('button', { name: 'Lombari, secondario' }).click();
    await expect(page.getByRole('button', { name: 'Lombari, nessuno' })).toBeVisible();
    expect((await storedArchive(page))!.catalog['custom-crunch'].muscles).toEqual({ primary: ['abs'], secondary: [] });
  });

  test('US-43 un esercizio di catalogo mostra i muscoli in sola lettura, anche senza storico', async ({ page }) => {
    await seedArchive(page, archiveWith());
    await page.goto('exercise/?id=squat-bilanciere');
    const section = page.getByRole('region', { name: 'Muscoli' });
    await expect(section).toContainText('Principali: Quadricipiti, Glutei, Adduttori');
    await expect(section).toContainText('Secondari: nessuno');
    await expect(section.getByRole('button', { name: /principale|secondario|nessuno/ })).toHaveCount(0);
    await expect(section.getByRole('button', { name: 'Personalizza i muscoli' })).toBeVisible();
  });
});

test.describe('US-44 variante di un esercizio di catalogo', () => {
  test('US-44 «Personalizza i muscoli» crea la variante, che sostituisce l’originale nella scheda attiva, e si annulla', async ({ page }) => {
    const archive = archiveWith({ routines: [routine('attiva', false), routine('archiviata', true)] });
    await seedArchive(page, archive);
    await page.goto('exercise/?id=squat-bilanciere');

    await page.getByRole('button', { name: 'Personalizza i muscoli' }).click();
    await expect(sheet(page).getByLabel('Nome del nuovo esercizio')).toHaveValue('Squat bilanciere (personalizzato)');
    await expect(sheet(page)).toContainText('Lo sostituisce in 1 scheda attiva');
    await sheet(page).getByRole('button', { name: 'Crea' }).click();

    // la pagina della variante, con l'avviso e il parametro già tolto
    await expectPage(page, 'exercise/');
    await expect(page).toHaveURL(/id=custom-squat-bilanciere-personalizzato$/);
    await expect(page.getByRole('heading', { name: 'Squat bilanciere (personalizzato)' })).toBeVisible();
    const toast = page.getByRole('status').filter({ hasText: 'Creato «Squat bilanciere (personalizzato)», sostituito in 1 scheda.' });
    await expect(toast).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quadricipiti, principale' })).toBeVisible();
    const saved = (await storedArchive(page))!;
    expect(saved.routines.find((r) => r.id === 'attiva')!.exercises[0].exerciseId).toBe('custom-squat-bilanciere-personalizzato');
    expect(saved.routines.find((r) => r.id === 'archiviata')!.exercises[0].exerciseId).toBe('squat-bilanciere');

    // «Annulla» torna all'originale con la scheda com'era
    await toast.getByRole('button', { name: 'Annulla' }).click();
    await expect(page).toHaveURL(/id=squat-bilanciere$/);
    await expect(page.getByRole('heading', { name: 'Squat bilanciere', exact: true })).toBeVisible();
    const undone = (await storedArchive(page))!;
    expect(undone.routines).toEqual(archive.routines);
    expect(undone.catalog).toEqual({});
  });

  test('US-44 «Basata su Squat bilanciere» porta all’originale; un nome già usato dà errore nel foglio', async ({ page }) => {
    await seedArchive(page, archiveWith({ routines: [routine('attiva', false)] }));
    await page.goto('exercise/?id=squat-bilanciere');
    await page.getByRole('button', { name: 'Personalizza i muscoli' }).click();
    await sheet(page).getByLabel('Nome del nuovo esercizio').fill('Pressa');
    await sheet(page).getByRole('button', { name: 'Crea' }).click();
    await expect(sheet(page).getByText('C’è già un esercizio con questo nome')).toBeVisible();
    await sheet(page).getByLabel('Nome del nuovo esercizio').fill('Squat mio');
    await sheet(page).getByRole('button', { name: 'Crea' }).click();

    await expect(page.getByRole('heading', { name: 'Squat mio' })).toBeVisible();
    await page.getByRole('link', { name: 'Basata su Squat bilanciere' }).click();
    await expect(page).toHaveURL(/id=squat-bilanciere$/);
    // dopo un ricaricamento della variante l'avviso non torna
    await page.goto('exercise/?id=custom-squat-mio');
    await expect(page.getByRole('status').filter({ hasText: 'Creato' })).toHaveCount(0);
  });
});
