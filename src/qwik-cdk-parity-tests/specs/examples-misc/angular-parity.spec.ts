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
  'icon-svg',
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
  'dialog-data',
  'dialog-content',
  'dialog-animations',
  'chips-input',
  'chips-template-form',
  'chips-reactive-form',
  'chips-autocomplete',
  'chips-avatar',
  'chips-stacked',
  'ripple-overview',
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

// NOT exercised with an interaction step: `tooltip-manual`'s whole premise is upstream's
// imperative `show()`/`hide()`/`toggle()` template-ref API, which this port's `useMatTooltip()`
// doesn't expose at all (only `hostProps` — hover/focus/touch-driven). Clicking the example's
// "show"/"hide"/"toggle" buttons is a documented no-op here (see tooltip-manual/index.tsx's own
// header comment) vs. a real overlay open on Angular — an asymmetric overlay-container
// presence/absence that this harness's generic retry-then-compare loop isn't a good fit for
// (it polls expecting eventual convergence, not a stable, permanent count mismatch). The base,
// no-interaction render below already covers everything this port CAN demonstrate; the gap
// itself is documented in code and in the Tooltip overview's "Angular → Qwik notes".

/**
 * Clicks a named trigger button and waits for the dialog to settle open. Mirrors
 * `specs/examples/angular-parity.spec.ts`'s own `openDialog` (generalized to a button name,
 * since `dialog-animations` has two distinct triggers).
 */
const openDialogByButton = (name: string): ParityStep => ({
  name: `click "${name}" (open)`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').getByRole('button', {name, exact: true}).click();
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
});

/** Checks all three of `ripple-overview`'s option checkboxes (Centered, Disabled, Unbounded). */
const clickRippleOptions: ParityStep = {
  name: 'check centered/disabled/unbounded',
  run: async (page: Page) => {
    const boxes = page.locator('[data-parity-root] mat-checkbox');
    for (let i = 0; i < 3; i++) {
      await boxes.nth(i).locator('input').click();
      await page.waitForFunction(
        index =>
          document
            .querySelectorAll('[data-parity-root] mat-checkbox')
            [index]?.classList.contains('mat-mdc-checkbox-checked'),
        i,
        {timeout: 5000},
      );
    }
  },
};

/** Interactions per example, added alongside each new port as needed. */
const EXAMPLE_STEPS: Record<
  string,
  {steps: ParityStep[]; rootSelector?: string; expectedFailure?: string}[]
