import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/description — interactive (button) host gets aria-describedby, no inline span', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/description/`);
  await page.waitForSelector('[data-scenario-ready]');

  // The host is a <button> — interactive — so upstream's AriaDescriber path
  // applies: aria-describedby on the host, no inline cdk-visually-hidden
  // span. Matches Angular (see badge/SYNC.md "description").
  const badge = page.locator('button.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('aria-describedby', /cdk-describedby-message-/);

  const content = page.locator('span.mat-badge-content');
  await expect(content).toContainText('5');

  const desc = page.locator('span.mat-badge-content > span.cdk-visually-hidden');
  await expect(desc).toHaveCount(0);
});
