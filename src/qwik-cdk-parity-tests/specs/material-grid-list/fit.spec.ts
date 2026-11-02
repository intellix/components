import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-grid-list/fit — rowHeight="fit" sizes tiles off the container height, not an inline list height', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/fit/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  // Upstream's FitTileStyler.getComputedHeight() returns null — "fit" mode
  // sets no inline height on the list at all; the *consumer's* CSS
  // (`.fit-host { height: 400px }` + `.fit-host > .fit-grid { height: 100% }`
  // in this scenario) is what gives the list its size.
  const listHeight = await list.evaluate(el => (el as HTMLElement).style.height);
  expect(listHeight).toBe('');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);

  // Each tile still gets an inline top/height (FitTileStyler behaves like
  // FixedTileStyler per-tile, just deriving the base size from 100%/rows
  // instead of a fixed px value).
  const tileStyle = await tiles.first().evaluate(el => {
    const s = (el as HTMLElement).style;
    return {top: s.top, height: s.height};
  });
  expect(tileStyle.top).not.toBe('');
  expect(tileStyle.height).not.toBe('');

  // 8 tiles in a 4-col grid = 2 rows. Container is 400px tall.
  // Each row ≈ 200px minus gutter (1px default) → tile height ≈ 199.5px, tolerance ±3px.
  const tileBox = await tiles.first().boundingBox();
  expect(tileBox).not.toBeNull();
  expect(Math.abs(tileBox!.height - 200)).toBeLessThan(4);
});
