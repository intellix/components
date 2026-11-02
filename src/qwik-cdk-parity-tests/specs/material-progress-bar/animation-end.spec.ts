import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-progress-bar/animation-end — onAnimationEnd$ QRL fires on primary-bar transitionend, sets data-animation-end="fired"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/animation-end/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeAttached();

  // The route flips value from 0 to 100 on mount, triggering a transition.
  // Wait for the callback to flip the marker.
  const marker = page.locator('[data-animation-end]');
  await expect(marker).toHaveAttribute('data-animation-end', 'fired', {timeout: 5000});
});
