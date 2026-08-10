import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/icon-meta — icon at column 1, meta at column 3 (rightmost), icon ≈ 24px', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/icon-meta/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  const icon = firstItem.locator('.mat-mdc-list-item-icon');
  const meta = firstItem.locator('.mat-mdc-list-item-meta');

  await expect(icon).toBeVisible();
  await expect(meta).toBeVisible();

  // Icon size ≈ 24px.
  const iconBox = await icon.boundingBox();
  expect(iconBox).not.toBeNull();
  expect(Math.abs(iconBox!.width - 24)).toBeLessThan(3);
  expect(Math.abs(iconBox!.height - 24)).toBeLessThan(3);

  // Meta bounding-box right of icon.
  const metaBox = await meta.boundingBox();
  expect(metaBox).not.toBeNull();
  expect(metaBox!.x).toBeGreaterThan(iconBox!.x);
});
