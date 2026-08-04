import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/fit — data-mode="fit" + 2-row layout fills 400px container', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/fit/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'fit');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);

  // 8 tiles in a 4-col grid = 2 rows. Container is 400px tall.
  // Each row ≈ 200px minus gutter (1px default) → tile height ≈ 199.5px, tolerance ±3px.
  const tileBox = await tiles.first().boundingBox();
  expect(tileBox).not.toBeNull();
  expect(Math.abs(tileBox!.height - 200)).toBeLessThan(4);
});