> = {
  'snack-bar-annotated-component': [{steps: [openPizzaPartySnackBar], rootSelector: overlayRoot}],
  'tooltip-position': [
    {steps: [hoverActionButton]},
    {steps: [hoverActionButton], rootSelector: overlayRoot},
  ],
  'tooltip-delay': [
    {steps: [hoverActionButton]},
    {steps: [hoverActionButton], rootSelector: overlayRoot},
  ],
  'tooltip-modified-defaults': [
    {steps: [hoverActionButton]},
    {steps: [hoverActionButton], rootSelector: overlayRoot},
  ],
  'dialog-data': [{steps: [openDialogByButton('Open dialog')], rootSelector: overlayRoot}],
  'dialog-content': [{steps: [openDialogByButton('Open dialog')], rootSelector: overlayRoot}],
  'dialog-animations': [
    {
      steps: [openDialogByButton('Open dialog without animation')],
      rootSelector: overlayRoot,
    },
  ],
  // Toggles every option checkbox: each must flip to checked + `ng-dirty`, and "Unbounded" adds
  // `mat-ripple-unbounded` to the ripple container.
  'ripple-overview': [{steps: [clickRippleOptions]}],
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
 * - `dialog-content`: `<mat-dialog-actions align="end">` echoes `align`.
 * - `chips-stacked`: `<mat-chip-option selected>` echoes `selected`.
 * - `ripple-overview`: `<div matRipple ...>Click me</div>` echoes `matripple` — found only once
 *   the `ripple-overview`/checkbox `EXPECTED_FAILURES` entry below was removed (it was
 *   previously masking this SEPARATE, unrelated gap too). This is the first ported example to
 *   write `matRipple` directly on the CONSUMER's own element (every other `mat-ripple`/
 *   `matripple` this harness compares is Material's own internal template markup, e.g. inside
 *   `MatCheckbox`/`MatButtonToggle`, which must still be reproduced — see `lib/material-
 *   parity.ts`'s own `CONSUMER_SELECTOR_ATTRS` comment). `useMatRipple()`'s `hostProps` has no
 *   equivalent static marker attribute (it only ever contributes `class`/pointer handlers — see
 *   `core/ripple/use-mat-ripple.ts`), so this is scoped to this one example rather than added to
 *   the global `CONSUMER_SELECTOR_ATTRS` list (which would also stop comparing the Material-
 *   internal cases).
 */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'button-disabled-interactive': ['disabledinteractive'],
  'button-toggle-mode': ['name', 'value', 'multiple'],
  'button-toggle-appearance': ['name', 'value'],
  'slider-range': ['min', 'max'],
  'slider-formatting': ['min', 'max', 'step', 'showtickmarks', 'discrete'],
  'tooltip-manual': ['mattooltipposition'],
  'dialog-content': ['align'],
  'chips-stacked': ['selected'],
  'ripple-overview': ['matripple'],
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
    "render with the standard appearance, which never matches upstream's distinctly-templated " +
    'legacy group (no mat-pseudo-checkbox, different ripple-trigger wiring, a separate CSS class ' +
    'ladder) — a real, large unported feature, not a fixable bug.',
  'chips-input':
    'upstream writes the real example\'s <input [matChipInputFor]="chipGrid"> as a SIBLING of ' +
    '<mat-chip-grid>, both children of <mat-form-field> — valid either way in real Angular (the ' +
    'directive just looks up its grid via a template reference, regardless of DOM position), but ' +
    "this port's <MatChipGrid> deliberately renders the input ITSELF, nested one level inside " +
    "its own chip-set div, so a form-field's `for` and the input's `id` always agree without " +
    "the consumer having to coordinate them (see mat-chip-grid.tsx's own module doc comment for " +
    'the full rationale) — a real, deliberate, pre-existing structural difference (2 child-count ' +
    'mismatches at the form-field-infix/chip-set levels), not something editable/addOnBlur work ' +
    'should change. Every editable-chip/edit-icon/aria-description DOM this example actually ' +
    'exists to exercise now matches exactly (confirmed: removing this entry leaves ONLY the two ' +
    'child-count diffs above, zero class/attribute/content mismatches anywhere in the tree).',
  'chips-reactive-form':
    "upstream binds [formControl] directly to <mat-chip-grid>, so Angular's NgControlStatus " +
    'adds ng-pristine/ng-untouched/ng-valid to the real host from the first render; unlike ' +
    'MatInput/MatSelect, MatChipGridProps has no touched/dirty/invalid/formBound fields at all ' +
    '(confirmed against mat-chip-grid.tsx) to replicate those three classes.',
  'chips-autocomplete':
    'this port has no way to attach a MatAutocomplete trigger to the SAME input ' +
    '<MatChipGrid> renders internally (no ref/hook escape hatch — see chips-autocomplete/' +
    "index.tsx's own header comment); only the chip-grid-with-manual-entry part is ported, " +
    'the whole free-form-typing + suggestion-panel feature is missing — a real, large unported ' +
    'feature, not a fixable bug.',
  'chips-template-form':
    "upstream binds [(ngModel)] directly to <mat-chip-grid>, so Angular's NgControlStatus adds " +
    'ng-pristine/ng-untouched/ng-valid to the real host from the first render; same ' +
    "MatChipGridProps gap as chips-reactive-form's own entry above (no touched/dirty/invalid/" +
    'formBound fields at all).',
  'chips-avatar':
    "found live: upstream's matChipAvatar directive adds its three classes " +
    '(mat-mdc-chip-avatar/mdc-evolution-chip__icon/mdc-evolution-chip__icon--primary) directly ' +
    "onto the projected <img> element itself (no extra wrapper) — this port's MatChip always " +
    'wraps `avatar` content in its OWN extra <span class="mat-mdc-chip-avatar ..."> (see ' +
    'mat-chip.tsx), one level deeper than upstream for element content. Never caught before: ' +
    'the only existing avatar scenario (mat-chips/avatar-trailing-icon) uses plain TEXT ' +
    'content, which has no tag to reveal the extra wrapper. A real fix would need the host ' +
    'classes applied to arbitrary consumer-supplied JSXOutput, which this port has no ' +
    'mechanism for (same category as MatCardAvatar always rendering its own <img>).',
  'chips-stacked':
    "this port's MatChipListbox models single-select as ONE shared computed value/option, " +
    'derived once at mount from the FIRST option with `selected: true` — upstream allows each ' +
    '`<mat-chip-option selected>` to independently start selected regardless of listbox mode ' +
    '(confirmed live: all 4 real chips render aria-selected="true" simultaneously, even though ' +
    'the listbox has no `multiple` attribute); this port only ever reflects ONE of them as ' +
    'selected. A real fix would need a different initial-selection model, not a small change.',
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
