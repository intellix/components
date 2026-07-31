import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/mat-spinner-alias — <mat-spinner> tag with default indeterminate mode, no aria-valuenow', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/mat-spinner-alias/`);
  await page.waitForSelector('[data-scenario-ready]');

  // Locator uses the <mat-spinner> tag specifically.
  const spinner = page.locator('mat-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(/mat-mdc-progress-spinner/);
  await expect(spinner).toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('mode', 'indeterminate');
  await expect(spinner).not.toHaveAttribute('aria-valuenow', /./);

  // The <mat-progress-spinner> tag should NOT be present on this route.
  await expect(page.locator('mat-progress-spinner')).toHaveCount(0);
});
