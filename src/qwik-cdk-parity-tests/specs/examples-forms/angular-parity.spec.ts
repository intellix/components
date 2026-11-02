import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * Docs-site Phase 2, batch A (forms): every material.angular.dev example ported in
 * `src/qwik-material-examples/{datepicker,timepicker,autocomplete,input,form-field,select}/`
 * BEYOND each component's existing headline example (already covered by `specs/examples/`).
 * Angular renders the real, unmodified upstream example via the generic
 * `/qwik-parity/examples/:exampleId` route (`src/dev-app/qwik-parity/examples.ts`); the Qwik side
 * is the matching `src/qwik-cdk-dev-app/src/routes/examples/<id>/index.tsx` wrapper. Both compare
 * `[data-parity-root]`, same shape as `specs/examples/angular-parity.spec.ts` (reused patterns
 * live there — see that file's own header for the font-cache/clock/pin-root background).
 *
 * `EXAMPLES` is a flat list (one id per upstream example dir, `src/components-examples/material/
 * <component>/<id>/`) — unlike `specs/examples/`'s per-component map, there's no need to group by
 * component here since every id is already globally unique and this file only ever adds a
 * default (no-interaction) test plus whatever extra interaction steps `EXAMPLE_STEPS` lists.
 */
const EXAMPLES: string[] = [
  // select (mat-select) — select-overview itself is the headline, covered by specs/examples/.
  'select-value-binding',
  'select-form',
  'select-hint-error',
  'select-disabled',
  'select-reset',
  'select-optgroup',
  'select-multiple',
  'select-custom-trigger',
  'select-panel-class',
];

/** Clicks the `select-disabled` example's "Disable select" checkbox, which drives `[disabled]`
 *  on both the `<mat-select>` and the native `<select>` cards. */
const clickDisableSelectCheckbox: ParityStep = {
  name: 'click "Disable select" checkbox',
  run: async (page: Page) => {
    await page.getByRole('checkbox', {name: 'Disable select'}).click();
  },
};

/** Opens the `<mat-select>` in `[data-parity-root]` — same wait pattern as `specs/examples/`'s
 *  own `openSelect` (`select-overview`'s headline interaction). Used by `select-panel-class` to
 *  exercise the actual point of that example (the listbox getting a `panelClass`). */
const openSelectInRoot: ParityStep = {
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

const EXAMPLE_STEPS: Record<
  string,
  {steps: ParityStep[]; rootSelector?: string; clockDate?: Date | number | string}[]
> = {
  'select-disabled': [{steps: [clickDisableSelectCheckbox]}],
  'select-panel-class': [{steps: [openSelectInRoot]}],
};

/**
 * Per-id `ignoreAttrs` (same rationale as `specs/examples/`'s own `EXAMPLE_IGNORE_ATTRS` — real,
 * unmodified upstream examples frequently bind a plain, UNBOUND attribute (`required`, `name`,
 * `multiple`) that Angular's template compiler echoes verbatim onto the host element in ADDITION
 * to feeding any matching `@Input()`, something a Qwik JSX prop has no "static vs. bound"
 * distinction to replicate):
 * - `select-form`: `<select matNativeControl name="car" ...>` echoes `name` (too generic to add
 *   globally — `name` carries real meaning elsewhere, e.g. `MatRadioGroup`'s `name`).
 * - `select-hint-error`: `<mat-select [formControl]="animalControl" required>` echoes `required`
 *   as a literal attribute; `MatSelect`'s own host bindings (`src/material/select/select.ts`)
 *   only ever set `[attr.aria-required]`/`[class.mat-mdc-select-required]`, never a literal
 *   `[attr.required]`, so this is purely the bare-attribute echo, not a missing feature.
 * - `select-multiple` / `select-custom-trigger`: `<mat-select [formControl]="toppings"
 *   multiple>` echoes `multiple` the same way.
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'select-form': ['name'],
  'select-hint-error': ['required'],
  'select-multiple': ['multiple'],
  'select-custom-trigger': ['multiple'],
};

/**
 * Known, documented gaps — run as expected failures so the suite stays green but flags them if
 * they start passing (same pattern as `specs/examples/`'s own `EXPECTED_FAILURES`).
 */
const EXPECTED_FAILURES: Record<string, string> = {
  'select-disabled':
    'the example wraps <mat-checkbox> in <p>; MatCheckbox renders a <div mat-internal-form-field> ' +
    'inside it, and per the HTML5 parsing algorithm a <div> start tag implicitly closes any open ' +
    '<p> in scope, however deeply nested (same root cause already documented for ' +
    'mat-slide-toggle/example in specs/examples/angular-parity.spec.ts — Angular\'s dev-app is pure ' +
    "CSR (Renderer2 createElement/appendChild, never parses an HTML string) so it never hits this " +
    'rule; Qwik SSRs real HTML text the browser then parses, so it always does — confirmed live, ' +
    'not a qwik-material bug, no fix short of never SSRing a form-internal control\'s own markup)',
};

test.describe('qwik-material-examples (docs Phase 2, forms batch) — Angular DOM parity', () => {
  for (const id of EXAMPLES) {
    const ignoreAttrs = EXAMPLE_IGNORE_ATTRS[id];
    test(id, ({browser}) => {
      const gap = EXPECTED_FAILURES[id];
      test.fail(gap !== undefined, gap);
      return expectMaterialParity(browser, {pinRoot: true, route: 'examples', scenario: id, ignoreAttrs});
    });
    for (const [i, extra] of (EXAMPLE_STEPS[id] ?? []).entries()) {
      test(`${id} (interaction ${i + 1})`, ({browser}) => {
        const gap = EXPECTED_FAILURES[id];
        test.fail(gap !== undefined, gap);
        return expectMaterialParity(browser, {
          pinRoot: true,
          route: 'examples',
          scenario: id,
          steps: extra.steps,
          rootSelector: extra.rootSelector,
          clockDate: extra.clockDate,
          ignoreAttrs,
        });
      });
    }
  }
});
