import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/basic — host button carries mat-badge classes + content span present', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('button.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge(\s|$)/);
  // No `color` prop passed ⇒ no `mat-badge-<color>` class — matches
  // upstream's quirk where the directive's *default* color never runs the
  // class-adding setter (see mat-badge.tsx `color` prop doc / SYNC.md).
  await expect(badge).not.toHaveClass(/mat-badge-primary/);
  await expect(badge).not.toHaveClass(/mat-badge-accent/);
  await expect(badge).not.toHaveClass(/mat-badge-warn/);
  await expect(badge).toHaveClass(/mat-badge-medium/);
  await expect(badge).toHaveClass(/mat-badge-above/);
  await expect(badge).toHaveClass(/mat-badge-after/);
  await expect(badge).toHaveClass(/mat-badge-overlap/);

  const content = page.locator('span.mat-badge-content');
  await expect(content).toBeVisible();
  await expect(content).toContainText('5');
  await expect(content).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveClass(/mat-badge-active/);
});
