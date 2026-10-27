import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-list/two-line — mdc-list-item--with-two-lines, item height ≈ 64px', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/two-line/`);
  await page.waitForSelector('[data-scenario-ready]');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(3);
  // numberOfLines is inferred from the title + lineContent props (see
  // mat-list-item.tsx) — upstream's `.mdc-list-item--with-two-lines` class
  // sets an explicit `height`, not a CSS `:has()` selector.
  await expect(items.first()).toHaveClass(/mdc-list-item--with-two-lines/);
  await expect(items.first()).not.toHaveClass(/mat-mdc-list-item-single-line/);

  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 64)).toBeLessThan(4);
});
