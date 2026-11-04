import {test, expect, type Page} from '@playwright/test';

/**
 * Functional (Qwik-only — no Angular comparison) coverage for `useMatProviders()` and the
 * per-setting provider hooks it fans out to. This is a port-only API surface (there's no
 * upstream DI token/wrapper-component to compare against — Angular's own hierarchical DI
 * already makes "provide one token, inherit the rest" the default), so there's no
 * `angular-parity.spec.ts` counterpart. Fixtures:
 * `src/qwik-cdk-dev-app/src/routes/mat-providers/{layout.tsx,basic,nested-override,dialog}`.
 *
 * Covers:
 *   - root-level `useMatProviders({formField, tooltip})` applies to descendants that set
 *     neither prop themselves (`basic`);
 *   - a nested component's own `useMatTooltipProvider()` call overrides tooltips in its own
 *     subtree while the root's `formField` config AND the root's tooltip config outside that
 *     subtree are both still unaffected (`nested-override`);
 *   - a dialog opened from a component under those providers sees them, via the SAME
 *     dialog/overlay context-forwarding individual provider hooks already get
 *     (`useMatContextSnapshot()`) (`dialog`);
 *   - a page with NO provider anywhere renders every default exactly as before — already
 *     covered by the existing full parity suite staying green (every other scenario's route has
 *     no `mat-providers` ancestor), not re-asserted here.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

const OUTLINE_SELECTOR = '[data-parity-root] .mat-mdc-form-field.mat-form-field-appearance-outline';
const FILL_SELECTOR = '[data-parity-root] .mat-mdc-form-field.mat-form-field-appearance-fill';
const TOOLTIP_PANE_SELECTOR = '.cdk-overlay-pane.mat-mdc-tooltip-panel';

async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(`${QWIK_URL}${path}`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

/** Exactly one shown tooltip pane — same technique `specs/material-tooltip/angular-parity.spec.ts`
 *  already established. */
function waitForTooltipShown(page: Page): Promise<unknown> {
  return page.waitForFunction(
    () => {
      const panes = document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel');
      return panes.length === 1 && !!panes[0].querySelector('.mat-mdc-tooltip-show');
    },
    undefined,
    {timeout: 5000},
  );
}

function tooltipPaneCount(page: Page): Promise<number> {
  return page.locator(TOOLTIP_PANE_SELECTOR).count();
}

test.describe('useMatProviders() — root-level config applies', () => {
  test('a form field with no appearance prop picks up the outline appearance', async ({page}) => {
    await openPage(page, '/mat-providers/basic/');
    await expect(page.locator(OUTLINE_SELECTOR)).toHaveCount(1);
    await expect(page.locator(FILL_SELECTOR)).toHaveCount(0);
  });

  test('a tooltip with no showDelay prop waits ~400ms, not the 0ms upstream default', async ({
    page,
  }) => {
    await openPage(page, '/mat-providers/basic/');
    await page.locator('.tooltip-trigger').hover();

    // Well under the configured 400ms — must NOT be shown yet.
    await page.waitForTimeout(150);
    expect(await tooltipPaneCount(page), 'not shown yet, mid-delay').toBe(0);

    await waitForTooltipShown(page);
    await expect(page.locator(TOOLTIP_PANE_SELECTOR)).toHaveCount(1);
  });
});

test.describe('a nested useMat*Provider() call overrides only its own subtree', () => {
  test('the form field outside the override still sees the root appearance', async ({page}) => {
    await openPage(page, '/mat-providers/nested-override/');
    await expect(page.locator(OUTLINE_SELECTOR)).toHaveCount(1);
  });

  test('the tooltip outside the override still waits ~400ms (root config, unaffected)', async ({
    page,
  }) => {
    await openPage(page, '/mat-providers/nested-override/');
    await page.locator('.tooltip-root').hover();

    await page.waitForTimeout(150);
    expect(await tooltipPaneCount(page), 'root tooltip: not shown yet, mid-delay').toBe(0);

    await waitForTooltipShown(page);
    await expect(page.locator(TOOLTIP_PANE_SELECTOR)).toHaveCount(1);

    await page.mouse.move(0, 0);
    await page.waitForFunction(
      () => document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel').length === 0,
    );
  });

  test('the overridden tooltip shows almost immediately (0ms), not after the root 400ms delay', async ({
    page,
  }) => {
    await openPage(page, '/mat-providers/nested-override/');
    await page.locator('.tooltip-override').hover();
    // Generous for a 0ms-delay show, but far short of the root's 400ms — if this hook call had
    // leaked the root's config instead of overriding it, this would still find zero panes.
    await page.waitForFunction(
      () => {
        const panes = document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel');
        return panes.length === 1 && !!panes[0].querySelector('.mat-mdc-tooltip-show');
      },
      undefined,
      {timeout: 150},
    );
    await expect(page.locator(TOOLTIP_PANE_SELECTOR)).toHaveCount(1);
  });
});

test.describe('dialog/overlay content sees the combined useMatProviders() config', () => {
  test('a form field inside a dialog opened under useMatProviders() picks up the outline appearance', async ({
    page,
  }) => {
    await openPage(page, '/mat-providers/dialog/');
    await page.locator('.open-button').click();

    const formField = page.locator('mat-dialog-container mat-form-field');
    await expect(formField).toBeVisible();
    await expect(formField).toHaveClass(/mat-form-field-appearance-outline/);
    await expect(formField).not.toHaveClass(/mat-form-field-appearance-fill/);
  });
});
