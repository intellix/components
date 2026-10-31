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
  'mat-datepicker/example': [{steps: [openDatepicker], clockDate: DATEPICKER_CLOCK}],
  'mat-timepicker/example': [{steps: [openTimepicker]}],
  'mat-expansion/example': [{steps: [settleExpansionPanels, clickExpansionHeader(1)]}],
  'mat-paginator/example': [{steps: [clickNextPage]}],
  'mat-sort/example': [{steps: [clickSortHeader(0)]}],
  'mat-stepper/example': [{steps: [clickStepperNext]}],
  'mat-tabs/example': [{steps: [clickTab(1)]}],
  'mat-tree/example': [{steps: [clickTreeToggle('Fruit')]}],
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
            clockDate: extra.clockDate,
          }));
      }
    }
  }
});
