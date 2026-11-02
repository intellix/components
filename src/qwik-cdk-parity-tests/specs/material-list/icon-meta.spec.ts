import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Geometry assertions (icon ≈ 24px, meta right of icon) were dropped —
 * the scenario's own inline `style="width:100%;height:100%"` on the icon
 * stretches it to fill the item in BOTH the Angular reference and this
 * port; it's a quirk of the shared scenario markup, not something either
 * side "gets right" (computed-style parity is out of scope — see the
 * remediation design doc). DOM-structural parity (the authoritative gate)
 * is covered by angular-parity.spec.ts; this spec instead checks the
 * content-derived classes a Qwik-only test can actually assert
 * deterministically.
 */
test('material-list/icon-meta — leading icon + trailing meta classes, both-leading-and-trailing', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/icon-meta/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  await expect(firstItem).toHaveClass(/mdc-list-item--with-leading-icon/);
  await expect(firstItem).toHaveClass(/mdc-list-item--with-trailing-meta/);
  await expect(firstItem).toHaveClass(/mat-mdc-list-item-both-leading-and-trailing/);
  await expect(firstItem).toHaveClass(/mat-mdc-list-item-single-line/);

  const icon = firstItem.locator('.mat-mdc-list-item-icon');
  await expect(icon).toHaveClass(/mdc-list-item__start/);

  const meta = firstItem.locator('.mat-mdc-list-item-meta');
  await expect(meta).toHaveClass(/mdc-list-item__end/);
  await expect(meta).toHaveText('128');

  // Icon precedes the content span, meta follows it — mirrors upstream's
  // fixed `<ng-content>` ordering regardless of authoring order.
  const order = await firstItem.evaluate(el => Array.from(el.children).map(c => c.className));
  const iconIndex = order.findIndex(c => c.includes('mat-mdc-list-item-icon'));
  const contentIndex = order.findIndex(c => c === 'mdc-list-item__content');
  const metaIndex = order.findIndex(c => c.includes('mat-mdc-list-item-meta'));
  expect(iconIndex).toBeGreaterThanOrEqual(0);
  expect(contentIndex).toBeGreaterThan(iconIndex);
  expect(metaIndex).toBeGreaterThan(contentIndex);
});
