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

const SETTLE_MS = 150;

// ---------------------------------------------------------------------------
// mat-datepicker/example (datepicker-overview) — opening the calendar. No `startAt`/value
// upstream, so the calendar opens showing the CURRENT month — deterministic here only via
// Playwright clock emulation (see lib/material-parity.ts's `clockDate` / README), reusing
// specs/material-datepicker/angular-parity.spec.ts's own open-wait pattern (`waitOpen`).
//
// Only ONE interaction entry (default root: field/toggle), not also the overlay-container root
// the calendar content attaches to. CONFIRMED LIVE: `page.clock.setFixedTime()` (needed for the
// deterministic "today" above) makes Angular's OWN real `FocusMonitor`-driven classification of
// the calendar's initial auto-focus report `cdk-program-focused` instead of its normal
// `cdk-mouse-focused` for a toggle-click open (reproduced with/without clock emulation,
// identical click, on the SAME unmodified Angular page — a Playwright-clock-emulation artifact
// on Angular's real timing-sensitive CDK code, not a Qwik-side defect: this port's own
// `mat-calendar.tsx` hardcodes `'mouse'` for every click-driven auto-focus, by design — see that
// file's own doc comment — so it can never follow Angular's clock-confused drift here). No
// combination of clock emulation + a real toggle click avoids this (the calendar's displayed
// month is computed fresh at OPEN time, so the clock must still be frozen at the moment of the
// click — resuming real time first would just show the real current month again). The default
// root's own comparison (this interaction) is unaffected (the toggle's `focusVia(el, 'program')`
// is an explicit, non-timing-dependent call) and the base, non-interaction comparison of both
// roots is unaffected too (calendar never open there).
// ---------------------------------------------------------------------------
const DATEPICKER_CLOCK = new Date(2024, 0, 15, 10, 0, 0);

const openDatepicker: ParityStep = {
  name: 'open calendar via toggle',
  run: async (page: Page) => {
    await page.locator('mat-datepicker-toggle button').click();
    await page.waitForSelector('.mat-datepicker-content', {state: 'attached', timeout: 5000});
    await page
      .waitForFunction(
        () => !document.querySelector('.mat-datepicker-content.mat-datepicker-content-animating'),
        undefined,
        {timeout: 2000},
      )
      .catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// mat-timepicker/example (timepicker-overview) — opening the panel. Unlike the datepicker, the
// timepicker panel is positioned `inline` (a plain DOM sibling inside `<mat-form-field>`, fully
// inside `[data-parity-root]` — confirmed live by specs/material-timepicker/angular-parity.spec.ts's
// own "ONE ROOT ONLY" header note), so this needs only the default root, no overlay-container
// entry. No clock emulation needed either: the option list is a fixed set of time-of-day strings
// (`generateOptions`), never "today"-relative.
// ---------------------------------------------------------------------------
const openTimepicker: ParityStep = {
  name: 'open panel via toggle',
  run: async (page: Page) => {
    await page.locator('mat-timepicker-toggle button').click();
    await page.waitForFunction(
      () => document.querySelectorAll('.mat-timepicker-panel').length === 1,
      undefined,
      {timeout: 5000},
    );
  },
};

// ---------------------------------------------------------------------------
// mat-expansion/example (expansion-overview) — expanding the second ("Self aware") panel, whose
// description text flips between "closed"/"open". Reuses
// specs/material-expansion/angular-parity.spec.ts's own `settle` step (waits out the one-time,
// ~300ms-delayed `.mat-expansion-panel-animations-enabled` class so the very first click doesn't
// race it) and `clickHeader` pattern (force-click — a header's own ripple/focus-indicator
// elements can intercept the click target otherwise).
// ---------------------------------------------------------------------------
const settleExpansionPanels: ParityStep = {
  name: 'settle (post-init animation class)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.mat-expansion-panel')).every(el =>
          el.classList.contains('mat-expansion-panel-animations-enabled'),
        ),
      undefined,
      {timeout: 3000},
    );
  },
};

