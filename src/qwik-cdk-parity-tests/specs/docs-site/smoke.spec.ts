import {test, expect, type Page} from '@playwright/test';

/**
 * Smoke suite for the qwik-material docs site (`src/qwik-material-docs`), built as a static site
 * and previewed on port 4195 (`pnpm -C src/qwik-material-docs preview`, after
 * `pnpm -C src/qwik-material-docs build`). Not a DOM-parity suite (that's `specs/examples` et al.,
 * comparing against the real Angular dev-app) — this just asserts every page renders with no
 * console errors, and that a page claiming a live example actually shows one.
 *
 * Override the base URL with `DOCS_URL` (defaults to `http://localhost:4195`).
 */
const BASE_URL = process.env['DOCS_URL'] ?? 'http://localhost:4195';

const COMPONENT_IDS = [
  'autocomplete', 'badge', 'bottom-sheet', 'button', 'button-toggle', 'card', 'checkbox', 'chips',
  'datepicker', 'dialog', 'divider', 'expansion', 'form-field', 'grid-list', 'icon', 'input',
  'list', 'menu', 'paginator', 'progress-bar', 'progress-spinner', 'radio', 'select', 'sidenav',
  'slide-toggle', 'slider', 'snack-bar', 'sort', 'stepper', 'table', 'tabs', 'timepicker',
  'toolbar', 'tooltip', 'tree',
];
const CDK_IDS = [
  'a11y', 'accordion', 'bidi', 'coercion', 'dialog', 'keycodes', 'layout', 'overlay', 'platform',
  'portal', 'stepper', 'table', 'tree',
];
const GUIDE_IDS = [
  'getting-started', 'theming', 'composing-directives', 'using-with-formisch',
  'migrating-from-angular-material',
];
/** Every component's Examples tab (and the three reference components' Overview tab) embeds a
 *  live, ported example — see `src/qwik-material-docs/src/data/examples-map.ts`. */
const REFERENCE_COMPONENTS_WITH_LIVE_OVERVIEW_EXAMPLE = ['button', 'form-field', 'select'];

async function expectNoConsoleErrors(page: Page, url: string) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    // Third-party subresources aren't the site's errors: tab-group-preserve-content's YouTube
    // embed loads doubleclick ad scripts, which ad-filtering networks fail with a cert error.
    const source = msg.location().url;
    if (
      msg.text().startsWith('Failed to load resource') &&
      source &&
      new URL(source).origin !== new URL(BASE_URL).origin
    ) {
      return;
    }
    errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(String(err)));

  const response = await page.goto(url, {waitUntil: 'networkidle'});
  expect(response?.status(), `${url} status`).toBe(200);
  // Let any client-side resume/hydration settle.
  await page.waitForTimeout(150);

  expect(errors, `console errors on ${url}:\n${errors.join('\n')}`).toEqual([]);
}

test.describe('docs site smoke', () => {
  test('homepage', async ({page}) => {
    await expectNoConsoleErrors(page, `${BASE_URL}/`);
    await expect(page.locator('.docs-hero h1')).toHaveText('qwik-material');
  });

  test('components index', async ({page}) => {
    await expectNoConsoleErrors(page, `${BASE_URL}/components/`);
    await expect(page.locator('.docs-card-link')).toHaveCount(35);
  });

  test('cdk index', async ({page}) => {
    await expectNoConsoleErrors(page, `${BASE_URL}/cdk/`);
    await expect(page.locator('.docs-card-link')).toHaveCount(13);
  });

  test('guide index', async ({page}) => {
    await expectNoConsoleErrors(page, `${BASE_URL}/guide/`);
    await expect(page.locator('.docs-card-link')).toHaveCount(5);
  });

  for (const id of COMPONENT_IDS) {
    test(`component: ${id} / overview`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/components/${id}/overview/`);
      await expect(page.locator('.docs-page-header h1')).toHaveCount(1);
      if (REFERENCE_COMPONENTS_WITH_LIVE_OVERVIEW_EXAMPLE.includes(id)) {
        await expect(page.locator('.docs-example').first()).toBeVisible();
      }
    });

    test(`component: ${id} / api`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/components/${id}/api/`);
    });

    test(`component: ${id} / examples`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/components/${id}/examples/`);
      // Every component's headline example is ported — the Examples tab should never show the
      // "not yet ported" placeholder.
      await expect(page.locator('.docs-example-placeholder')).toHaveCount(0);
      await expect(page.locator('.docs-example-preview')).toBeVisible();
    });
  }

  for (const id of CDK_IDS) {
    test(`cdk: ${id} / overview`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/cdk/${id}/overview/`);
    });

    test(`cdk: ${id} / api`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/cdk/${id}/api/`);
    });
  }

  // The bare component/CDK URLs must land on the Overview tab, not the homepage fallback.
  for (const [section, id] of [['components', 'button'], ['components', 'tree'], ['cdk', 'overlay']]) {
    test(`${section}: ${id} / index redirects to overview`, async ({page}) => {
      await page.goto(`${BASE_URL}/${section}/${id}/`);
      await expect(page).toHaveURL(`${BASE_URL}/${section}/${id}/overview/`);
      await expect(page.locator('.docs-page-header h1')).toHaveCount(1);
    });
  }

  for (const id of GUIDE_IDS) {
    test(`guide: ${id}`, async ({page}) => {
      await expectNoConsoleErrors(page, `${BASE_URL}/guide/${id}/`);
      await expect(page.locator('.docs-prose')).toBeVisible();
    });
  }
});
