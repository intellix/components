import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/aria-labeled — <mat-divider> carries aria-label alongside role="separator"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-divider/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-label', 'End of comments');
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
});
