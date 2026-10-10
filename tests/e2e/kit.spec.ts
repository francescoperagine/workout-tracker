import { expect, test } from '@playwright/test';

// Componenti del design system su /kit. I test delle storie vere arrivano con le pagine (step 3–7).

test('/kit: la spunta su una riga vuota conferma il precedente e apre il recupero', async ({ page }) => {
  await page.goto('kit/');
  await page.getByRole('button', { name: 'Segna serie 2 come fatta' }).click();
  await expect(page.getByRole('textbox', { name: 'Peso serie 2, kg' })).toHaveValue('40');
  await expect(page.getByRole('textbox', { name: 'Ripetizioni serie 2' })).toHaveValue('7');
  const timer = page.locator('dialog[open]');
  await expect(timer.getByRole('button', { name: 'Salta' })).toBeVisible();
  await timer.getByRole('button', { name: 'Riduci', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Recupero: .* Tocca per aprire$/ })).toBeVisible();
});

test('/kit: la variante si può scrivere a mano al posto di quella prevista', async ({ page }) => {
  await page.goto('kit/');
  await page.getByRole('button', { name: 'Cambia variante' }).click();
  const sheet = page.locator('dialog[open]');
  const useButton = sheet.getByRole('button', { name: 'Usa questa variante' });
  await sheet.getByRole('radio', { name: 'Altro esercizio…' }).check();
  await expect(useButton).toBeDisabled();
  const input = sheet.getByRole('textbox', { name: 'Che esercizio hai fatto al posto di quello previsto?' });
  await expect(input).toBeFocused();
  await input.fill('Panca inclinata con kettlebell');
  await useButton.click();
  await expect(page.getByText('Variante scelta: Panca inclinata con kettlebell')).toBeVisible();
});
