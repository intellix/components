import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

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
];

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
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'button-disabled-interactive': ['disabledinteractive'],
  'button-toggle-mode': ['name', 'value', 'multiple'],
  'button-toggle-appearance': ['name', 'value'],
  'slider-range': ['min', 'max'],
  'slider-formatting': ['min', 'max', 'step', 'showtickmarks', 'discrete'],
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
  }
});
