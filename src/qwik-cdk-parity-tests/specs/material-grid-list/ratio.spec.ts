import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-grid-list/ratio — rowHeight="4:3" uses margin-top/padding-top, tile aspect ≈ 4/3', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  // Ratio mode sets `padding-bottom` on the list (not `height`) — upstream's
  // percentage-padding trick for maintaining aspect ratio.
  const listStyle = await list.evaluate(el => {
    const s = (el as HTMLElement).style;
    return {height: s.height, paddingBottom: s.paddingBottom};
  });
  expect(listStyle.height).toBe('');
  expect(listStyle.paddingBottom).not.toBe('');

  const tile = page.locator('mat-grid-tile').first();
  await expect(tile).toBeVisible();

  // Ratio mode sets margin-top/padding-top on the tile (not top/height).
  const tileStyle = await tile.evaluate(el => {
    const s = (el as HTMLElement).style;
    return {marginTop: s.marginTop, paddingTop: s.paddingTop, top: s.top, height: s.height};
  });
  expect(tileStyle.marginTop).not.toBe('');
  expect(tileStyle.paddingTop).not.toBe('');
  expect(tileStyle.top).toBe('');
  expect(tileStyle.height).toBe('');

  const box = await tile.boundingBox();
  expect(box).not.toBeNull();
  // rowHeight="4:3" means W:H = 4:3, so aspect (width/height) = 4/3 ≈ 1.333.
  const aspect = box!.width / box!.height;
  expect(Math.abs(aspect - 4 / 3)).toBeLessThan(0.05);
});
