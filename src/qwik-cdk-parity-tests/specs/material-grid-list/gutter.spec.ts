import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-grid-list/gutter — gutterSize="16px" offsets tiles by 16px (not a CSS `gap`)', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/gutter/`);
  await page.waitForSelector('[data-scenario-ready]');

  // Upstream has no `gap` — TileStyler bakes the gutter into each tile's
  // calc()'d top/left/width/height. Verify it via the actual rendered gap
  // between two adjacent tiles' boxes.
  const tiles = page.locator('mat-grid-tile');
  const firstBox = await tiles.nth(0).boundingBox();
  const secondBox = await tiles.nth(1).boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  const horizontalGap = secondBox!.x - (firstBox!.x + firstBox!.width);
  expect(Math.abs(horizontalGap - 16)).toBeLessThan(2);
});
