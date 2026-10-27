import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-list/action — <mat-action-list role="group">, 3 <button class="mat-mdc-list-item">, disabled reflects both native disabled + aria-disabled + opacity', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/action/`);
  await page.waitForSelector('[data-scenario-ready]');

  const actionList = page.locator('mat-action-list');
  await expect(actionList).toBeVisible();
  await expect(actionList).toHaveAttribute('role', 'group');

  // Polymorphic-item locator: <button class="mat-mdc-list-item">.
  const buttons = page.locator('button.mat-mdc-list-item');
  await expect(buttons).toHaveCount(3);

  const deleteBtn = buttons.filter({hasText: 'Delete'});
  // Upstream sets this via an ATTRIBUTE binding (`[attr.disabled]`), which
  // Angular stringifies rather than treating as a native HTML boolean
  // attribute — the real DOM is `disabled="true"`, not `disabled=""`.
  await expect(deleteBtn).toHaveAttribute('disabled', 'true');
  await expect(deleteBtn).toHaveAttribute('aria-disabled', 'true');
  await expect(deleteBtn).toHaveClass(/mdc-list-item--disabled/);

  // Disabled item's title text opacity ≈ 0.3 — upstream's M3 token
  // (`list-list-item-disabled-label-text-opacity` in _m3-list.scss) and
  // scopes it to `.mdc-list-item__primary-text` / `__secondary-text`, not
  // the item host itself.
  const titleOpacity = await deleteBtn
    .locator('.mat-mdc-list-item-title')
    .evaluate(el => getComputedStyle(el).opacity);
  expect(parseFloat(titleOpacity)).toBeCloseTo(0.3, 1);

  // Non-disabled items don't have disabled attribute.
  const saveBtn = buttons.filter({hasText: 'Save'});
  expect(await saveBtn.getAttribute('disabled')).toBeNull();
});
