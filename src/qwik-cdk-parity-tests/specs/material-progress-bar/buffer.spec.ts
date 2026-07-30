import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/buffer — mode="buffer" value=30 bufferValue=65, buffer-dots div present, buffer-bar flex-basis=65%', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/buffer/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'buffer');
  await expect(bar).toHaveAttribute('aria-valuenow', '30');
  await expect(bar).not.toHaveClass(/mdc-linear-progress--indeterminate/);

  const primary = bar.locator('.mdc-linear-progress__primary-bar');
  await expect(primary).toHaveAttribute('style', /scaleX\(0\.3\)/);

  const bufferBar = bar.locator('.mdc-linear-progress__buffer-bar');
  await expect(bufferBar).toHaveAttribute('style', /flex-basis:\s*65%/);

  const bufferDots = bar.locator('.mdc-linear-progress__buffer-dots');
  await expect(bufferDots).toBeAttached();
});
