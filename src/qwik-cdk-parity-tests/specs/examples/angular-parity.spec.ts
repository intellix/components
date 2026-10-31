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
 *
 * Known pre-existing failure: `mat-slide-toggle/example`. `slide-toggle-overview-example.html`
 * wraps each `<mat-slide-toggle>` in a `<p>` — and `<MatSlideToggle>` renders a `<div
 * mat-internal-form-field>` inside it (required DOM, shared with checkbox/radio). Per the HTML5
 * parsing algorithm, a `<div>` start tag implicitly closes any open `<p>` in scope, however
 * deeply nested — confirmed with a minimal repro
 * (`page.setContent('<p><mat-slide-toggle><div>x</div></mat-slide-toggle></p>')` yields
 * `<p><mat-slide-toggle></mat-slide-toggle></p><div>x</div><p></p>`, browser-verified, not a
 * Qwik bug). Angular's dev-app is pure CSR — it builds this same tree via `Renderer2`
 * createElement/appendChild calls, never by parsing an HTML string — so it never hits this
 * rule and keeps the real `<p><mat-slide-toggle><div>...` nesting. Qwik SSRs real HTML text
 * that the browser then parses, so it always hits it. There is no qwik-material fix for this
 * short of never SSRing `<MatSlideToggle>`'s internals (a drastic, unrelated change that would
 * risk every other passing `/mat-slide-toggle/*` scenario) — same category as the pre-existing
 * `mat-timepicker` `min-max` failure this suite already carries.
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

/** `badge-overview`'s "Hide" button toggles `.mat-badge-hidden` on its own badge via
 * `[matBadgeHidden]`/`toggleBadgeVisibility()` — the one behavior in this batch that's
 * actually behind a click rather than visible on first render. */
const clickHideButton: ParityStep = {
  name: 'click Hide button',
  run: async (page: Page) => {
    await page.getByRole('button', {name: 'Hide'}).click();
  },
};

/** `checkbox-overview`'s parent checkbox drives `indeterminate` on itself and `checked` on
 * every subtask — exercises the signal/computed wiring, not just a static render. */
const clickParentCheckbox: ParityStep = {
  name: 'click parent checkbox',
  run: async (page: Page) => {
    await page.getByRole('checkbox', {name: 'Parent task'}).click();
  },
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
  'mat-badge/example': [{steps: [clickHideButton]}],
  'mat-checkbox/example': [{steps: [clickParentCheckbox]}],
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

/**
 * Per-`<component>/<route>` `ignoreAttrs` (see `ParityScenario.ignoreAttrs`'s doc comment for
 * why this is scenario-scoped, not global): real, unmodified upstream examples — unlike the
 * hand-authored `qwik-parity` mirror scenarios every OTHER spec in this suite compares against
 * — frequently bind a literal input with plain attribute syntax (`value="40"`,
 * `matBadgeOverlap="false"`) rather than `[prop]="…"`, which Angular's compiler echoes onto the
 * compiled host element verbatim in addition to using it to initialize the input. A Qwik
 * component's JSX prop has no "static vs. bound" distinction to replicate this from.
 * - `mat-badge/example`: `matBadgeOverlap`/`matBadgeSize`/`matBadgePosition` are all written as
 *   plain attributes in `badge-overview-example.html` (`matbadge` itself is already in the
 *   global `CONSUMER_SELECTOR_ATTRS`, these three value-carrying aliases are not).
 * - `mat-progress-bar/example`: `progress-bar-determinate-example.html` has
 *   `<mat-progress-bar mode="determinate" value="40">` — `value` is too generic a name to add
 *   to the global ignore list (native `<input value>` compares meaningfully elsewhere in this
 *   suite), so it's ignored for just this one scenario.
 * - `mat-grid-list/example`: `<mat-grid-list cols="2" rowHeight="2:1">` echoes `rowheight`.
 * - `mat-radio/example`: `<mat-radio-button value="1">`/`value="2"` echo `value` (same
 *   genericity concern as progress-bar's).
 * - `mat-button-toggle/example`: `<mat-button-toggle-group name="fontStyle">` and each
 *   `<mat-button-toggle value="bold">` etc. echo `name`/`value`.
 * - `mat-card/example`: `<mat-card appearance="outlined">` echoes `appearance`.
 * - `mat-button/example`: the Extended FAB's "Link" variant
 *   (`<a matFab extended routerLink=".">`) echoes `extended`/`routerlink` (the latter an
 *   Angular Router directive attribute with no Qwik-port equivalent at all) — and, in this
 *   `loadExample()`-sandboxed harness specifically (no configured `Router`), Angular's
 *   `RouterLink` resolves to NO `href` attribute at all (confirmed live), unlike a real
 *   material.angular.dev page. The port renders `href="."` instead (a real, working link) and
 *   `href` is ignored for this one scenario only — the other 5 `href`-bearing plain `matButton`
 *   links earlier in the same scenario already compare correctly without this suppression.
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'mat-badge/example': ['matbadgeoverlap', 'matbadgesize', 'matbadgeposition'],
  'mat-progress-bar/example': ['value'],
  'mat-grid-list/example': ['rowheight'],
  'mat-radio/example': ['value'],
  'mat-button-toggle/example': ['name', 'value'],
  'mat-card/example': ['appearance'],
  'mat-button/example': ['extended', 'routerlink', 'href'],
};

/**
 * Known, documented gaps (see src/qwik-cdk-dev-app/EXAMPLES.md), run as expected failures so the
 * suite stays green but flags them if they start passing.
 */
const EXPECTED_FAILURES: Record<string, string> = {
  'mat-slide-toggle/example':
    "the example wraps <mat-slide-toggle> in <p>; HTML parsing of Qwik's SSR output closes the <p> " +
    "at the toggle's inner <div>, which Angular's client-rendered DOM never hits",
};

test.describe('material.angular.dev examples — Angular DOM parity', () => {
  for (const [component, routes] of Object.entries(EXAMPLES)) {
    for (const route of routes) {
      const ignoreAttrs = EXAMPLE_IGNORE_ATTRS[`${component}/${route}`];
      test(`${component}/${route}`, ({browser}) => {
        const gap = EXPECTED_FAILURES[`${component}/${route}`];
        test.fail(gap !== undefined, gap);
        return expectMaterialParity(browser, {
          pinRoot: true,
          route: component,
          scenario: route,
          ignoreAttrs,
        });
      });
      for (const [i, extra] of (EXAMPLE_STEPS[`${component}/${route}`] ?? []).entries()) {
        test(`${component}/${route} (interaction ${i + 1})`, ({browser}) =>
          expectMaterialParity(browser, {
            pinRoot: true,
            route: component,
            scenario: route,
            steps: extra.steps,
            rootSelector: extra.rootSelector,
            ignoreAttrs,
          }));
      }
    }
  }
});
