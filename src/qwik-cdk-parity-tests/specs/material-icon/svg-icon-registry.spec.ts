import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Functional specs for the SVG icon registry (`icon-registry.ts`) and
 * `<MatIcon svgIcon="...">` — no Angular comparison (the registry is a
 * Qwik-only API; the registry-feature's Angular-side ANALOGUE is covered
 * separately by the icon-svg docs-example parity spec,
 * `specs/examples-misc/angular-parity.spec.ts`'s `icon-svg` case). These
 * exercise the pieces that example doesn't: URL-backed icons, namespaces/
 * icon-sets, client-side re-resolution after resume, and the missing-icon
 * error path.
 */

test('material-icon/svg-icon-url — URL-registered icon is already resolved in the raw SSR HTML (no JS)', async ({
  request,
}) => {
  // `request.get()` performs a plain HTTP fetch — no browser, no JS
  // execution at all — the strongest possible proof that the resolved
  // <svg> markup is server-rendered, not inserted by client-side code.
  const response = await request.get(`${BASE_URL}/mat-icon/svg-icon-url/`);
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('data-mat-icon-type="svg"');
  expect(html).toContain('data-mat-icon-name="home"');
  // The actual icon content fetched (server-side) from /mat-icon/assets/home.svg —
  // present verbatim in the raw response body.
  expect(html).toContain('<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>');
  // Upstream's universal _setSvgAttributes set, applied by the registry.
  expect(html).toMatch(/<svg[^>]*\bfit=""/);
  expect(html).toMatch(/<svg[^>]*\bfocusable="false"/);
});

test('material-icon/svg-icon-url — same DOM after hydration', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-icon-url/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'home');
  await expect(icon.locator('svg')).toBeAttached();
  await expect(icon.locator('svg path')).toHaveAttribute(
    'd',
    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  );
});

test('material-icon/svg-icon-namespace — namespace + icon-set lookup resolves both icons by namespace:name', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-icon-namespace/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icons = page.locator('mat-icon');
  await expect(icons).toHaveCount(2);

  const cat = icons.nth(0);
  await expect(cat).toHaveAttribute('data-mat-icon-name', 'cat');
  await expect(cat).toHaveAttribute('data-mat-icon-namespace', 'animals');
  // Extracted from a <symbol> via icon-set-extract.ts — converted to a
  // standalone <svg>, carrying the symbol's own viewBox, id stripped.
  await expect(cat.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(cat.locator('svg path')).toBeAttached();

  const dog = icons.nth(1);
  await expect(dog).toHaveAttribute('data-mat-icon-name', 'dog');
  await expect(dog).toHaveAttribute('data-mat-icon-namespace', 'animals');
  await expect(dog.locator('svg')).toBeAttached();

  // Different icons, not the same one duplicated.
  const catPath = await cat.locator('svg path').getAttribute('d');
  const dogPath = await dog.locator('svg path').getAttribute('d');
  expect(catPath).not.toBe(dogPath);
});

test('material-icon/svg-icon-literal — a registry-literal-backed icon (addSvgIconLiteral) resolves via svgIcon', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-icon-literal/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'star');
  const inner = icon.locator('svg');
  await expect(inner).toBeAttached();
  await expect(inner).toHaveAttribute('viewBox', '0 0 24 24');
  // Universal registry attributes still applied to a literal registration, same as a URL one.
  await expect(inner).toHaveAttribute('fit', '');
  await expect(inner).toHaveAttribute('focusable', 'false');
});

test('material-icon/svg-icon-switch — switching svgIcon after resume re-resolves on the client', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-icon-switch/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'star');
  const starPath = await icon.locator('svg path').getAttribute('d');
  expect(starPath).toBe('M12 2l10 20H2z');

  await page.getByRole('button', {name: 'Toggle'}).click();

  // Re-resolution is async (a real useComputed$ suspend/retry cycle) — wait
  // for the attribute to actually flip rather than asserting immediately.
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'heart');
  const heartPath = await icon.locator('svg path').getAttribute('d');
  expect(heartPath).toBe('M12 21s-8-5-8-12a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 7-8 12-8 12z');

  // Toggle back — proves it isn't a one-shot resolution; the SAME computed
  // keeps re-suspending/re-resolving on every subsequent change too.
  await page.getByRole('button', {name: 'Toggle'}).click();
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'star');
  await expect(icon.locator('svg path')).toHaveAttribute('d', 'M12 2l10 20H2z');
});

test('material-icon/svg-icon-missing — an unregistered svgIcon name renders no inner <svg> (logs, does not throw)', async ({
  request,
}) => {
  // Plain HTTP fetch (not `page.goto`): the resolution failure happens
  // during SSR, so the `console.error` call executes in the SERVER
  // process, not the browser — a `page.on('console')` listener would never
  // see it. The behaviorally important assertion is that the error is
  // swallowed (logged, not thrown): the page still renders a complete,
  // well-formed response (not a 500) with the rest of the route's content
  // intact around the empty icon.
  const response = await request.get(`${BASE_URL}/mat-icon/svg-icon-missing/`);
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('data-mat-icon-type="svg"');
  expect(html).toContain('data-mat-icon-name="does-not-exist"');
  // No <svg> child was ever inserted — the host element renders, but empty,
  // same as upstream's failure path (logs, renders nothing).
  expect(html).not.toMatch(/data-mat-icon-name="does-not-exist"[^>]*>\s*<svg/);
  // The rest of the page rendered fine around it — the error didn't abort SSR.
  expect(html).toContain('data-scenario-ready');
});
