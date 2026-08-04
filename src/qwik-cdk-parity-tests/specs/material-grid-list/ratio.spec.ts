import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/ratio — data-mode="ratio" + tile bounding-box aspect ≈ 4/3', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'ratio');

  const tile = page.locator('mat-grid-tile').first();
  await expect(tile).toBeVisible();

  const box = await tile.boundingBox();
  expect(box).not.toBeNull();
  // rowHeight="4:3" means W:H = 4:3, so aspect (width/height) = 4/3 ≈ 1.333.
  const aspect = box!.width / box!.height;
  expect(Math.abs(aspect - 4 / 3)).toBeLessThan(0.05);
});
