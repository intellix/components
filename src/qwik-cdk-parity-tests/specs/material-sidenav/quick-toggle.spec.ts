import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only regression: a drawer closed before its open transition settled used to report the
 * superseded `true` 400 ms later; a consumer writing `onOpenedChange$` back into `opened` (as every
 * controlled drawer does) reopened it, and the two transitions' timers re-armed each other, the
 * drawer opening and closing every 400 ms for good. Only the latest transition may report.
 */
test('material-sidenav/quick-toggle — closed before its open settled, the drawer stays closed', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-sidenav/quick-toggle/`);
  await page.waitForSelector('[data-scenario-ready]');
  const drawer = page.locator('[data-parity-root] mat-drawer');
  // Transitions on (the container's delayed `mat-drawer-transition`): each open/close takes its 400 ms.
  await expect(page.locator('[data-parity-root] mat-drawer-container')).toHaveClass(
    /mat-drawer-transition/,
  );

  await page.locator('#open-then-close').click();
  // Five transitions' worth: a loop would have flipped it several times by now.
  await page.waitForTimeout(2000);

  await expect(page.locator('[data-opened]')).toHaveText('false');
  await expect(drawer).not.toHaveClass(/mat-drawer-opened/);
  // At most the close's own report, never the superseded open's.
  expect(Number(await page.locator('[data-changes]').textContent())).toBeLessThanOrEqual(1);
});
