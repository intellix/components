import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-slide-toggle — Angular DOM parity
 *
 * Angular scenarios: src/dev-app/qwik-parity/slide-toggle.ts, route `mat-slide-toggle`.
 *
 * Every scenario renders exactly one `<mat-slide-toggle>` (wrapped in a bare `<form>`
 * for 'required-in-form') inside `[data-parity-root]`, followed by `<p>Checked: true|false</p>`.
 * `checked` is a plain component field wired through `[checked]`/`(change)` (no ngModel/forms),
 * so the `<p>` text always reflects the toggle's current state and a click round-trips
 * through real component state exactly like the real usage pattern.
 *
 * Baseline tree every scenario shares (this is the literal DOM for 'basic'; each other
 * scenario is called out only by its diff from this):
 *
 *   <mat-slide-toggle class="mat-mdc-slide-toggle mat-accent" id="mat-mdc-slide-toggle-#">
 *     <div mat-internal-form-field class="mdc-form-field mat-internal-form-field">
 *       <button class="mdc-switch mdc-switch--unselected" role="switch" type="button"
 *               tabindex="0" id="mat-mdc-slide-toggle-#-button"
 *               aria-labelledby="mat-mdc-slide-toggle-#-label" aria-checked="false">
 *         <div class="mat-mdc-slide-toggle-touch-target"></div>
 *         <span class="mdc-switch__track"></span>
 *         <span class="mdc-switch__handle-track">
 *           <span class="mdc-switch__handle">
 *             <span class="mdc-switch__shadow"><span class="mdc-elevation-overlay"></span></span>
 *             <span class="mdc-switch__ripple">
 *               <span mat-ripple class="mat-ripple mat-mdc-slide-toggle-ripple mat-focus-indicator"></span>
 *             </span>
 *             <span class="mdc-switch__icons">
 *               <svg class="mdc-switch__icon mdc-switch__icon--on" viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>
 *               <svg class="mdc-switch__icon mdc-switch__icon--off" viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>
 *             </span>
 *           </span>
 *         </span>
 *       </button>
 *       <label class="mdc-label" for="mat-mdc-slide-toggle-#-button" id="mat-mdc-slide-toggle-#-label">
 *         Subscribe to newsletter
 *       </label>
 *     </div>
 *   </mat-slide-toggle>
 *   <p>Checked: false</p>
 *
 * Notable DOM rules (apply across scenarios):
 * - `color` defaults to 'accent' inside MatSlideToggle itself (set in its constructor when
 *   nothing is bound), so every scenario carries a `mat-accent` host class even though none
 *   of them bind `[color]` — except 'color-primary', which overrides it to `mat-primary`.
 * - checked=true swaps the button's class from `mdc-switch--unselected` to BOTH
 *   `mdc-switch--selected` AND `mdc-switch--checked` together (not just one), and adds
 *   `mat-mdc-slide-toggle-checked` to the outer `<mat-slide-toggle>` host, and flips
 *   `aria-checked` to "true".
 * - DOM node order never changes with `labelPosition`: 'before' only toggles the
 *   `mdc-form-field--align-end` class on the wrapping div (a CSS/flex reorder) — the
 *   `<button>` always precedes the `<label>` in markup either way.
 * - `name`/`aria-label`/`aria-labelledby`/`aria-describedby`/`aria-required` all land on the
 *   INNER `<button>`, never on the outer `<mat-slide-toggle>` host — the host's own
 *   `[attr.name]`/`[attr.aria-label]`/`[attr.aria-labelledby]`/`[attr.tabindex]` host bindings
 *   always null out whatever a consumer put directly on the host tag.
 * - a bound `[aria-label]` SUPPRESSES `aria-labelledby` entirely on the button (removed, not
 *   re-pointed) — see 'no-label'.
 * - `hideIcon=true` OMITS the whole `<span class="mdc-switch__icons">` subtree (both svgs) —
 *   not hidden via CSS, not rendered at all.
 * - `fullWidth=true` adds `mat-slide-toggle-full-width` to the outer host only.
 * - keyboard/programmatic focus (CDK FocusMonitor) adds `mat-mdc-slide-toggle-focused` to the
 *   outer host; it is absent in every scenario's initial/click-only state.
 *
 * Scenarios:
 * - basic: unchecked, "Subscribe to newsletter" (the baseline tree above). Steps: click the
 *   switch twice (toggles on, then back off). A separate 'keyboard focus' test (reusing this
 *   scenario) tabs a sentinel button in front of the root and presses Tab — checking
 *   `mat-mdc-slide-toggle-focused` appears on the host — then presses Space, checking the
 *   switch activates exactly like a mouse click (aria-checked flips, classes swap).
 * - checked: same shape, initially checked=true, "Enable notifications". Step: click
 *   (toggles back to unchecked).
 * - disabled: `[disabled]="true"`, unchecked, "Disabled toggle". Button gains
 *   `mdc-switch--disabled`, a real `disabled` attribute, and `tabindex="-1"`. Step: click
 *   (no-op — the native `disabled` attribute blocks the click from ever firing).
 * - disabled-checked: `[disabled]="true"`, initially checked=true, "Disabled toggle
 *   (checked)". Same disabled DOM as above plus the checked classes/aria-checked="true".
 *   Step: click (no-op).
 * - disabled-interactive: `[disabled]="true"` AND `[disabledInteractive]="true"`, unchecked,
 *   "Disabled interactive toggle". Unlike plain 'disabled': there is NO native `disabled`
 *   attribute, `tabindex` stays "0" (the button remains focusable), the button gains an
 *   extra class `mat-mdc-slide-toggle-disabled-interactive`, and `aria-disabled="true"` is
 *   present (absent in every other scenario). Step: click is still a no-op — the click
 *   handler itself guards on `disabled` alone, regardless of `disabledInteractive`.
 * - hide-icon: `[hideIcon]="true"`, unchecked, "No icon". The `mdc-switch__icons` span and
 *   both svgs are absent from the markup entirely. Step: click (toggles normally).
 * - label-before: `[labelPosition]="'before'"`, unchecked, "Label before". Only DOM
 *   difference from basic: the wrapping div gains `mdc-form-field--align-end`. Step: click
 *   (toggles normally).
 * - full-width: `[fullWidth]="true"`, unchecked, "Full width toggle". Outer host gains
 *   `mat-slide-toggle-full-width`. Step: click (toggles normally).
 * - no-label: `[aria-label]="'Airplane mode'"`, no projected content at all (written as a
 *   self-closing `<mat-slide-toggle ... />`), unchecked. The button carries
 *   `aria-label="Airplane mode"` and NO `aria-labelledby` (suppressed because aria-label is
 *   set); the `<label>` element still renders but is completely empty (no text node/
 *   whitespace content). Step: click (toggles normally).
 * - required-in-form: the `<mat-slide-toggle>` is wrapped in a bare `<form>` (part of the
 *   compared subtree). `[required]="true"` and `[name]="'terms'"`, unchecked, "Accept terms".
 *   The button carries `aria-required="true"` and `name="terms"` (neither appears on any
 *   other scenario). Step: click (toggles normally).
 * - color-primary: `[color]="'primary'"`, unchecked, "Primary color toggle". Outer host class
 *   is `mat-primary` instead of the default `mat-accent`. Step: click (toggles normally).
 */

