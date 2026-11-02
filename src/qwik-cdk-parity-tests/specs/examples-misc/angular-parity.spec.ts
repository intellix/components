import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const overlayRoot = '.cdk-overlay-container';

/**
 * Phase 2 ("docs site batch C") guide-embedded examples that AREN'T a component's headline
 * example (those live in `specs/examples/angular-parity.spec.ts`'s `EXAMPLES`). Each one is a
 * real, unmodified material.angular.dev example, rendered:
 *   - Angular: `http://localhost:4201/qwik-parity/examples/<example-id>` — the GENERIC
 *     `examples/:exampleId` route (`src/dev-app/qwik-parity/examples.ts`), which loads any
 *     upstream example by id via `loadExample()` (`@angular/components-examples/private`). No
 *     Angular-side change needed per example.
 *   - Qwik: `src/qwik-cdk-dev-app/src/routes/examples/<example-id>/index.tsx`, a thin wrapper
 *     around the matching `src/qwik-material-examples/<pkg>/<example-id>` module.
 *
 * `route: 'examples'` + `scenario: '<example-id>'` therefore compares
 * `.../qwik-parity/examples/<example-id>` against `.../examples/<example-id>/` — same URL-join
 * convention `specs/examples` uses for `<component>/<route>`, just with a literal `examples`
 * route segment shared by every entry here instead of a per-component one.
 */
const EXAMPLE_IDS = [
  'button-disabled-interactive',
  'progress-bar-indeterminate',
  'progress-bar-buffer',
  'progress-bar-query',
  'button-toggle-mode',
  'button-toggle-appearance',
  'slider-range',
  'slider-formatting',
  'snack-bar-annotated-component',
  'tooltip-position',
  'tooltip-delay',
  'tooltip-modified-defaults',
  'tooltip-manual',
];

/**
 * Clicks the `snack-bar-annotated-component` example's "Pizza party" trigger, opening the
 * annotated custom snack bar. Mirrors `specs/examples/angular-parity.spec.ts`'s own
 * `openSnackBar` (same button-role wait + settle pattern). The button's accessible name is its
 * `aria-label` ("Show an example snack-bar"), not its "Pizza party" text content — `aria-label`
 * always wins accessible-name computation when present.
 */
