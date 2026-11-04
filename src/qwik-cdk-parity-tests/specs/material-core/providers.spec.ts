import {test, expect, type Page} from '@playwright/test';

/**
 * Functional (Qwik-only — no Angular comparison) coverage for `useMatProviders()` and the
 * per-setting provider hooks it fans out to. This is a port-only API surface (there's no
 * upstream DI token/wrapper-component to compare against — Angular's own hierarchical DI
 * already makes "provide one token, inherit the rest" the default), so there's no
 * `angular-parity.spec.ts` counterpart. Fixtures:
 * `src/qwik-cdk-dev-app/src/routes/mat-providers/{layout.tsx,basic,nested-override,dialog}`.
 *
 * The tooltip assertions use a `tooltipClass` marker rather than timing: the tooltip ELEMENT is
 * created as soon as the trigger is hovered and only gains `mat-mdc-tooltip-show` after the show
 * delay (same as upstream), so checking a class is the direct, timing-free signal.
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
const TOOLTIP_SURFACE_SELECTOR = '.cdk-overlay-pane .mat-mdc-tooltip';

async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(`${QWIK_URL}${path}`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

/** Exactly one shown tooltip surface — same technique
 *  `specs/material-tooltip/angular-parity.spec.ts` already established (there, on the
 *  `.cdk-overlay-pane.mat-mdc-tooltip-panel` wrapper one level up — `.mat-mdc-tooltip` is its
 *  one child, carrying the custom `tooltipClass` this spec reads). */
function waitForTooltipShown(page: Page): Promise<unknown> {
  return page.waitForFunction(
    () => {
      const surfaces = document.querySelectorAll('.cdk-overlay-pane .mat-mdc-tooltip');
      return surfaces.length === 1 && surfaces[0].classList.contains('mat-mdc-tooltip-show');
    },
    undefined,
    {timeout: 5000},
  );
}

async function hoverAndGetShownTooltipClass(page: Page, selector: string): Promise<string> {
  await page.locator(selector).hover();
  await waitForTooltipShown(page);
  return page
    .locator(TOOLTIP_SURFACE_SELECTOR)
    .first()
    .evaluate(el => el.className);
  // Caller moves the mouse away to clean up between assertions in the same test.
}

test.describe('useMatProviders() — root-level config applies', () => {
  test('a form field with no appearance prop picks up the outline appearance', async ({page}) => {
    await openPage(page, '/mat-providers/basic/');
    await expect(page.locator(OUTLINE_SELECTOR)).toHaveCount(1);
    await expect(page.locator(FILL_SELECTOR)).toHaveCount(0);
  });

  test('a tooltip with no tooltipClass prop picks up the root provider class', async ({page}) => {
    await openPage(page, '/mat-providers/basic/');
    const className = await hoverAndGetShownTooltipClass(page, '.tooltip-trigger');
    expect(className).toContain('root-tooltip-marker');
  });
});

test.describe('a nested useMat*Provider() call overrides only its own subtree', () => {
  test('the form field outside the override still sees the root appearance', async ({page}) => {
    await openPage(page, '/mat-providers/nested-override/');
    await expect(page.locator(OUTLINE_SELECTOR)).toHaveCount(1);
  });

  test('the tooltip outside the override still uses the root provider class (unaffected)', async ({
    page,
  }) => {
    await openPage(page, '/mat-providers/nested-override/');
    const className = await hoverAndGetShownTooltipClass(page, '.tooltip-root');
    expect(className).toContain('root-tooltip-marker');
    expect(className).not.toContain('override-tooltip-marker');
  });

  test('the overridden tooltip uses its own class, not the root provider class', async ({page}) => {
    await openPage(page, '/mat-providers/nested-override/');
    const className = await hoverAndGetShownTooltipClass(page, '.tooltip-override');
    expect(className).toContain('override-tooltip-marker');
    expect(className).not.toContain('root-tooltip-marker');
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
