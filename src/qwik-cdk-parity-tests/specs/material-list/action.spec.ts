import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

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
  await expect(deleteBtn).toHaveAttribute('disabled', '');
  await expect(deleteBtn).toHaveAttribute('aria-disabled', 'true');
  await expect(deleteBtn).toHaveClass(/mdc-list-item--disabled/);

  // Disabled item opacity ≈ 0.38.
  const opacity = await deleteBtn.evaluate(el => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBeCloseTo(0.38, 1);

  // Non-disabled items don't have disabled attribute.
  const saveBtn = buttons.filter({hasText: 'Save'});
  expect(await saveBtn.getAttribute('disabled')).toBeNull();
});
