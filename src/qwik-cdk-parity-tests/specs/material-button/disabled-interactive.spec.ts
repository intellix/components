import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button/disabled-interactive — aria-disabled=true, native NOT disabled', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/disabled-interactive/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  // Playwright's toBeDisabled()/toBeEnabled() treat `aria-disabled="true"` as
  // disabled too (see getAriaDisabled in playwright-core), which is exactly
  // the upstream behaviour this scenario intentionally opts out of — so this
  // must check the *native* `disabled` attribute directly, not that matcher.
  await expect(btn).not.toHaveAttribute('disabled');
  expect(await btn.evaluate(el => (el as HTMLButtonElement).disabled)).toBe(false);
  await expect(btn).toHaveAttribute('aria-disabled', 'true');
  await expect(btn).toHaveClass(/mat-mdc-button-disabled-interactive/);
});
