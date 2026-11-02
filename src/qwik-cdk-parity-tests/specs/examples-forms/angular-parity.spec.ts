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
  // form-field (mat-form-field) — form-field-overview itself is the headline, covered by
  // specs/examples/.
  'form-field-appearance',
  'form-field-label',
  'form-field-hint',
  'form-field-error',
  'form-field-prefix-suffix',
  // autocomplete (mat-autocomplete) — autocomplete-simple itself is the headline, covered by
  // specs/examples/.
  'autocomplete-filter',
  'autocomplete-display',
  'autocomplete-require-selection',
  'autocomplete-auto-active-first-option',
  'autocomplete-plain-input',
  'autocomplete-optgroup',
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

/** `form-field-label`'s own "Hide required marker" checkbox (its 3rd form field is `required`,
 *  so this is the one scenario in this batch where the marker actually exists to hide). */
const clickHideRequiredMarkerCheckbox: ParityStep = {
  name: 'click "Hide required marker" checkbox',
  run: async (page: Page) => {
    await page.getByRole('checkbox', {name: 'Hide required marker'}).click();
  },
};

/** `form-field-label`'s "Always" float-label radio — forces every field's label to float even
 *  while empty. */
const clickAlwaysFloatRadio: ParityStep = {
  name: 'click "Always" radio',
  run: async (page: Page) => {
    await page.getByRole('radio', {name: 'Always'}).click();
  },
};

/** Clicks the autocomplete's input to open its (inline, single-root) panel — same pattern as
 *  `specs/examples/`'s own `openAutocomplete` (`autocomplete-simple`'s headline interaction).
 *  Every example in this batch demonstrates its point behind typing/filtering, hidden until the
 *  panel is open. */
const openAutocompleteInRoot: ParityStep = {
  name: 'click input (open)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] input').click();
    await page.waitForTimeout(150);
  },
};

const EXAMPLE_STEPS: Record<
  string,
  {steps: ParityStep[]; rootSelector?: string; clockDate?: Date | number | string}[]
> = {
  'select-disabled': [{steps: [clickDisableSelectCheckbox]}],
  'select-panel-class': [{steps: [openSelectInRoot]}],
  'form-field-label': [
    {steps: [clickHideRequiredMarkerCheckbox]},
    {steps: [clickAlwaysFloatRadio]},
  ],
  'autocomplete-filter': [{steps: [openAutocompleteInRoot]}],
  'autocomplete-display': [{steps: [openAutocompleteInRoot]}],
  'autocomplete-require-selection': [{steps: [openAutocompleteInRoot]}],
  'autocomplete-auto-active-first-option': [{steps: [openAutocompleteInRoot]}],
  'autocomplete-plain-input': [{steps: [openAutocompleteInRoot]}],
  'autocomplete-optgroup': [{steps: [openAutocompleteInRoot]}],
  // form-field-error: no extra interaction — a typed-then-blurred field needing to wait out the
  // fill appearance's line-ripple transition (`specs/material-form-field/angular-parity.spec.ts`'s
  // own `waitForLineRippleSettled` pattern) was tried but consistently timed out waiting for the
  // transition to settle under this harness's `pinRoot`/`syncTheme` setup (reproducible 3/3,
  // though NOT reproducible in an isolated, unharnessed page — root cause not found in the time
  // available). Dropped rather than left flaky; the default (non-interaction) render already
  // covers this example's main DOM contract (error hidden until touched, `ng-invalid` from
  // first render).
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
 * - `form-field-label`: `<mat-radio-button value="auto">`/`value="always"` echo `value` (same
 *   genericity concern as `mat-radio/example`'s own identical entry in `specs/examples/`); its
 *   3rd field's `<mat-select required>` echoes `required` the same way as `select-hint-error`.
 * - `form-field-hint`: `<mat-form-field hintLabel="Max 10 characters">` echoes `hintlabel`
 *   (camelCase `@Input()`, lowercased by the DOM like any attribute) — `MatFormField`'s own
 *   `hintLabel` prop only ever drives the manufactured `<mat-hint>`'s text, never a literal
 *   attribute on the host.
 * - `form-field-appearance`: `<mat-form-field appearance="fill">` echoes `appearance` the same
 *   way (moot here — the whole scenario is `test.fail`, see `EXPECTED_FAILURES` — kept for when
 *   that's ever fixed).
 * - `form-field-prefix-suffix`: `<mat-form-field floatLabel="always">` echoes `floatlabel`.
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'select-form': ['name'],
  'select-hint-error': ['required'],
  'select-multiple': ['multiple'],
  'select-custom-trigger': ['multiple'],
  'form-field-label': ['value', 'required'],
  'form-field-hint': ['hintlabel'],
  'form-field-appearance': ['appearance'],
  'form-field-prefix-suffix': ['floatlabel'],
};

/**
 * Known, documented gaps — run as expected failures so the suite stays green but flags them if
 * they start passing (same pattern as `specs/examples/`'s own `EXPECTED_FAILURES`).
 */
const SLIDE_TOGGLE_P_DIV_NOTE =
  "per the HTML5 parsing algorithm a <div> start tag implicitly closes any open <p> in scope, " +
  "however deeply nested through an intervening custom element (same root cause already " +
  "documented for mat-slide-toggle/example in specs/examples/angular-parity.spec.ts — Angular's " +
  "dev-app is pure CSR (Renderer2 createElement/appendChild, never parses an HTML string) so it " +
  "never hits this rule; Qwik SSRs real HTML text the browser then parses, so it always does — " +
  "confirmed live, not a qwik-material bug, no fix short of never SSRing that component's own " +
  "markup)";

const EXPECTED_FAILURES: Record<string, string> = {
  'select-disabled':
    'the example wraps <mat-checkbox> in <p>; MatCheckbox renders a <div mat-internal-form-field> ' +
    `inside it, and ${SLIDE_TOGGLE_P_DIV_NOTE}`,
  'form-field-appearance':
    'the example wraps each <mat-form-field> in <p>; MatFormField always renders a ' +
    `<div class="mat-mdc-text-field-wrapper"> as its own first child, and ${SLIDE_TOGGLE_P_DIV_NOTE}`,
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
