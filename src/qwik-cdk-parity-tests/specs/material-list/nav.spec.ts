import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

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

test('material-list/nav-state — each item’s content is in the HTML only, not in the serialized state too', async ({
  request,
}) => {
  const response = await request.get(`${BASE_URL}/mat-list/nav-state/`);
  const html = await response.text();
  const state = [...html.matchAll(/<script type="qwik\/state"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1])
    .join('');

  expect(state).not.toBe('');
  // The fixture's items re-render (`activated` follows a signal), so Qwik serializes their props.
  // An item's sections are projected children, which the list renders and never serializes —
  // they'd otherwise ship twice, beside the same content in the HTML.
  for (const text of ['Inbox', 'Sent', 'Drafts']) {
    expect(html).toContain(`>${text}<`);
    expect(state).not.toContain(text);
  }
});

test('material-list/nav-state — an item re-rendered on the client keeps its projected content', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/nav-state/`);
  await page.waitForSelector('[data-scenario-ready]');

  const anchors = page.locator('a.mat-mdc-list-item');
  const sent = anchors.filter({hasText: 'Sent'});
  const drafts = anchors.filter({hasText: 'Drafts'});
  await expect(sent).toHaveClass(/mdc-list-item--activated/);

  await page.click('.activate-next');

  await expect(drafts).toHaveClass(/mdc-list-item--activated/);
  await expect(drafts).toHaveAttribute('aria-current', 'page');
  await expect(sent).not.toHaveClass(/mdc-list-item--activated/);
  expect(await sent.getAttribute('aria-current')).toBeNull();
  for (const [item, text] of [
    [sent, 'Sent'],
    [drafts, 'Drafts'],
  ] as const) {
    await expect(item.locator('.mat-mdc-list-item-unscoped-content')).toHaveText(text);
    await expect(item.locator('.mat-mdc-list-item-unscoped-content')).toHaveClass(
      /mdc-list-item__primary-text/,
    );
  }
});
