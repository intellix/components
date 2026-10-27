import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-grid-list/basic — <mat-grid-list> absolutely-positions 8 tiles, fixed rowHeight', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toBeVisible();
  await expect(list).toHaveClass(/mat-grid-list/);
  await expect(list).toHaveAttribute('cols', '4');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);
  await expect(tiles.first()).toHaveClass(/mat-grid-tile/);

  // Upstream's layout model: the list is `position: relative` with an
  // explicit inline `height`; every tile is `position: absolute` with
  // inline top/left/width/height — not CSS grid.
  const listPosition = await list.evaluate(el => getComputedStyle(el).position);
  expect(listPosition).toBe('relative');
  const listHeight = await list.evaluate(el => (el as HTMLElement).style.height);
  expect(listHeight).not.toBe('');

  const tilePosition = await tiles.first().evaluate(el => getComputedStyle(el).position);
  expect(tilePosition).toBe('absolute');
  const tileStyle = await tiles.first().evaluate(el => {
    const s = (el as HTMLElement).style;
    return {top: s.top, left: s.left, width: s.width, height: s.height};
  });
  expect(tileStyle.top).not.toBe('');
  expect(tileStyle.left).not.toBe('');
  expect(tileStyle.width).not.toBe('');
  expect(tileStyle.height).not.toBe('');

  // First tile bounding box: width ≈ container width / 4 (±3px tolerance for gutter + subpixel)
  const listBox = await list.boundingBox();
  const tileBox = await tiles.first().boundingBox();
  expect(listBox).not.toBeNull();
  expect(tileBox).not.toBeNull();
  const expectedTileWidth = listBox!.width / 4;
  expect(Math.abs(tileBox!.width - expectedTileWidth)).toBeLessThan(4);
});
