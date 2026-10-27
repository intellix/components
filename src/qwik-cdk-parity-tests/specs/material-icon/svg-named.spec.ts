import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/svg-named — svg mode with data-mat-icon-name=cake + data-mat-icon-namespace=social + inner <svg>', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-named/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'cake');
  await expect(icon).toHaveAttribute('data-mat-icon-namespace', 'social');

  // MatIconRegistry._setSvgAttributes (src/material/icon/icon-registry.ts)
  // sizing applied to every registered icon's root <svg>.
  const inner = icon.locator('svg');
  await expect(inner).toBeAttached();
  await expect(inner).toHaveAttribute('fit', '');
  await expect(inner).toHaveAttribute('height', '100%');
  await expect(inner).toHaveAttribute('width', '100%');
  await expect(inner).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  await expect(inner).toHaveAttribute('focusable', 'false');
});
