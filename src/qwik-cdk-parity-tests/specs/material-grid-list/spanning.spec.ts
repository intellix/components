import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/spanning — 2x2 hero tile has ~2x width and ~2x height of a single-cell tile', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/spanning/`);
  await page.waitForSelector('[data-scenario-ready]');

  const hero = page.locator('mat-grid-tile').first();
  const single = page.locator('mat-grid-tile').nth(1);

  await expect(hero).toHaveAttribute('rowspan', '2');
  await expect(hero).toHaveAttribute('colspan', '2');

  const heroBox = await hero.boundingBox();
  const singleBox = await single.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(singleBox).not.toBeNull();

  // Hero width ≈ 2 × single width + 1 gutter (1px). Tolerance ±4px.
  const expectedHeroWidth = 2 * singleBox!.width + 1;
  expect(Math.abs(heroBox!.width - expectedHeroWidth)).toBeLessThan(5);

  // Hero height ≈ 2 × 100px + 1 gutter (fixed rowHeight="100px").
  expect(Math.abs(heroBox!.height - 201)).toBeLessThan(5);
});
