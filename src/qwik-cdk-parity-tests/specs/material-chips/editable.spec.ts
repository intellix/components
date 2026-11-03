import {test, expect} from '@playwright/test';

/**
 * Functional (Qwik-only — no Angular comparison; DOM/computed-style parity for this exact
 * markup is already covered by `specs/examples-misc/angular-parity.spec.ts`'s `chips-input`
 * entry) coverage for `MatChipRow`'s `editable`/`(edited)` inline editing and
 * `MatChipGrid`'s `input.addOnBlur` — both new in this pass (`qwik-material/chips/
 * mat-chip-row.tsx`/`mat-chip-grid.tsx`). Exercised against the real, ported `chips-input`
 * docs example (`/examples/chips-input/`), which upstream's own `[editable]="true"`/
 * `(edited)`/`[matChipInputAddOnBlur]="true"` usage already wires end to end.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';
const ROUTE = `${QWIK_URL}/examples/chips-input/`;

test.describe('MatChipRow editable + MatChipGrid addOnBlur — functional (Qwik only)', () => {
  test('double-click → edit → Enter commits via (edited)', async ({page}) => {
    await page.goto(ROUTE);
    await page.waitForSelector('[data-scenario-ready]');

    const firstRow = page.locator('mat-chip-row').first();
    const primaryCell = firstRow.locator('[role="gridcell"].mdc-evolution-chip__cell--primary');
    await expect(primaryCell).toContainText('Lemon');

    await primaryCell.dblclick();

    // Entering edit mode: the row gets mat-mdc-chip-editing, the focus overlay and both the
    // edit/remove icon cells disappear, and a contenteditable span (seeded with the original
    // text, focused) replaces the projected content.
    await expect(firstRow).toHaveClass(/mat-mdc-chip-editing/);
    await expect(firstRow.locator('.mat-mdc-chip-focus-overlay')).toHaveCount(0);
    await expect(firstRow.locator('.mat-mdc-chip-edit')).toHaveCount(0);
    await expect(firstRow.locator('.mat-mdc-chip-remove')).toHaveCount(0);
    const editInput = firstRow.locator('.mat-chip-edit-input');
    await expect(editInput).toHaveAttribute('role', 'textbox');
    await expect(editInput).toHaveAttribute('contenteditable', 'true');
    await expect(editInput).toHaveText('Lemon');
    await expect(editInput).toBeFocused();

    await editInput.fill('Mango');
    await editInput.press('Enter');

    // Editing finished: the class/edit-input are gone, the chip's own visible text reflects
    // the (edited) handler's result (chips-input-example's `edit()` replaces the fruit name).
    await expect(firstRow).not.toHaveClass(/mat-mdc-chip-editing/);
    await expect(firstRow.locator('.mat-chip-edit-input')).toHaveCount(0);
    await expect(primaryCell).toContainText('Mango');
    await expect(firstRow.locator('.mat-mdc-chip-focus-overlay')).toHaveCount(1);
  });

  test('editing to an empty value removes the chip instead ((edited) handler\'s own choice)', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await page.waitForSelector('[data-scenario-ready]');

    const rowsLocator = page.locator('mat-chip-row');
    await expect(rowsLocator).toHaveCount(3);

    const secondRow = rowsLocator.nth(1);
    await expect(secondRow.locator('[role="gridcell"].mdc-evolution-chip__cell--primary')).toContainText(
      'Lime',
    );
    await secondRow.locator('[role="gridcell"].mdc-evolution-chip__cell--primary').dblclick();
    const editInput = secondRow.locator('.mat-chip-edit-input');
    await editInput.fill('   ');
    await editInput.press('Enter');

    await expect(rowsLocator).toHaveCount(2);
    const remainingText = await rowsLocator.allTextContents();
    expect(remainingText.some(t => t.includes('Lime'))).toBe(false);
  });

  test('the edit icon button also starts editing (not just double-click)', async ({page}) => {
    await page.goto(ROUTE);
    await page.waitForSelector('[data-scenario-ready]');

    const firstRow = page.locator('mat-chip-row').first();
    await firstRow.locator('.mat-mdc-chip-edit').click();

    await expect(firstRow).toHaveClass(/mat-mdc-chip-editing/);
    await expect(firstRow.locator('.mat-chip-edit-input')).toBeFocused();
  });

  test('addOnBlur: blurring the "new fruit" input commits its value as a new chip', async ({page}) => {
    await page.goto(ROUTE);
    await page.waitForSelector('[data-scenario-ready]');

    await expect(page.locator('mat-chip-row')).toHaveCount(3);

    const input = page.locator('input.mat-mdc-chip-input');
    await input.fill('Mango');
    // Blur WITHOUT pressing Enter/comma — addOnBlur must still commit it. Clicking the page's
    // top-left corner (NOT the <mat-label>, which would just RE-focus the input it labels).
    await page.mouse.click(5, 5);

    await expect(page.locator('mat-chip-row')).toHaveCount(4);
    await expect(page.locator('mat-chip-row').last()).toContainText('Mango');
    await expect(input).toHaveValue('');
  });
});
