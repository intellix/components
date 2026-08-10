import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/nav — <mat-nav-list role="navigation">, 3 <a class="mat-mdc-list-item">, activated has aria-current="page"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/nav/`);
  await page.waitForSelector('[data-scenario-ready]');

  const navList = page.locator('mat-nav-list');
  await expect(navList).toBeVisible();
  await expect(navList).toHaveAttribute('role', 'navigation');

  // Polymorphic-item locator: <a class="mat-mdc-list-item"> (NOT <mat-list-item>).
  const anchors = page.locator('a.mat-mdc-list-item');
  await expect(anchors).toHaveCount(3);

  // Non-activated items have no aria-current attribute.
  const inbox = anchors.filter({hasText: 'Inbox'});
  await expect(inbox).toHaveAttribute('href', '/inbox');
  expect(await inbox.getAttribute('aria-current')).toBeNull();

  // Activated item has aria-current="page".
  const sent = anchors.filter({hasText: 'Sent'});
  await expect(sent).toHaveAttribute('aria-current', 'page');
  await expect(sent).toHaveClass(/mdc-list-item--activated/);

  const drafts = anchors.filter({hasText: 'Drafts'});
  expect(await drafts.getAttribute('aria-current')).toBeNull();
});
