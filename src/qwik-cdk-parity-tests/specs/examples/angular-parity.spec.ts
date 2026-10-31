import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * Each component's headline material.angular.dev example (see
 * `src/dev-app/qwik-parity/examples.ts`): the Angular side renders the real example component
 * unmodified; the Qwik side is a faithful port at the same route
 * (`src/qwik-cdk-dev-app/src/routes/<component>/<route>/`). Besides parity, these are the pages to
 * use for visually checking the port against documented usage.
 *
 * `EXAMPLE_STEPS` adds interactions for examples whose main behavior is behind one (opening a
 * dialog, menu, select, ...); everything else is compared as rendered.
 */
const EXAMPLES: Record<string, string[]> = {
  'mat-autocomplete': ['example'],
  'mat-badge': ['example'],
  'mat-bottom-sheet': ['example'],
  'mat-button': ['example'],
  'mat-button-toggle': ['example'],
  'mat-card': ['example'],
  'mat-checkbox': ['example'],
  'mat-chips': ['example'],
  'mat-datepicker': ['example'],
  'mat-dialog': ['example'],
  'mat-divider': ['example'],
  'mat-expansion': ['example'],
  'mat-form-field': ['example', 'example-input'],
  'mat-grid-list': ['example'],
  'mat-icon': ['example'],
  'mat-list': ['example'],
  'mat-menu': ['example'],
  'mat-paginator': ['example'],
  'mat-progress-bar': ['example'],
  'mat-progress-spinner': ['example'],
  'mat-radio': ['example'],
  'mat-select': ['example'],
  'mat-sidenav': ['example'],
  'mat-slide-toggle': ['example'],
  'mat-slider': ['example'],
  'mat-snack-bar': ['example'],
  'mat-sort': ['example'],
  'mat-stepper': ['example'],
  'mat-table': ['example'],
  'mat-tabs': ['example'],
  'mat-timepicker': ['example'],
  'mat-toolbar': ['example'],
  'mat-tooltip': ['example'],
  'mat-tree': ['example'],
};

const overlayRoot = '.cdk-overlay-container';

/** Clicks the `autocomplete-simple` example's input, opening its (single-root, inline) panel. */
const openAutocomplete: ParityStep = {
  name: 'click input (open)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] input').click();
    await page.waitForTimeout(150);
  },
};

/** Clicks the `snack-bar-overview` example's trigger, opening the snack bar. Mirrors
 *  specs/material-snack-bar/angular-parity.spec.ts's `open()`/`settleClick()`. */
const openSnackBar: ParityStep = {
  name: 'click "Show snack-bar"',
  run: async (page: Page) => {
    await page
      .locator('[data-parity-root]')
      .getByRole('button', {name: 'Show snack-bar', exact: true})
      .click();
    await page.waitForTimeout(50);
    await page.waitForFunction(
      () => {
        const containers = document.querySelectorAll('.mat-mdc-snack-bar-container');
        return containers.length === 1 && !containers[0].querySelector('[aria-hidden]');
      },
      undefined,
      {timeout: 5000},
    );
  },
};

/** Clicks the `bottom-sheet-overview` example's trigger, opening the bottom sheet. Mirrors
 *  specs/material-bottom-sheet/angular-parity.spec.ts's `clickTrigger()`. */
const openBottomSheet: ParityStep = {
  name: 'click "Open file"',
  run: async (page: Page) => {
    await page
      .locator('[data-parity-root]')
      .getByRole('button', {name: 'Open file', exact: true})
      .click();
    await page.waitForSelector('mat-bottom-sheet-container', {state: 'attached', timeout: 10_000});
  },
};

/**
 * Clicks the `menu-overview` example's trigger and waits for the panel to attach, with none of
 * them mid-animation. Mirrors specs/material-menu/angular-parity.spec.ts's `waitForPanelCount`.
 */
const openMenuStep: ParityStep = {
  name: 'click trigger (open)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button').click();
    await page.waitForFunction(
      () => {
        const panels = document.querySelectorAll('.mat-mdc-menu-panel');
        return (
          panels.length === 1 &&
          Array.from(panels).every(p => !p.classList.contains('mat-menu-panel-animating'))
        );
      },
      undefined,
      {timeout: 5000},
    );
  },
};