const route = 'mat-slide-toggle';

/**
 * Lets a rAF-coalesced change-detection cycle (Angular's zone here runs with
 * `eventCoalescing`/`runCoalescing`, so a DOM update can land a frame after the
 * triggering event) catch up before the structural snapshot is taken. Two frames
 * is enough in practice and keeps no-op interactions (disabled scenarios) fast.
 */
const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );

const click: ParityStep = {
  name: 'click switch',
  run: async (page: Page) => {
    await page.locator('button.mdc-switch').click({force: true});
    await settle(page);
  },
};

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
    await settle(page);
  },
};

const pressSpace: ParityStep = {
  name: 'press Space',
  run: async (page: Page) => {
    await page.keyboard.press('Space');
    await settle(page);
  },
};

test.describe('mat-slide-toggle — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: [click, click]}));

  test('checked', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'checked', steps: [click]}));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled', steps: [click]}));

  test('disabled-checked', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-checked', steps: [click]}));

  test('disabled-interactive', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-interactive', steps: [click]}));

  test('hide-icon', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'hide-icon', steps: [click]}));

  test('label-before', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'label-before', steps: [click]}));

  test('full-width', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'full-width', steps: [click]}));

  test('no-label', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'no-label', steps: [click]}));

  test('required-in-form', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'required-in-form', steps: [click]}));

  test('color-primary', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color-primary', steps: [click]}));

  test('keyboard focus', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: [tabIn, pressSpace]}));
});
