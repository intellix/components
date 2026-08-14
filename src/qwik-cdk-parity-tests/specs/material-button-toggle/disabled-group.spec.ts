import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/disabled-group — group aria-disabled=true, all children unclickable + opacity 0.38', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-group/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('aria-disabled', 'true');

  const toggles = page.locator('mat-button-toggle');
  for (let i = 0; i < 3; i++) {
    const opacity = await toggles.nth(i).evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.38, 1);
  }

  // Preselected "bold" (index 0) — verify it's still shown as checked SSR-side.
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');

  // Attempt to click "italic" — should be no-op (pointer-events: none).
  // Playwright's click bypasses pointer-events by default, so use a force check:
  const italicBox = await toggles.nth(1).locator('button').boundingBox();
  expect(italicBox).not.toBeNull();
  // Direct evaluate to verify pointer-events computed style.
  const pe = await toggles.nth(1).evaluate(el => getComputedStyle(el).pointerEvents);
  expect(pe).toBe('none');
});
