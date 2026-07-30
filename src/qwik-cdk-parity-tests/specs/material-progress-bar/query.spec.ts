import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/query — mode="query" adds .mdc-linear-progress--indeterminate class + omits aria-valuenow + no buffer-dots div', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/query/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'query');
  await expect(bar).toHaveClass(/mdc-linear-progress--indeterminate/);
  await expect(bar).not.toHaveAttribute('aria-valuenow', /./);
  await expect(bar.locator('.mdc-linear-progress__buffer-dots')).toHaveCount(0);
});
