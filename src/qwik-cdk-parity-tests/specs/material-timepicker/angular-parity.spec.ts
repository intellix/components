import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-timepicker (+ matTimepicker input, mat-timepicker-toggle, inside mat-form-field) — Angular
 * DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/timepicker.ts (exports
 * `TIMEPICKER_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-timepicker/
 * <scenario>). The Qwik side must render the same markup at
 * http://localhost:4173/mat-timepicker/<scenario>/ inside its own `[data-parity-root]`. Every
 * fact below was captured live against the real Angular dev-app (not just read from source) —
 * see timepicker.ts's own header for the structural/id/aria/panel-location notes (read it
 * first); this file's header focuses on interaction mechanics, timing, and the single-root
 * decision.
 *
 * ============================ ONE ROOT ONLY — VERIFIED LIVE ============================
 * Exactly like `mat-select`/`mat-autocomplete` (see those specs' headers, which this reuses):
 * `MatTimepicker._getOverlayRef()` calls `.withPopoverLocation('inline')` unconditionally, so the
 * panel's bounding-box host lands as a plain DOM sibling of `.mat-mdc-text-field-wrapper` — an
 * extra child of `<mat-form-field>` itself, directly before `.mat-mdc-form-field-subscript-
 * wrapper` — fully inside `[data-parity-root]`. CONFIRMED LIVE by reading `.parentElement` off
 * the popover host while a panel was open: `MAT-FORM-FIELD`, and `<mat-form-field>`'s own
 * `children` at that point are exactly `[.mat-mdc-text-field-wrapper, .cdk-overlay-popover.cdk-
 * overlay-connected-position-bounding-box, .mat-mdc-form-field-subscript-wrapper]`. A
 * `.cdk-overlay-container` is still created on first open (the cross-component Safari-
 * measurement-workaround side effect select's header documents) but CONFIRMED LIVE to stay
 * permanently childless (`children.length === 0`) even with a panel open. There is consequently
 * nothing a second `rootSelector` test would usefully assert; every scenario below has exactly
 * one `test()`, against the default `[data-parity-root]` root. Also CONFIRMED LIVE: NO backdrop
 * element is ever created (`hasBackdrop: false`, see timepicker.ts's header) — `.cdk-overlay-
 * backdrop` has a count of 0 in every scenario below, even while a panel is open.
 *
 * ============================ EXIT ANIMATION — ~100ms ============================
 * With animations enabled (the dev-app's default; no scenario below overrides
 * `MATERIAL_ANIMATIONS`), closing the panel is NOT immediate: `MatTimepicker.close()` flips
 * `isOpen` to `false`, which adds `mat-timepicker-panel-exit` to the still-fully-populated,
 * still-attached panel (triggering a 100ms linear opacity fade, `_mat-timepicker-exit`); only on
 * that animation's `animationend` does `OverlayRef.detach()` actually remove the whole popover
 * subtree from the DOM. `waitForTimepickerPanel` below polls for the exact expected
 * `.mat-timepicker-panel` count (0 or 1) with none mid-exit before every snapshot — the same
 * pattern select's/menu's specs already use for their own exit animations. A typed-then-blurred
 * value can also leave the form field's line-ripple mid-"deactivating" transition (~180ms, same
 * mechanism as form-field.ts's/select.ts's own line-ripple notes) — `waitForLineRippleSettled`
 * covers that for the `min-max` scenario's steps, confirmed LIVE to matter: two blur steps run in
 * quick succession can otherwise land one page's snapshot mid-transition while the other has
 * already settled, a false-positive diff unrelated to the timepicker's own contract.
 *
 * ============================ OPENING MECHANISMS ============================
 * Three independent, CONFIRMED-LIVE ways to open, each exercised at least once below: clicking
 * the `<mat-timepicker-toggle>` button (`basic-toggle`, `interval`, `custom-options`, `min-max`),
 * clicking the input itself (`MatTimepickerInput`'s own click listener on the form field's
 * connected-overlay origin — `openOnClick`, default `true`; `preset-value`), and pressing
 * ArrowDown/ArrowUp while the input is focused but the panel is closed (`keyboard-nav`,
 * `MatTimepickerInput._handleKeydown`). Closing a panel WITHOUT selecting anything is exercised
 * three ways too: clicking outside both the input and the panel (`OverlayRef.
 * outsidePointerEvents()`, no backdrop involved — `basic-toggle` clicks the scenario's own
 * `<p>Value: …</p>`, confirmed live to close it), and Escape (`preset-value`, `keyboard-nav`).
 *
 * Per-scenario render contract (see timepicker.ts for full structural/id/aria detail):
 *
 * - `basic-toggle`: fill, label "Pick a time", empty start (`value = null`), no preset. Default
 *   interval (30 min) → 48 options, `12:00 AM` through `11:30 PM`. Steps: open via toggle click
 *   (first option "12:00 AM" active, none selected — confirmed live, no value means
 *   `_syncSelectedState`'s fallback-active branch, never a `mdc-list-item--selected`); click the
 *   `<p>` outside both the input and the panel to close without selecting (value stays empty);
 *   reopen via toggle; click option index 2 ("1:00 AM") — closes, `<p>Value: …</p>` /the input's
 *   `.value` both update to "1:00 AM" (CONFIRMED LIVE exact string).
 * - `preset-value`: fill, label "Pick a time", `value` preset to 2:00 PM (`time(14, 0)`) — input
 *   shows "2:00 PM" from first render (CONFIRMED LIVE), label already floated. Step: click the
 *   input directly (NOT the toggle) to open — confirmed live the MATCHING option ("2:00 PM")
 *   is both `mdc-list-item--selected` (+ `aria-selected="true"` + trailing `appearance="minimal"`
 *   checkmark) AND `mat-mdc-option-active` (+ target of `aria-activedescendant`) simultaneously,
 *   unlike `basic-toggle`'s empty-start case; then Escape closes, value unchanged ("2:00 PM").
 * - `interval`: fill, label "Pick a time", `[interval]="'2h'"`, empty start. CONFIRMED LIVE exact
 *   12-entry option list: `12:00 AM, 2:00 AM, 4:00 AM, 6:00 AM, 8:00 AM, 10:00 AM, 12:00 PM, 2:00
 *   PM, 4:00 PM, 6:00 PM, 8:00 PM, 10:00 PM`. Steps: open via toggle; click "6:00 PM" (index 9) —
 *   closes, value becomes "6:00 PM".
 * - `min-max`: fill, label "Pick a time", `[formControl]="control"` (empty, no `Validators`),
 *   `[matTimepickerMin]`/`[matTimepickerMax]` bound to fixed `Date`s for 9:00 AM/5:00 PM, three
 *   conditional `<mat-error>`s for `matTimepickerParse`/`matTimepickerMin`/`matTimepickerMax`
 *   control errors (same mechanism as select.ts's `required-error-state` / form-field.ts's
 *   `error-state`). CONFIRMED LIVE exact 17-entry bounded option list: `9:00 AM` through `5:00
 *   PM` in 30-minute steps (default interval, now clamped by min/max — `9:00 AM, 9:30 AM, …, 4:30
 *   PM, 5:00 PM`). Steps: open via toggle (see the bounded list); Escape closes without
 *   selecting; type "8:00 AM" (before min) then blur — CONFIRMED LIVE `aria-invalid="true"`,
 *   `aria-describedby` gains the error's id, `<mat-error>Value is too early</mat-error>` renders,
 *   `ng-touched ng-dirty ng-invalid mat-form-field-invalid` land on the host (value itself stays
 *   "8:00 AM" — a syntactically valid time is still reformatted-to-itself on blur even though
 *   it's out of range); type "10:00 AM" (back in range) then blur — error clears, back to
 *   `ng-touched ng-dirty ng-valid`, no `<mat-error>` rendered.
 * - `custom-options`: fill, label "Pick a time", `[options]="customOptions"` — three entries,
 *   `Breakfast` (9:00 AM), `Lunch` (12:00 PM), `Dinner` (8:00 PM), empty start. Step: open via
 *   toggle; click "Lunch" — closes, and CONFIRMED LIVE the input's value becomes the
 *   STANDARD-FORMATTED time "12:00 PM", NOT the custom label "Lunch" (`_formatValue` always
 *   re-renders from `MAT_DATE_FORMATS.display.timeInput`, discarding the option's own `label`
 *   text — see timepicker.ts's header).
 * - `disabled`: fill, label "Pick a time", `[disabled]="true"` on the input, preset value 10:00
 *   AM (so the disabled contract is checked against a non-empty display too). CONFIRMED LIVE:
 *   the native `disabled` attribute lands on the `<input>` (a real reflected IDL property, unlike
 *   `mat-select`'s `aria-disabled`-only approach), and the toggle button is ALSO disabled
 *   (`MatTimepickerToggle._isDisabled` reads `timepicker.disabled()`, itself derived from the
 *   connected input's own `disabled()` — no separate `[disabled]` binding needed on the toggle).
 *   Playwright itself refuses to `.click()` a genuinely `disabled` native control, so — exactly
 *   like form-field.ts's/select.ts's own `disabled` scenarios — there are no steps beyond the
 *   initial structural compare; no panel/popover ever gets created for this scenario.
 * - `keyboard-nav`: fill, label "Pick a time", empty start, default interval. Steps: focus the
 *   input then press ArrowDown — opens (CONFIRMED LIVE `aria-activedescendant` targets the FIRST
 *   option, "12:00 AM", immediately, even though no value is selected); ArrowDown twice more —
 *   active descendant moves to index 2 ("1:00 AM"); ArrowUp once — moves back to index 1 ("12:30
 *   AM"); Enter — selects the ACTIVE option (index 1), closes, value becomes "12:30 AM"
 *   (CONFIRMED LIVE); ArrowDown again — reopens; Escape — closes without changing the value
 *   (stays "12:30 AM").
 *
 * HARNESS NEED (see timepicker.ts's header for the full writeup): `mat-timepicker-panel-id` (on
 * `<mat-timepicker>`) and `mat-timepicker-id` (on the input, ALWAYS present, mirrors the panel's
 * id regardless of open state) both carry the same app-global `_IdGenerator` counter value as
 * `id`/`aria-controls`, but neither attribute name is in `ID_ATTRS` in lib/material-parity.ts, so
 * neither gets digit-squashed — add both.
 */

const route = 'mat-timepicker';

const timepickerInput = (page: Page, index = 0) =>
  page.locator('[data-parity-root] input').nth(index);

const toggleButton = (page: Page, index = 0) =>
  page.locator('[data-parity-root] mat-timepicker-toggle button').nth(index);

/**
 * Waits until exactly `count` `.mat-timepicker-panel` elements exist AND none of them is
 * mid-exit-animation (`mat-timepicker-panel-exit`, added on close — see the file header's EXIT
 * ANIMATION section), THEN waits out any in-flight form-field line-ripple transition. Used after
 * every action that opens or closes the panel, so the structural compare that follows always
 * sees a fully settled DOM on both independently-timed apps, never a mid-transition frame — same
 * pattern as material-select's `waitForSelectPanel`.
 */
const waitForTimepickerPanel = async (page: Page, count: number) => {
  await page.waitForFunction(
    (n: number) => {
      const panels = document.querySelectorAll('.mat-timepicker-panel');
      return (
        panels.length === n &&
        Array.from(panels).every(p => !p.classList.contains('mat-timepicker-panel-exit'))
      );
    },
    count,
    {timeout: 5000},
  );
  await waitForLineRippleSettled(page);
};

/** Waits out the fill appearance's line-ripple deactivation transition (~180ms) — see
 * material-select's/material-form-field's identical helper for the full mechanism writeup. */
const waitForLineRippleSettled = (page: Page) =>
  page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[data-parity-root] .mdc-line-ripple--active.mdc-line-ripple--deactivating',
        ),
      undefined,
      {timeout: 2000},
    )
    .catch(() => {});

/** Clicks the toggle button and waits for the panel to finish opening. */
const openViaToggle = (index = 0): ParityStep => ({
  name: `click toggle ${index} (open)`,
  run: async (page: Page) => {
    await toggleButton(page, index).click();
    await waitForTimepickerPanel(page, 1);
  },
});

/** Clicks the input directly and waits for the panel to finish opening. */
const openViaInput = (index = 0): ParityStep => ({
  name: `click input ${index} (open)`,
  run: async (page: Page) => {
    await timepickerInput(page, index).click();
    await waitForTimepickerPanel(page, 1);
  },
});

/** Focuses the input then presses ArrowDown, opening the panel (confirmed live: DOWN_ARROW and
 * UP_ARROW both open an initially-closed panel — `MatTimepickerInput._handleKeydown`). */
const openViaArrowDown = (index = 0): ParityStep => ({
  name: `focus + ArrowDown ${index} (open)`,
  run: async (page: Page) => {
    await timepickerInput(page, index).focus();
    await page.keyboard.press('ArrowDown');
    await waitForTimepickerPanel(page, 1);
  },
});

/** A navigation key (ArrowDown/Up) that only moves the active option while already open —
 * synchronous, no panel-count change (`ActiveDescendantKeyManager.onKeydown`). */
const nav = (key: string): ParityStep => ({
  name: `press ${key} (nav)`,
  run: (page: Page) => page.keyboard.press(key),
});

/** Enter/Escape — each closes the panel (with the ~100ms exit animation); Enter additionally
 * selects the currently-active option first. */
const keyClose = (key: 'Enter' | 'Escape'): ParityStep => ({
  name: `press ${key} (close)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitForTimepickerPanel(page, 0);
  },
});

