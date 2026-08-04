import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/basic — <mat-grid-list> container with 8 tiles, display: grid, data-mode="fixed"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toBeVisible();
  await expect(list).toHaveClass(/mat-grid-list/);
  await expect(list).toHaveAttribute('cols', '4');
  await expect(list).toHaveAttribute('data-mode', 'fixed');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);
  await expect(tiles.first()).toHaveClass(/mat-grid-tile/);

  // Container computed style: display: grid
  const display = await list.evaluate(el => getComputedStyle(el).display);
  expect(display).toBe('grid');

  // First tile bounding box: width ≈ container width / 4 (±3px tolerance for gutter + subpixel)
  const listBox = await list.boundingBox();
  const tileBox = await tiles.first().boundingBox();
  expect(listBox).not.toBeNull();
  expect(tileBox).not.toBeNull();
  const expectedTileWidth = listBox!.width / 4;
  expect(Math.abs(tileBox!.width - expectedTileWidth)).toBeLessThan(4);
});
