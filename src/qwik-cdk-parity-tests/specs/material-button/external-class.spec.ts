import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Upstream's button host classes are owned by Angular's renderer, FocusMonitor and
 * MatRippleLoader, which all `classList.add/remove` only their own classes — so a class another
 * script toggles on the host survives hover, focus and blur. Qwik writes the whole `class`
 * attribute whenever the component re-renders (and the first re-render after resume diffs against
 * the live DOM), so hover/focus must not re-render the host: a re-render put a consumer class
 * that a script had removed straight back (Winz's CMS "Meer tonen"/"Minder tonen" toggle).
 */
test('material-button — classes edited from outside survive hover, focus and blur', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/external-class/`);
  await page.waitForSelector('[data-scenario-ready]');
  const hosts = page.locator('[data-parity-root] > :is(button, a)');
  const count = await hosts.count();
  expect(count).toBe(5);

  for (let i = 0; i < count; i++) {
    const host = hosts.nth(i);
    await expect(host).toHaveClass(/\bext-initial\b/);
    await host.evaluate(el => {
      el.classList.remove('ext-initial');
      el.classList.add('ext-added');
    });

    await host.hover();
    await expect(host.locator('.mat-ripple')).toHaveCount(1);
    await expect(host).not.toHaveAttribute('mat-ripple-loader-uninitialized');
    await host.click();
    await expect(host).toHaveClass(/\bcdk-focused\b/);
    await expect(host).toHaveClass(/\bcdk-mouse-focused\b/);
    await page.locator('[data-outside]').click();
    await expect(host).not.toHaveClass(/\bcdk-focused\b/);
    await expect(host).not.toHaveClass(/\bcdk-mouse-focused\b/);

    const cls = (await host.getAttribute('class')) ?? '';
    expect(cls, `host ${i}`).not.toMatch(/\bext-initial\b/);
    expect(cls, `host ${i}`).toMatch(/\bext-added\b/);
  }
});

test('material-button — keyboard focus classes still apply and clear', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/external-class/`);
  await page.waitForSelector('[data-scenario-ready]');
  const first = page.locator('[data-parity-root] > button').first();
  await page.locator('[data-parity-root]').evaluate(root => {
    const sentinel = document.createElement('button');
    root.before(sentinel);
    sentinel.focus();
  });
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await expect(first).toHaveClass(/\bcdk-keyboard-focused\b/);
  await expect(first).toHaveClass(/\bcdk-focused\b/);
  await page.keyboard.press('Tab');
  await expect(first).not.toHaveClass(/\bcdk-focused\b/);
  await expect(first).not.toHaveClass(/\bcdk-keyboard-focused\b/);
});