/**
 * Hovers the `tooltip-overview` example's trigger and waits for exactly one shown pane. Mirrors
 * specs/material-tooltip/angular-parity.spec.ts's `hover()`/`waitForTooltipShown`.
 */
const hoverTooltip: ParityStep = {
  name: 'hover trigger (show)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button').hover();
    await page.waitForFunction(
      () => {
        const panes = document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel');
        return panes.length === 1 && !!panes[0].querySelector('.mat-mdc-tooltip-show');
      },
      undefined,
      {timeout: 5000},
    );
  },
};

/**
 * Clicks the `select-overview` example's (modern) `<mat-select>` trigger and waits for its panel
 * — like `mat-autocomplete`, `MatSelect`'s popover lands inline inside `[data-parity-root]`, not
 * `.cdk-overlay-container` (see specs/material-select/angular-parity.spec.ts's own header), so
 * one default-root test is enough. The native `<select>` card has no comparable DOM-visible
 * panel (an OS-level control) and isn't exercised here.
 */
const openSelect: ParityStep = {
  name: 'click trigger (open)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] mat-select').click();
    await page.waitForFunction(
      () => {
        const panels = document.querySelectorAll('.mat-mdc-select-panel');
        return panels.length === 1 && !panels[0].classList.contains('mat-select-panel-exit');
      },
      undefined,
      {timeout: 5000},
    );
  },
};

/**
 * Clicks the `dialog-overview` example's "Pick one" trigger and waits for the dialog to settle
 * open. Mirrors specs/material-dialog/angular-parity.spec.ts's `clickTrigger()`/`settled`.
 */
const openDialog: ParityStep = {
  name: 'click "Pick one" (open)',
  run: async (page: Page) => {
    await page
      .locator('[data-parity-root]')
      .getByRole('button', {name: 'Pick one', exact: true})
      .click();
    await page.waitForSelector('mat-dialog-container', {state: 'attached', timeout: 10_000});
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('mat-dialog-container');
          return (
            !!el &&
            el.classList.contains('mdc-dialog--open') &&
            !el.classList.contains('mdc-dialog--opening')
          );
        },
        undefined,
        {timeout: 10_000},
      )
      .catch(() => {});
  },
};

/** Interactions per `<component>/<route>`, added alongside each Qwik port as needed. */
const EXAMPLE_STEPS: Record<string, {steps: ParityStep[]; rootSelector?: string}[]> = {
  'mat-autocomplete/example': [{steps: [openAutocomplete]}],
  'mat-select/example': [{steps: [openSelect]}],
  'mat-dialog/example': [{steps: [openDialog], rootSelector: overlayRoot}],
  'mat-snack-bar/example': [{steps: [openSnackBar], rootSelector: overlayRoot}],
  'mat-bottom-sheet/example': [{steps: [openBottomSheet], rootSelector: overlayRoot}],
  'mat-menu/example': [{steps: [openMenuStep]}, {steps: [openMenuStep], rootSelector: overlayRoot}],
  'mat-tooltip/example': [
    {steps: [hoverTooltip]},
    {steps: [hoverTooltip], rootSelector: overlayRoot},
  ],
};

test.describe('material.angular.dev examples — Angular DOM parity', () => {
  for (const [component, routes] of Object.entries(EXAMPLES)) {
    for (const route of routes) {
      test(`${component}/${route}`, ({browser}) =>
        expectMaterialParity(browser, {pinRoot: true, route: component, scenario: route}));
      for (const [i, extra] of (EXAMPLE_STEPS[`${component}/${route}`] ?? []).entries()) {
        test(`${component}/${route} (interaction ${i + 1})`, ({browser}) =>
          expectMaterialParity(browser, {
            pinRoot: true,
            route: component,
            scenario: route,
            steps: extra.steps,
            rootSelector: extra.rootSelector,
          }));
      }
    }
  }
});