/** Clicks an open option by its accessible name (its formatted/custom label text) and waits for
 * the panel to finish its exit animation — selecting always closes (no multi-select mode). */
const clickOption = (name: string): ParityStep => ({
  name: `click option "${name}"`,
  run: async (page: Page) => {
    await page.getByRole('option', {name, exact: true}).click();
    await waitForTimepickerPanel(page, 0);
  },
});

/** Clicks the scenario's own `<p>Value: …</p>` — outside both the input and the panel — closing
 * the picker via `OverlayRef.outsidePointerEvents()` (no backdrop element involved, see the file
 * header). */
const clickOutside = (): ParityStep => ({
  name: 'click outside (close)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] p').click();
    await waitForTimepickerPanel(page, 0);
  },
});

/** Types into the input (replacing its current content, like `.fill()` always does) then blurs
 * it — triggers `MatTimepickerInput`'s parse-on-input / reformat-and-validate-on-blur pipeline. */
const typeAndBlur = (text: string, index = 0): ParityStep => ({
  name: `type "${text}" + blur`,
  run: async (page: Page) => {
    await timepickerInput(page, index).fill(text);
    await timepickerInput(page, index).evaluate(el => (el as HTMLElement).blur());
    await waitForLineRippleSettled(page);
  },
});

test.describe('mat-timepicker — Angular DOM parity', () => {
  test('basic-toggle', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic-toggle',
      steps: [openViaToggle(), clickOutside(), openViaToggle(), clickOption('1:00 AM')],
    }));

  test('preset-value', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'preset-value',
      steps: [openViaInput(), keyClose('Escape')],
    }));

  test('interval', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'interval',
      steps: [openViaToggle(), clickOption('6:00 PM')],
    }));

  test('min-max', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'min-max',
      steps: [
        openViaToggle(),
        keyClose('Escape'),
        typeAndBlur('8:00 AM'), // before min -> error
        typeAndBlur('10:00 AM'), // back in range -> error clears
      ],
    }));

  test('custom-options', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-options',
      steps: [openViaToggle(), clickOption('Lunch')],
    }));

  test('disabled', ({browser}) => expectMaterialParity(browser, {route, scenario: 'disabled'}));

  test('keyboard-nav', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'keyboard-nav',
      steps: [
        openViaArrowDown(), // active -> option 0 ("12:00 AM")
        nav('ArrowDown'), // -> option 1 ("12:30 AM")
        nav('ArrowDown'), // -> option 2 ("1:00 AM")
        nav('ArrowUp'), // -> option 1 ("12:30 AM")
        keyClose('Enter'), // selects "12:30 AM", closes
        openViaArrowDown(),
        keyClose('Escape'), // closes, value unchanged ("12:30 AM")
      ],
    }));
});
