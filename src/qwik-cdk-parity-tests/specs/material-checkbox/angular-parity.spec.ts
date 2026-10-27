import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-checkbox — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/checkbox.ts (exports
 * `CHECKBOX_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-checkbox/<scenario>).
 * The Qwik side must render the same markup at
 * http://localhost:4173/mat-checkbox/<scenario>/ inside its own `[data-parity-root]`.
 *
 * Shared skeleton every scenario renders (see src/material/checkbox/checkbox.html and
 * checkbox.ts host bindings) — only the parts a given scenario's inputs change are called
 * out per-scenario below:
 *
 *   <mat-checkbox class="mat-mdc-checkbox mat-{accent|primary|warn} [_mat-animation-noopable]
 *                        [mat-mdc-checkbox-checked] [mat-mdc-checkbox-disabled]
 *                        [mat-mdc-checkbox-disabled-interactive] [mdc-checkbox--disabled]"
 *                 [id]="mat-mdc-checkbox-#">
 *     <div mat-internal-form-field class="mdc-form-field mat-internal-form-field
 *                                          [mdc-form-field--align-end]">
 *       <div class="mdc-checkbox">
 *         <div class="mat-mdc-checkbox-touch-target" aria-hidden="true"></div>
 *         <input type="checkbox" class="mdc-checkbox__native-control [mdc-checkbox--selected]"
 *                [id]="mat-mdc-checkbox-#-input" .../>
 *         <div class="mdc-checkbox__ripple" aria-hidden="true"></div>
 *         <div class="mdc-checkbox__background" aria-hidden="true">
 *           <svg class="mdc-checkbox__checkmark" focusable="false" viewBox="0 0 24 24">
 *             <path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,..."/>
 *           </svg>
 *           <div class="mdc-checkbox__mixedmark"></div>
 *         </div>
 *         <div class="mat-mdc-checkbox-ripple mat-focus-indicator" aria-hidden="true"></div>
 *       </div>
 *       <label class="mdc-label" [for]="mat-mdc-checkbox-#-input">...ng-content...</label>
 *     </div>
 *   </mat-checkbox>
 *
 * ANIMATIONS: only the `animations-disabled` scenario provides `MATERIAL_ANIMATIONS` with
 * `animationsDisabled: true` (see checkbox.ts `NO_ANIMATIONS`). Every other scenario runs
 * with Angular's default (animations enabled) — same as a real app — on purpose:
 *
 *   1. Steady-state contract (this IS asserted by every DOM comparison below): the host
 *      `<mat-checkbox>` carries class `_mat-animation-noopable` ONLY in `animations-disabled`
 *      — it must be ABSENT in every other scenario. The Qwik port must implement the same
 *      "are animations disabled" check (`_animationsDisabled`/`MATERIAL_ANIMATIONS`/
 *      `prefers-reduced-motion`) rather than hard-coding the class on or off.
 *
 *   2. Transition-class contract (NOT directly asserted by the DOM comparison, but real
 *      upstream behavior the Qwik port still needs to implement — see below): clicking or
 *      Space-toggling a checkbox whose checked/indeterminate state actually changes makes
 *      `MatCheckbox._transitionCheckState` add a class `mdc-checkbox--anim-<from>-<to>`
 *      (e.g. `mdc-checkbox--anim-unchecked-checked`) to the native `<input>` — this is what
 *      drives MDC's checkmark-draw CSS animation — then remove it ~1 second later via
 *      `_ngZone.runOutsideAngular(() => setTimeout(..., 1000))`. Every `click`/`spaceToggle`
 *      step below waits (`page.waitForFunction`, not a fixed sleep) for any
 *      `[class*="mdc-checkbox--anim-"]` under `[data-parity-root]` to disappear, on each app
 *      independently, before that step resolves — so the structural diff that follows always
 *      sees the steady-state DOM, never a mid-transition frame, and two independently-timed
 *      browser contexts can never race each other into a false mismatch. Practical
 *      consequences for the Qwik port: (a) it is not graded by this spec on the *exact instant*
 *      the transition class is present, but (b) if it adds an equivalent class and never
 *      removes it (or takes longer than the 5s wait timeout), the Qwik-side wait in that same
 *      step times out and the step fails — so the add-then-remove lifecycle still has to work,
 *      just not with byte-identical timing. The exact class name observed on the live Angular
 *      app is still called out per step below, as implementation guidance.
 *
 *   One upstream quirk worth knowing (seen in `checked` and `colors`' "Primary" checkbox
 *   below): `_transitionCheckState`'s very first call for a given `<mat-checkbox>` instance
 *   runs while its internal `_currentCheckState` is still `TransitionCheckState.Init`
 *   (`ngAfterViewInit` only *syncs* `indeterminate` onto the native node, it never calls
 *   `_transitionCheckState`). The `Init` branch of `_getAnimationClassForCheckStateTransition`
 *   only returns a class when the target state is `Checked` or `Indeterminate` — a first
 *   transition straight to `Unchecked` from `Init` (i.e. the very first click on a checkbox
 *   that starts CHECKED, toggling it off) returns `''`, so NO transition class is added for
 *   that specific click, even though checked state visibly flips via the `mdc-checkbox--
 *   selected`/`mat-mdc-checkbox-checked` classes. Every later click on the same checkbox
 *   behaves normally (a class is added).
 *
 * `checked`/`indeterminate` are themselves plain DOM properties (not reflected as HTML
 * attributes), so they are never directly visible as attributes in the comparison — only
 * indirectly, via the `mdc-checkbox--selected` class on the `<input>`, the
 * `mat-mdc-checkbox-checked` class on the host, and (for indeterminate) `aria-checked="mixed"`
 * on the `<input>` (`[attr.aria-checked]="indeterminate ? 'mixed' : null"` — note this depends
 * on `indeterminate` only, never on `checked`).
 *
 * Per-scenario render contract:
 *
 * - `basic`: one `<mat-checkbox>`, label text "Subscribe to newsletter", starts unchecked
 *   (`checked = false`), followed by `<p>Checked: false</p>`. Default color → host class
 *   `mat-accent`. No `_mat-animation-noopable` (animations enabled). Steps: click the native
 *   input → transiently adds `mdc-checkbox--anim-unchecked-checked` (waited out), settles
 *   checked, "Checked: true"; click again → transiently `mdc-checkbox--anim-checked-unchecked`,
 *   settles unchecked, "Checked: false"; focus the input and press Space (native browser
 *   checkbox toggle, no Material-specific handler) → transiently
 *   `mdc-checkbox--anim-unchecked-checked`, settles checked, "Checked: true"; tab into the
 *   root from a sentinel button placed just before it (focus lands on the input; no DOM
 *   change expected, checkbox has no focus-driven classes).
 *
 * - `animations-disabled`: identical markup/behavior to `basic` (same label, same starting
 *   state, same `<p>`), but provides `MATERIAL_ANIMATIONS` with `animationsDisabled: true` —
 *   host carries `_mat-animation-noopable`, and clicking/Space NEVER adds any
 *   `mdc-checkbox--anim-*` class at all (confirmed live: the wait resolves in ~0ms every
 *   time, vs. ~1000ms elsewhere). Same steps as `basic`: click, click, space, tab-into-root.
 *
 * - `checked`: one `<mat-checkbox>`, label "Accept terms and conditions", starts checked
 *   (`checked = true`), `<p>Checked: true</p>`. Steps: click → the Init-state quirk above
 *   applies (first transition, target Unchecked) → NO transition class, settles unchecked,
 *   "Checked: false"; click again → now a normal Unchecked→Checked transition → transiently
 *   `mdc-checkbox--anim-unchecked-checked`, settles checked, "Checked: true".
 *
 * - `indeterminate`: one `<mat-checkbox>`, label "Select all", starts `checked = false`,
 *   `indeterminate = true` — native `<input>` has class `mdc-checkbox__native-control` (no
 *   `mdc-checkbox--selected`, since unchecked) and `aria-checked="mixed"`; host has no
 *   `mat-mdc-checkbox-checked` class. `<p>Checked: false</p>` and `<p>Indeterminate:
 *   true</p>`. Step 1: click the input — Material's own click handler sets checked=true AND
 *   (via a microtask) clears indeterminate to false directly on the internal signal (NOT
 *   through the public `indeterminate` setter, so this specific clearing never itself calls
 *   `_transitionCheckState`), emitting both `change` and `indeterminateChange`; the host's
 *   `(change)` handler mirrors this into `checked`/`indeterminate` state. Because the
 *   `[indeterminate]="true"` initial binding fired before view-init (so its own
 *   `_transitionCheckState` call early-returned on a missing element without updating
 *   `_currentCheckState`), this click is ALSO effectively a first transition from `Init`
 *   straight to `Checked` → transiently adds `mdc-checkbox--anim-unchecked-checked` (not an
 *   "indeterminate" class name). Result after waiting it out: `mdc-checkbox--selected` +
 *   `aria-checked` gone (the attribute is absent, not `"false"` — the template only ever sets
 *   it to `'mixed'` or `null`), host gains `mat-mdc-checkbox-checked`, "Checked: true",
 *   "Indeterminate: false". Step 2: click again — ordinary Checked→Unchecked toggle →
 *   transiently `mdc-checkbox--anim-checked-unchecked` → "Checked: false", "Indeterminate:
 *   false".
 *
 * - `disabled`: two `<mat-checkbox>` elements, each in its own wrapping `<div>`: #0 "Disabled
 *   unchecked" (`[disabled]="true"`, unchecked) and #1 "Disabled checked" (`[disabled]="true"
 *   [checked]="true"`). Both hosts get `mat-mdc-checkbox-disabled` + `mdc-checkbox--disabled`;
 *   #1 additionally gets `mat-mdc-checkbox-checked` and its input gets
 *   `mdc-checkbox--selected`. Both native inputs get the `disabled` attribute and
 *   `tabindex="-1"` (`[tabIndex]="disabled && !disabledInteractive ? -1 : tabIndex"`). No `<p>`
 *   state readout. Steps: force-click input #0, then force-click input #1 — the browser
 *   never dispatches `click` on a `disabled` native input, so neither has any effect (and no
 *   transition class is ever added — confirmed live, the wait resolves instantly); DOM must
 *   stay identical to the initial snapshot both times.
 *
 * - `disabled-interactive`: one `<mat-checkbox>`, label "Disabled but interactive",
 *   `[disabled]="true" [disabledInteractive]="true"`, starts unchecked, `<p>Checked:
 *   false</p>`. Host gets `mat-mdc-checkbox-disabled`, `mat-mdc-checkbox-disabled-interactive`
 *   AND `mdc-checkbox--disabled` (that class binds to `disabled` alone,
 *   `[class.mdc-checkbox--disabled]="disabled"` — `disabledInteractive` does not change it;
 *   it only changes whether the native `disabled` *attribute* is applied). The native
 *   `<input>` does NOT get the `disabled` attribute
 *   (`[disabled]="disabled && !disabledInteractive"` → false), instead gets
 *   `aria-disabled="true"` and keeps `tabindex="0"`. Steps: click the input directly (no
 *   `force` needed, it is not actually disabled) — Material's click handler takes the
 *   "disabled-but-interactive" branch, which only resets the native input back to the model's
 *   current checked/indeterminate and does NOT flip `checked` or call
 *   `_transitionCheckState`; DOM unchanged (no transition class either — confirmed live), still
 *   "Checked: false". Then focus the input and press Space — same: no change.
 *
 * - `label-before`: one `<mat-checkbox>`, `[labelPosition]="'before'"`, label "Label before
 *   checkbox", starts unchecked, `<p>Checked: false</p>`. The `div[mat-internal-form-field]`
 *   gets the extra class `mdc-form-field--align-end`. Step: click → transiently
 *   `mdc-checkbox--anim-unchecked-checked` → settles checked, "Checked: true" (the align-end
 *   class is static and unaffected by checked state).
 *
 * - `required`: a `<form>` wrapping one `<mat-checkbox [required]="true">`, label "I agree to
 *   the terms (required)", starts unchecked, `<p>Checked: false</p>` (outside the form). The
 *   native `<input>` gets the `required` attribute throughout. Step: click → transiently
 *   `mdc-checkbox--anim-unchecked-checked` → settles checked, "Checked: true" (required
 *   attribute unaffected).
 *
 * - `colors`: four `<mat-checkbox>` elements, no wrapping `<p>`: #0 "Default" (no `[color]`
 *   binding, `[checked]="true"`, static) → host class `mat-accent` (the component's own
 *   default); #1 "Primary" (`[color]="'primary'" [checked]="checkedPrimary"` starting
 *   `true`) → host class `mat-primary`; #2 "Accent" (`[color]="'accent'" [checked]="true"`,
 *   static) → host class `mat-accent` (identical DOM to #0 apart from label text — proves
 *   the default equals an explicit `'accent'`); #3 "Warn" (`[color]="'warn'" [checked]="true"`,
 *   static) → host class `mat-warn`. All four start checked (`mdc-checkbox--selected` +
 *   `mat-mdc-checkbox-checked`); none has `_mat-animation-noopable`. Steps: click input #1
 *   (Primary) → same Init-state quirk as `checked` above (first transition, target Unchecked)
 *   → NO transition class, settles unchecked (loses `mdc-checkbox--selected`/
 *   `mat-mdc-checkbox-checked`, keeps `mat-primary`); click input #1 again → normal
 *   Unchecked→Checked → transiently `mdc-checkbox--anim-unchecked-checked` → re-checked.
 *
 * - `aria-label`: one `<mat-checkbox [aria-label]="'Enable notifications'">` with NO content
 *   (empty `<label>` element — the `ng-content` projects nothing) — no `[checked]` binding,
 *   so the checkbox is fully uncontrolled/self-managed, starts unchecked. No `<p>`. The
 *   native `<input>` gets `aria-label="Enable notifications"`. Step: click the input →
 *   Material's own uncontrolled click handling flips its internal checked state → transiently
 *   `mdc-checkbox--anim-unchecked-checked`, settles with input gaining `mdc-checkbox--selected`,
 *   host gaining `mat-mdc-checkbox-checked` (this exercises the no-`[checked]`-binding path,
 *   since nothing re-asserts `checked` from outside).
 *
 * - `aria-labelledby`: a `<label id="ext-label">External label text</label>` followed by one
 *   `<mat-checkbox [aria-labelledby]="'ext-label'">` with no content and no `[checked]`
 *   binding, starts unchecked. No `<p>`. The native `<input>` gets
 *   `aria-labelledby="ext-label"`. Step: click the input → same uncontrolled toggle as
 *   `aria-label` above (transiently `mdc-checkbox--anim-unchecked-checked`) → checked.
 *
 * - `aria-extra`: one `<mat-checkbox [aria-describedby]="'details-1'" [aria-expanded]="true"
 *   [aria-controls]="'details-1'" [aria-owns]="'details-1'">`, label "Show advanced options",
 *   followed by a plain `<div id="details-1">Additional details shown when expanded.</div>`.
 *   No `[checked]` binding, starts unchecked. The native `<input>` gets
 *   `aria-describedby="details-1"`, `aria-expanded="true"`, `aria-controls="details-1"`,
 *   `aria-owns="details-1"` — all four simultaneously. Step: click the input → uncontrolled
 *   toggle to checked (transiently `mdc-checkbox--anim-unchecked-checked`); all four aria-*
 *   attributes stay exactly as-is (none of them depend on checked state — only `aria-checked`
 *   would, and that one is driven by `indeterminate`, which is not used here and therefore
 *   never appears).
 *
 * - `name-value-form`: a `<form>` wrapping one `<mat-checkbox [name]="'subscribe'"
 *   [value]="'yes'">`, label "Subscribe (form checkbox)", starts unchecked, `<p>Checked:
 *   false</p>` (outside the form). The native `<input>` gets `name="subscribe"` and
 *   `value="yes"`. Steps: click → transiently `mdc-checkbox--anim-unchecked-checked` →
 *   settles checked, "Checked: true" (name/value unaffected); click again → transiently
 *   `mdc-checkbox--anim-checked-unchecked` → settles unchecked, "Checked: false".
 */

const route = 'mat-checkbox';

/** Scopes to this scenario's checkbox inputs so dev-app chrome elsewhere is never hit. */
const checkboxInput = (page: Page, index = 0) =>
  page.locator('[data-parity-root] input.mdc-checkbox__native-control').nth(index);

/**
 * Waits for upstream's transient `mdc-checkbox--anim-<from>-<to>` transition class (added by
 * `MatCheckbox._transitionCheckState`, removed again via a 1-second `setTimeout` — see the
 * header comment above) to disappear from this scenario's checkboxes. A no-op, resolving
 * immediately, when the preceding action never added one (e.g. `animations-disabled`, or a
 * click that upstream's `Init`-state quirk suppresses). Using a condition wait rather than a
 * fixed sleep means both apps settle on their own schedule before the structural diff runs,
 * so two independently-timed browser contexts can never race each other into a false
 * mismatch — but if an app adds an equivalent class and never removes it, this times out and
 * fails the step on that app specifically.
 */
const waitForTransitionClassToClear = (page: Page) =>
  page.waitForFunction(
    () => !document.querySelector('[data-parity-root] [class*="mdc-checkbox--anim-"]'),
    undefined,
    {timeout: 5000},
  );

const click = (index = 0): ParityStep => ({
  name: `click checkbox ${index}`,
  run: async (page: Page) => {
    await checkboxInput(page, index).click({force: true});
    await waitForTransitionClassToClear(page);
  },
});

const spaceToggle = (index = 0): ParityStep => ({
  name: `space checkbox ${index}`,
  run: async (page: Page) => {
    await checkboxInput(page, index).focus();
    await page.keyboard.press('Space');
    await waitForTransitionClassToClear(page);
  },
});

/** Tabs into the parity root from a sentinel placed just before it (the dev-app chrome differs). */
const tabIn: ParityStep = {
  name: 'Tab into root',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
  },
};

test.describe('mat-checkbox — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      steps: [click(), click(), spaceToggle(), tabIn],
    }));

  test('animations-disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'animations-disabled',
      steps: [click(), click(), spaceToggle(), tabIn],
    }));

  test('checked', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'checked', steps: [click(), click()]}));

  test('indeterminate', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'indeterminate',
      steps: [click(), click()],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled', steps: [click(0), click(1)]}));

  test('disabled-interactive', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-interactive',
      steps: [click(), spaceToggle()],
    }));

  test('label-before', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'label-before', steps: [click(), click()]}));

  test('required', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'required', steps: [click()]}));

  test('colors', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'colors', steps: [click(1), click(1)]}));

  test('aria-label', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-label', steps: [click()]}));

  test('aria-labelledby', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labelledby', steps: [click()]}));

  test('aria-extra', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-extra', steps: [click()]}));

  test('name-value-form', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'name-value-form',
      steps: [click(), click()],
    }));
});
