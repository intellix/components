import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-grid-list/ratio-spanning — compound aspect on 2x2 tile in a 4:3 grid ≈ 8/6', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio-spanning/`);
  await page.waitForSelector('[data-scenario-ready]');

  const hero = page.locator('mat-grid-tile').first();
  await expect(hero).toHaveAttribute('rowspan', '2');
  await expect(hero).toHaveAttribute('colspan', '2');

  // Ratio mode: margin-top/padding-top, not an `aspect-ratio` declaration.
  const style = await hero.evaluate(el => {
    const s = (el as HTMLElement).style;
    return {marginTop: s.marginTop, paddingTop: s.paddingTop, aspectRatio: s.aspectRatio};
  });
  expect(style.marginTop).not.toBe('');
  expect(style.paddingTop).not.toBe('');
  expect(style.aspectRatio).toBe('');

  // Bounding-box aspect: colspan=2, rowspan=2, ratio 4:3 → aspect = (2*4)/(2*3) = 8/6 ≈ 1.333
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  const aspect = heroBox!.width / heroBox!.height;
  expect(Math.abs(aspect - 8 / 6)).toBeLessThan(0.05);
});