const clickExpansionHeader = (index: number): ParityStep => ({
  name: `click header ${index}`,
  run: async (page: Page) => {
    await page.locator('.mat-expansion-panel-header').nth(index).click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

// ---------------------------------------------------------------------------
// mat-paginator/example (paginator-overview) — paging forward. Reuses
// specs/material-paginator/angular-parity.spec.ts's `clickNav` pattern (mouse moved away
// afterwards, avoiding a mid-hover-tooltip finishing state).
// ---------------------------------------------------------------------------
const clickNextPage: ParityStep = {
  name: 'click next page',
  run: async (page: Page) => {
    await page.locator('.mat-mdc-paginator-navigation-next').click();
    await page.mouse.move(0, 0);
  },
};

// ---------------------------------------------------------------------------
// mat-sort/example (sort-overview) — sorting the "Dessert (100g)" column ascending. Reuses
// specs/material-sort/angular-parity.spec.ts's `th[mat-sort-header]` locator pattern.
// ---------------------------------------------------------------------------
const clickSortHeader = (index: number): ParityStep => ({
  name: `click sort header ${index}`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] th[mat-sort-header]').nth(index).click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

// ---------------------------------------------------------------------------
// mat-stepper/example (stepper-overview) — moving from step 1 to step 2 via the "Next" button.
// `isLinear` starts `false` upstream, so this needs no form value filled first (linear's
// control-validity gate only applies when linear — see qwik-cdk/stepper's `canMoveToIndex`).
// Reuses specs/material-stepper/angular-parity.spec.ts's scoped `.mat-horizontal-stepper-content-
// current button.mat-stepper-next` locator (several `.mat-stepper-next` buttons exist at once,
// one per step's always-rendered content — only the CURRENT step's is interactable).
// ---------------------------------------------------------------------------
const clickStepperNext: ParityStep = {
  name: 'click Next',
  run: async (page: Page) => {
    await page
      .locator('[data-parity-root] .mat-horizontal-stepper-content-current button.mat-stepper-next')
      .click();
    await page.waitForTimeout(SETTLE_MS);
  },
};

// ---------------------------------------------------------------------------
// mat-tabs/example (tab-group-basic) — switching to the "Second" tab. Reuses
// specs/material-tabs/angular-parity.spec.ts's `.mdc-tab` locator + animation-settle wait.
// ---------------------------------------------------------------------------
const waitForTabSwitchSettled = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => !document.querySelector('[data-parity-root] .mat-tab-body-animating'),
    undefined,
    {timeout: 5000},
  );
  await page.waitForTimeout(300);
};

const clickTab = (index: number): ParityStep => ({
  name: `click tab ${index}`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] mat-tab-group').locator('.mdc-tab').nth(index).click();
    await waitForTabSwitchSettled(page);
  },
});

// ---------------------------------------------------------------------------
// mat-tree/example (tree-flat-child-accessor-overview) — expanding the "Fruit" node. Reuses
// specs/material-tree/angular-parity.spec.ts's `button[aria-label="Toggle ${label}"]` pattern.
// ---------------------------------------------------------------------------
const clickTreeToggle = (label: string): ParityStep => ({
  name: `click toggle "${label}"`,
  run: async (page: Page) => {
    await page.locator(`button[aria-label="Toggle ${label}"]`).click();
    await page.waitForTimeout(SETTLE_MS);
  },
});

/** Interactions per `<component>/<route>`, added alongside each Qwik port as needed. */
const EXAMPLE_STEPS: Record<
  string,
  {steps: ParityStep[]; rootSelector?: string; clockDate?: Date | number | string}[]
> = {
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
  'mat-datepicker/example': [{steps: [openDatepicker], clockDate: DATEPICKER_CLOCK}],
  'mat-timepicker/example': [{steps: [openTimepicker]}],
  'mat-expansion/example': [{steps: [settleExpansionPanels, clickExpansionHeader(1)]}],
  'mat-paginator/example': [{steps: [clickNextPage]}],
  'mat-sort/example': [{steps: [clickSortHeader(0)]}],
  'mat-stepper/example': [{steps: [clickStepperNext]}],
  'mat-tabs/example': [{steps: [clickTab(1)]}],
  'mat-tree/example': [{steps: [clickTreeToggle('Fruit')]}],
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
  // `<mat-expansion-panel hideToggle>` (bare attribute) echoes `hidetoggle`.
  'mat-expansion/example': ['hidetoggle'],
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
            clockDate: extra.clockDate,
            ignoreAttrs,
          }));
      }
    }
  }
});
