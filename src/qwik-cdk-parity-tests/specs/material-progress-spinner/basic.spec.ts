import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/basic — <mat-progress-spinner> with default determinate mode, primary color, aria-valuenow=50, both containers rendered', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(/mat-mdc-progress-spinner/);
  await expect(spinner).toHaveClass(/mdc-circular-progress/);
  await expect(spinner).toHaveClass(/mat-primary/);
  await expect(spinner).not.toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('aria-valuemin', '0');
  await expect(spinner).toHaveAttribute('aria-valuemax', '100');
  await expect(spinner).toHaveAttribute('aria-valuenow', '50');
  await expect(spinner).toHaveAttribute('tabindex', '-1');
  await expect(spinner).toHaveAttribute('mode', 'determinate');

  await expect(spinner).toHaveAttribute('style', /width:\s*100px/);
  await expect(spinner).toHaveAttribute('style', /height:\s*100px/);
  await expect(spinner).toHaveAttribute('style', /--mat-progress-spinner-size:\s*100px/);

  await expect(spinner.locator('.mdc-circular-progress__determinate-container')).toBeAttached();
  await expect(spinner.locator('.mdc-circular-progress__indeterminate-container')).toBeAttached();
});
