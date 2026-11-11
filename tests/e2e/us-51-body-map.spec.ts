import { expect, test } from '@playwright/test';
import { archiveWith, seedArchive, session } from './helpers';

// US-51 (delavier-catalog, incremento 6): la sagoma. In Progressi ogni gruppo disegnato è un pulsante che apre il
// foglio del gruppo; nella tab Info la sagoma colora la quota di una serie, con la legenda scritta.

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T18:30:00+02:00'));
});

test('US-51 il tocco su una zona della sagoma apre il foglio del gruppo giusto', async ({ page }) => {
  // squat bilanciere il 1° ottobre: quadricipiti, glutei, adduttori, lombari, addominali e femorali 1 serie
  await seedArchive(page, archiveWith({ sessions: [session('a', '2026-10-01')] }));
  await page.goto('progress/');
  const map = page.getByRole('figure', { name: 'Sagoma: serie per muscolo nel periodo' });
  await expect(map.getByRole('group', { name: 'Davanti' })).toBeVisible();
  await expect(map.getByRole('group', { name: 'Dietro' })).toBeVisible();

  // il tocco su un punto dentro una delle due zone (il centro del riquadro cade tra le teste del muscolo), con la
  // sagoma al centro dello schermo: sotto la testata fissa il tocco non arriverebbe
  await map.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const inside = await map
    .getByRole('button', { name: /^Sagoma, Femorali: / })
    .locator('path')
    .first()
    .evaluate((path: SVGPathElement) => {
      const box = path.getBBox();
      const point = path.ownerSVGElement!.createSVGPoint();
      for (point.y = box.y + box.height / 3; point.y < box.y + box.height; point.y += 4) {
        for (point.x = box.x; point.x < box.x + box.width; point.x += 4) {
          if (!path.isPointInFill(point)) continue;
          const screen = point.matrixTransform(path.getScreenCTM()!);
          return { x: screen.x, y: screen.y };
        }
      }
      throw new Error('nessun punto dentro la zona');
    });
  await page.mouse.click(inside.x + 2, inside.y + 2);
  const hamstrings = page.getByRole('dialog', { name: 'Femorali: serie per settimana' });
  await expect(hamstrings).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(hamstrings).toBeHidden();

  // da tastiera: un gruppo senza serie apre comunque il suo foglio
  await map.getByRole('button', { name: 'Sagoma, Petto: 0 serie' }).press('Enter');
  await expect(page.getByRole('dialog', { name: 'Petto: serie per settimana' })).toBeVisible();
});

test('US-51 nella tab Info la sagoma ha la legenda dei valori dell’esercizio', async ({ page }) => {
  await seedArchive(page, archiveWith());
  await page.goto('exercise/?id=stacco-da-terra&tab=info');
  const map = page.getByRole('figure', { name: 'Sagoma: i muscoli di Stacco da terra' });
  await expect(map).toContainText('1 serie');
  await expect(map).toContainText('0,5 serie');
  await expect(map.getByRole('button')).toHaveCount(0);
});
