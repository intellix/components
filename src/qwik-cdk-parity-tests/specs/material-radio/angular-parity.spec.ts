import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-radio — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/radio.ts (exports
 * `RADIO_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-radio/<scenario>).
 * The Qwik side must render the same markup at
 * http://localhost:4173/mat-radio/<scenario>/ inside its own `[data-parity-root]`.
 *
 * All group scenarios bind `[value]` + `(change)="x = $event.value"` — NOT `[(value)]` —
 * because `MatRadioGroup` only emits a `change: EventEmitter<MatRadioChange>`, it has no
 * `valueChange` output, so Angular's two-way `[(value)]` syntax does not apply here.
 *
 * Per-scenario render contract:
 *
 * - `basic`: `<mat-radio-group aria-label="Favorite season">` (role="radiogroup", a plain
 *   static `aria-label` — not an Input on the group) containing 3 `<mat-radio-button>`
 *   ("Winter"/"Spring"/"Summer", values 'winter'/'spring'/'summer'), followed by
 *   `<p>Selected: (none)</p>`. Nothing is checked initially. Steps: click radio 1 (Spring)
 *   → "Selected: spring"; click radio 0 (Winter) → "Selected: winter"; ArrowDown (native
 *   radio-group keyboard nav moves focus+check to the next same-`name` radio, Spring) →
 *   "Selected: spring"; ArrowUp (back to Winter) → "Selected: winter"; tab into the root
 *   from a sentinel button placed just before it (focus should land on the one checked
 *   radio, since Material gives it tabindex 0 and the rest -1 — a roving tabindex).
 *
 * - `preselected`: same 3-button group, `aria-label="Favorite season (preselected)"`,
 *   value starts `'spring'` (Spring pre-checked) and `<p>Selected: spring</p>` (no `??`
 *   fallback — value is never undefined here). Steps: click radio 2 (Summer) →
 *   "Selected: summer"; ArrowUp (moves to the previous same-`name` radio in DOM order,
 *   Spring) → "Selected: spring"; ArrowDown (back to Summer) → "Selected: summer".
 *
 * - `standalone`: two sibling `<mat-radio-button>` elements with NO wrapping
 *   `<mat-radio-group>` (so no `role="radiogroup"` container in the DOM) — "Vanilla"
 *   (value 'vanilla', starts checked) and "Chocolate" (value 'chocolate'), both sharing
 *   `name="flavor"` so the browser still treats them as one native radio group, followed
 *   by `<p>Selected: vanilla</p>`. Steps: click radio 1 (Chocolate) → unchecks Vanilla,
 *   checks Chocolate, "Selected: chocolate"; ArrowUp (native nav moves focus+check back to
 *   the previous same-`name` radio, Vanilla) → "Selected: vanilla".
 *
 * - `color`: `<mat-radio-group aria-label="Color variants" color="primary">`-equivalent
 *   (bound `[color]="'primary'"`) with 3 buttons: "Default (group primary)" (value 'a', no
 *   own color → inherits primary), "Warn override" (value 'b', `[color]="'warn'"`),
 *   "Accent override" (value 'c', `[color]="'accent'"`); `<p>Selected: (none)</p>`.
 *   `mat-primary`/`mat-warn`/`mat-accent` are host classes on each `mat-radio-button`
 *   driven by its *own* effective color (group color is just the fallback). Steps: click
 *   radio 1 (Warn override) → "Selected: b"; click radio 2 (Accent override) →
 *   "Selected: c" (classes stay fixed per-button; only which button is checked changes).
 *
 * - `label-position`: 2-button group ("Option A"/"Option B", values 'a'/'b'),
 *   `aria-label="Label position before"`, bound `[labelPosition]="'before'"` — the
 *   `mat-internal-form-field` host div gets class `mdc-form-field--align-end` on both
 *   buttons. `<p>Selected: (none)</p>`. Steps: click radio 0 (Option A) →
 *   "Selected: a"; click radio 1 (Option B) → "Selected: b".
 *
 * - `disabled-group`: 2-button group ("Option A"/"Option B"), `aria-label="Disabled
 *   group"`, bound `[disabled]="true"`, value starts `'a'` (Option A pre-checked, so
 *   `<p>Selected: a</p>`). Both radios' native `<input>` get the `disabled` attribute (no
 *   `disabledInteractive`), both buttons get class `mat-mdc-radio-disabled`. Step: click
 *   radio 1 (Option B) with `force: true` — the browser ignores clicks on a disabled
 *   native input, so nothing changes; DOM must be identical to the initial snapshot.
 *
 * - `disabled-individual`: 3-button group ("Option A"/"Option B"/"Option C", values
 *   'a'/'b'/'c'), `aria-label="One button disabled"`, only radio 1 (Option B) has
 *   `[disabled]="true"` — only its `<input>` gets `disabled` and only it gets
 *   `mat-mdc-radio-disabled`; the group itself is enabled. `<p>Selected: (none)</p>`.
 *   Steps: click radio 1 (disabled Option B, `force: true`) → no change,
 *   "Selected: (none)"; click radio 2 (Option C) → "Selected: c".
 *
 * - `disabled-interactive`: 2-button group ("Option A"/"Option B"), `aria-label="Disabled
 *   interactive group"`, bound `[disabled]="true"` AND `[disabledInteractive]="true"`.
 *   Because of `disabledInteractive`, the native `<input>`s do **not** get the `disabled`
 *   attribute, but each gets `aria-disabled="true"`; both buttons still get
 *   `mat-mdc-radio-disabled` and an additional `mat-mdc-radio-disabled-interactive` class.
 *   `<p>Selected: (none)</p>`. Step: click radio 1 (Option B, `force: true`) — the click
 *   reaches the (non-disabled-attribute) input, but Material's own click handler calls
 *   `preventDefault` whenever `disabled && disabledInteractive`, so the radio does not
 *   become checked; DOM must be identical to the initial snapshot.
 *
 * - `required`: 2-button group ("Option A"/"Option B"), `aria-label="Required group"`,
 *   bound `[required]="true"` — both native `<input>`s get the `required` attribute.
 *   `<p>Selected: (none)</p>`. Steps: click radio 0 (Option A) → "Selected: a"; click
 *   radio 1 (Option B) → "Selected: b".
 *
 * - `named-group`: a `<form>` wrapping a 2-button group ("Option A"/"Option B", values
 *   'a'/'b'), `aria-label="Named group"`, bound `[name]="'season'"` so every radio's
 *   `<input name>` reads `season` (not an auto-generated `mat-radio-group-#`). Value
 *   starts `'a'` (Option A pre-checked), `<p>Selected: a</p>`. Steps: click radio 1
 *   (Option B) → "Selected: b"; click radio 0 (Option A) → "Selected: a".
 *
 * - `aria-attrs`: no `<mat-radio-group>` wrapper. Two plain `<span>`s
 *   (`id="radio-aria-attrs-label"` text "Baby banana", `id="radio-aria-attrs-desc"` text "A
 *   smaller banana") followed by two empty-content `<mat-radio-button>`s, each its own
 *   single-member native group (different `name`s, so clicking one never affects the
 *   other): radio 0 has `name="fruit-1"`, `value="banana"`, bound
 *   `[aria-label]="'Banana'"` (→ `aria-label="Banana"` on the inner `<input>`, not the
 *   host); radio 1 has `name="fruit-2"`, `value="kiwi"`, bound `[aria-labelledby]` /
 *   `[aria-describedby]` pointing at the two span ids (→ `aria-labelledby`/
 *   `aria-describedby` on the inner `<input>`). Neither radio is checked initially; there
 *   is no `<p>` state readout. Steps: click radio 0 (Banana) → becomes checked (radio 1
 *   unaffected); click radio 1 (Kiwi) → becomes checked too (radio 0 stays checked, since
 *   they don't share a `name`).
 */

const route = 'mat-radio';

/** Scopes to this scenario's radios so dev-app chrome elsewhere on the page is never hit. */
const radioInput = (page: Page, index: number) =>
  page.locator('[data-parity-root] mat-radio-button input[type="radio"]').nth(index);

const click = (index: number): ParityStep => ({
  name: `click radio ${index}`,
  run: (page: Page) => radioInput(page, index).click({force: true}),
});

const arrowDown: ParityStep = {
  name: 'ArrowDown',
  run: (page: Page) => page.keyboard.press('ArrowDown'),
};

const arrowUp: ParityStep = {
  name: 'ArrowUp',
  run: (page: Page) => page.keyboard.press('ArrowUp'),
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
  },
};

test.describe('mat-radio — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      steps: [click(1), click(0), arrowDown, arrowUp, tabIn],
    }));

  test('preselected', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'preselected',
      steps: [click(2), arrowUp, arrowDown],
    }));

  test('standalone', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'standalone',
      steps: [click(1), arrowUp],
    }));

  test('color', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color', steps: [click(1), click(2)]}));

  test('label-position', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'label-position',
      steps: [click(0), click(1)],
    }));

  test('disabled-group', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-group', steps: [click(1)]}));

  test('disabled-individual', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-individual',
      steps: [click(1), click(2)],
    }));

  test('disabled-interactive', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-interactive', steps: [click(1)]}));

  test('required', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'required', steps: [click(0), click(1)]}));

  test('named-group', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'named-group',
      steps: [click(1), click(0)],
    }));

  test('aria-attrs', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-attrs', steps: [click(0), click(1)]}));
});
