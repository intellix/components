import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/svg-literal — mat-icon in svg mode has data-mat-icon-type=svg, data-mat-icon-name=home (registered under that name, mirroring the Angular scenario), no fontIcon attribute, an inner <svg> sized per MatIconRegistry._setSvgAttributes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-literal/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'home');
  await expect(icon).not.toHaveAttribute('fontIcon', /./);
  await expect(icon).not.toHaveAttribute('data-mat-icon-namespace', /./);

  const inner = icon.locator('svg');
  await expect(inner).toBeAttached();
  await expect(inner).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(inner).toHaveAttribute('fit', '');
  await expect(inner).toHaveAttribute('height', '100%');
  await expect(inner).toHaveAttribute('width', '100%');
  await expect(inner).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  await expect(inner).toHaveAttribute('focusable', 'false');
});