const openPizzaPartySnackBar: ParityStep = {
  name: 'click "Pizza party"',
  run: async (page: Page) => {
    await page
      .locator('[data-parity-root]')
      .getByRole('button', {name: 'Show an example snack-bar', exact: true})
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

/**
 * Hovers the `tooltip-position`/`tooltip-delay`/`tooltip-modified-defaults` example's "Action"
 * trigger and waits for exactly one shown pane. Mirrors `specs/examples/angular-parity.spec.ts`'s
 * own `hoverTooltip`.
 */
const hoverActionButton: ParityStep = {
  name: 'hover trigger (show)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button').first().hover();
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
 * NOT exercised with an interaction step: `tooltip-manual`'s whole premise is upstream's
 * imperative `show()`/`hide()`/`toggle()` template-ref API, which this port's `useMatTooltip()`
 * doesn't expose at all (only `hostProps` — hover/focus/touch-driven). Clicking the example's
 * "show"/"hide"/"toggle" buttons is a documented no-op here (see tooltip-manual/index.tsx's own
 * header comment) vs. a real overlay open on Angular — an asymmetric overlay-container
 * presence/absence that this harness's generic retry-then-compare loop isn't a good fit for
 * (it polls expecting eventual convergence, not a stable, permanent count mismatch). The base,
 * no-interaction render below already covers everything this port CAN demonstrate; the gap
 * itself is documented in code and in the Tooltip overview's "Angular → Qwik notes".
 */
const EXAMPLE_STEPS: Record<
  string,
  {steps: ParityStep[]; rootSelector?: string; expectedFailure?: string}[]
> = {
  'snack-bar-annotated-component': [{steps: [openPizzaPartySnackBar], rootSelector: overlayRoot}],
  'tooltip-position': [{steps: [hoverActionButton]}, {steps: [hoverActionButton], rootSelector: overlayRoot}],
  'tooltip-delay': [{steps: [hoverActionButton]}, {steps: [hoverActionButton], rootSelector: overlayRoot}],
  'tooltip-modified-defaults': [
    {steps: [hoverActionButton]},
    {steps: [hoverActionButton], rootSelector: overlayRoot},
  ],
};

/**
 * Per-example `ignoreAttrs` (see `ParityScenario.ignoreAttrs`'s doc comment, and
 * `specs/examples/angular-parity.spec.ts`'s own `EXAMPLE_IGNORE_ATTRS` for the general pattern):
 * a real, unmodified upstream example frequently writes a directive input as a plain,
 * non-bracket template attribute (`disabledInteractive`, not `[disabledInteractive]`), which
 * Angular's compiler echoes onto the compiled host verbatim in addition to using it to
 * initialize the input. A Qwik component's JSX prop has no such distinction to replicate it from.
 * - `button-disabled-interactive`: `<button matButton="elevated" disabled disabledInteractive
 *   matTooltip="...">` writes `disabledInteractive` bare.
 * - `button-toggle-mode`/`button-toggle-appearance`: `<mat-button-toggle-group name="...">`
 *   and each `<mat-button-toggle value="...">` echo `name`/`value` (same genericity concern as
 *   `specs/examples`'s own `mat-button-toggle/example` entry). `button-toggle-mode`'s multi-select
 *   group also writes bare `multiple`, echoing `multiple`.
 * - `slider-range`: `<mat-slider min="200" max="500">` echoes `min`/`max`.
 * - `slider-formatting`: `<mat-slider min="0" max="100000" step="1000" showTickMarks discrete>`
 *   echoes `min`/`max`/`step`/`showtickmarks`/`discrete`.
 * - `tooltip-manual`: `<button matButton="elevated" matTooltipPosition="right" ...>` writes
 *   `matTooltipPosition` bare.
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'button-disabled-interactive': ['disabledinteractive'],
  'button-toggle-mode': ['name', 'value', 'multiple'],
  'button-toggle-appearance': ['name', 'value'],
  'slider-range': ['min', 'max'],
  'slider-formatting': ['min', 'max', 'step', 'showtickmarks', 'discrete'],
  'tooltip-manual': ['mattooltipposition'],
};

/**
 * Known, documented gaps — run as expected failures so the suite stays green but flags them if
 * they start passing (mirrors `specs/examples/angular-parity.spec.ts`'s own `EXPECTED_FAILURES`).
 */
const EXPECTED_FAILURES: Record<string, string> = {
  'button-toggle-appearance':
    "this port's MatButtonToggleGroup/MatButtonToggle have no appearance prop at all (only the " +
    "modern 'standard' appearance is implemented — see qwik-material/button-toggle/SYNC.md's " +
    "'Deviations from upstream' §6); the example's second ('Legacy appearance') section can only " +
    'render with the standard appearance, which never matches upstream\'s distinctly-templated ' +
    "legacy group (no mat-pseudo-checkbox, different ripple-trigger wiring, a separate CSS class " +
    'ladder) — a real, large unported feature, not a fixable bug.',
};

test.describe('qwik-material-examples (non-headline) — Angular DOM parity', () => {
  for (const exampleId of EXAMPLE_IDS) {
    test(exampleId, ({browser}) => {
      const gap = EXPECTED_FAILURES[exampleId];
      test.fail(gap !== undefined, gap);
      return expectMaterialParity(browser, {
        pinRoot: true,
        route: 'examples',
        scenario: exampleId,
        ignoreAttrs: EXAMPLE_IGNORE_ATTRS[exampleId],
      });
    });
    for (const [i, extra] of (EXAMPLE_STEPS[exampleId] ?? []).entries()) {
      test(`${exampleId} (interaction ${i + 1})`, ({browser}) => {
        test.fail(extra.expectedFailure !== undefined, extra.expectedFailure);
        return expectMaterialParity(browser, {
          pinRoot: true,
          route: 'examples',
          scenario: exampleId,
          steps: extra.steps,
          rootSelector: extra.rootSelector,
          ignoreAttrs: EXAMPLE_IGNORE_ATTRS[exampleId],
        });
      });
    }
  }
});
