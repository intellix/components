import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Geometry assertions (avatar left of title, specific pixel sizes) were
 * dropped — the scenario's own inline `style="width:100%;height:100%"` on
 * the avatar collapses the title to 0 width in BOTH the Angular reference
 * and this port (verified directly against localhost:4200/qwik-parity);
 * it's a quirk of the shared scenario markup, not something either side
 * "gets right". DOM-structural parity (the authoritative gate) is covered
 * by angular-parity.spec.ts; this spec instead checks the content-derived
 * classes a Qwik-only test can actually assert deterministically.
 */
test('material-list/avatar — leading avatar before the content span, with-leading-avatar + two-lines classes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/avatar/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  await expect(firstItem).toHaveClass(/mdc-list-item--with-leading-avatar/);
  await expect(firstItem).toHaveClass(/mdc-list-item--with-two-lines/);
  await expect(firstItem).not.toHaveClass(/mat-mdc-list-item-single-line/);

  const avatar = firstItem.locator('.mat-mdc-list-item-avatar');
  await expect(avatar).toHaveClass(/mdc-list-item__start/);
  await expect(avatar).toBeAttached();

  const title = firstItem.locator('.mat-mdc-list-item-title');
  await expect(title).toHaveClass(/mdc-list-item__primary-text/);
  await expect(title).toHaveText('Alice Smith');

  const line = firstItem.locator('.mat-mdc-list-item-line');
  await expect(line).toHaveClass(/mdc-list-item__secondary-text/);
  await expect(line).toHaveText('alice@example.com');

  // Avatar precedes the content span (which wraps title + line) in DOM
  // order — mirrors upstream's `<ng-content select="[matListItemAvatar]">`
  // sitting before `<span class="mdc-list-item__content">`.
  const order = await firstItem.evaluate(el => Array.from(el.children).map(c => c.className));
  const avatarIndex = order.findIndex(c => c.includes('mat-mdc-list-item-avatar'));
  const contentIndex = order.findIndex(c => c === 'mdc-list-item__content');
  expect(avatarIndex).toBeGreaterThanOrEqual(0);
  expect(contentIndex).toBeGreaterThan(avatarIndex);
});
