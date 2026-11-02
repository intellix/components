import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-list/basic — <mat-list> with 4 items, role="list", ~48px min-height per item', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-list');
  await expect(list).toBeVisible();
  await expect(list).toHaveClass(/mat-mdc-list/);
  await expect(list).toHaveAttribute('role', 'list');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(4);
  await expect(items.first()).toHaveClass(/mat-mdc-list-item/);
  await expect(items.first()).toHaveClass(/mat-mdc-list-item-single-line/);
  await expect(items.first()).toHaveClass(/mdc-list-item--with-one-line/);
  await expect(items.first()).toHaveAttribute('aria-disabled', 'false');

  // Item height ≈ 48px (single-line default, from
  // `.mdc-list-item--with-one-line`'s explicit `height`). Tolerance ±3px.
  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 48)).toBeLessThan(4);
});
