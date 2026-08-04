import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/ratio-spanning — compound aspect on 2x2 tile in a 4:3 grid ≈ 8/6', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio-spanning/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'ratio');

  const hero = page.locator('mat-grid-tile').first();
  await expect(hero).toHaveAttribute('rowspan', '2');
  await expect(hero).toHaveAttribute('colspan', '2');

  // Verify the inline aspect-ratio style is emitted
  const inlineAspect = await hero.evaluate(el => (el as HTMLElement).style.aspectRatio);
  expect(inlineAspect).toContain('8');
  expect(inlineAspect).toContain('6');

  // Bounding-box aspect: colspan=2, rowspan=2, ratio 4:3 → aspect = (2*4)/(2*3) = 8/6 ≈ 1.333
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  const aspect = heroBox!.width / heroBox!.height;
  expect(Math.abs(aspect - 8 / 6)).toBeLessThan(0.05);
});
