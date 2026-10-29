import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-datepicker (+ matDatepicker input, mat-datepicker-toggle, mat-date-range-input/
 * mat-date-range-picker, inline mat-calendar, mat-datepicker-actions) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/datepicker.ts (exports
 * `DATEPICKER_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-datepicker/<scenario>).
 * The Qwik side must render the same markup at http://localhost:4173/mat-datepicker/<scenario>/
 * inside its own `[data-parity-root]`. Every fact below was captured live against the real
 * Angular dev-app — see datepicker.ts's own (much longer) header for the full structural/id/aria
 * writeup; this file's header focuses on interaction mechanics, timing, and the dual-root
 * decision.
 *
 * ============================ TWO ROOTS — VERIFIED LIVE ============================
 * Unlike `mat-select`/`mat-autocomplete` (plain DOM sibling, `'inline'` popover location),
 * `MatDatepickerBase._openOverlay()` uses a PLAIN `createOverlayRef()` with no popover-location
 * override — confirmed live the calendar overlay always attaches as a fresh child of
 * `.cdk-overlay-container` under `<body>`, exactly like material-dialog/-menu/-tooltip. Both
 * `[data-parity-root]` (the field + toggle, whose own classes/aria genuinely change across an
 * open/close cycle — floating label, `aria-expanded`, `aria-owns`, the toggle's FocusMonitor
 * classes, the input's formatted value) and `.cdk-overlay-container` (the calendar's own content)
 * carry real, independently-interesting content for almost every scenario — unlike select's/
 * autocomplete's single-root case, there IS something to gain from checking both. Every scenario
 * below therefore gets TWO `test()`s sharing one step list: one at the default `[data-parity-
 * root]` and one at `.cdk-overlay-container` — via the local `parityBoth()` helper — EXCEPT
 * `inline-calendar` (no popup/overlay exists at all, the calendar is rendered directly) and
 * `typed-date-blur` (its steps never open the popup), where a second, permanently-trivial
 * `.cdk-overlay-container` comparison would assert nothing a single root doesn't already cover
 * (the same reasoning select.ts's header gives for skipping its own second root).
 *
 * `.cdk-overlay-container` does NOT exist at all on a fresh page load (confirmed live, count 0 on
 * both apps before any interaction) — so, unlike material-dialog's auto-opening scenarios, there
 * is no mount-timing race for the harness's own pre-step "initial" compare to lose; no scenario
 * below needs `skipInitialCompare`.
 *
 * ============================ OPEN/CLOSE TRANSIENTS — VERIFIED LIVE ============================
 * Opening adds class `mat-datepicker-content-animating` to `.mat-datepicker-content` for ~120ms
 * (confirmed by polling every 30ms right after a toggle click), then removes it — a real,
 * observable transient the harness's own two-frame `settle()` is too short to reliably outlast.
 * `waitOpen()` below waits for the content element to be attached AND for that class to have
 * cleared. Closing (by ANY means — Escape, selecting a date that completes the model, a Cancel/
 * Apply action button) runs the mirror-image exit animation and only detaches the overlay
 * afterwards — confirmed live via polling, the full close takes ~130–150ms from keypress/click to
 * the `.mat-datepicker-content` element actually leaving the DOM. `waitClosed()` below polls for
 * exactly that (element count 0) after every action expected to close the picker.
 *
 * Per-scenario step sequence (see datepicker.ts's header for the full structural/id/aria/
 * mechanism writeup each of these draws on):
 *
 * - `basic-popup`: open (toggle), click day 22 (closes, formats "1/22/2024" into the input),
 *   reopen (shows January 2024 again — the fixed `startAt` wins over the now-set value, so the
 *   active cell is day 1 again, NOT day 22 — contrast with `preselected-value`), Escape (closes,
 *   value unchanged).
 * - `preselected-value`: open (day 15 is both `-active` AND `-selected`/`aria-pressed="true"` from
 *   the very first open, since there's no `startAt` override to fight the value-derived one),
 *   Escape (closes unchanged).
 * - `start-view-year`: open (year grid), click "June 2024" (drills to June's month view), click
 *   "June 10, 2024" (selects, closes, input becomes "6/10/2024").
 * - `start-view-multi-year`: open (multi-year grid, window 1968–1991 — see datepicker.ts's
 *   DETERMINISM PITFALL note for why 1990, not 2024), click "1975" (drills to 1975's year view),
 *   click "March 1975" (drills to March 1975's month view), Escape (closes WITHOUT selecting).
 * - `min-max-filter`: open, click day 16 (an enabled Tuesday — closes, "1/16/2024"). No attempt to
 *   click a disabled cell or the (also disabled, see datepicker.ts) prev/next buttons — Playwright
 *   refuses to click anything carrying `aria-disabled="true"`, same accepted exception as
 *   select.ts's/autocomplete.ts's own disabled-option scenarios.
 * - `inline-calendar`: click "January 20, 2024" (selects — `<p>` becomes "Selected: 1/20/2024",
 *   cell 20 gains `-active`/`-selected`), click "January 5, 2024" (selection MOVES — cell 20 loses
 *   both, cell 5 gains them, `<p>` becomes "Selected: 1/5/2024"). Single root only (see above).
 * - `range-basic`: open, click "January 10, 2024" (start; no range-* classes yet, range
 *   incomplete), HOVER "January 20, 2024" (preview classes appear — see datepicker.ts's RANGE
 *   SELECTION/PREVIEW note for the exact start/end/in-preview combination), click "January 20,
 *   2024" (completes the range, closes; start input "1/10/2024", end input "1/20/2024").
 * - `typed-date-blur`: no popup at all. Fill "2024-02-14" + blur (reformats to "2/14/2024", no
 *   error), clear + fill "not a date" + blur (error appears, text stays literally "not a date" —
 *   no reformat, since the model value is null), clear + fill "3/5/2024" + blur (recovers, "3/5/
 *   2024", error gone). Single root only (see above).
 * - `disabled`: no steps — the toggle carries `aria-disabled`-adjacent native `disabled`, which
 *   Playwright refuses to click; purely a structural compare on both roots (the second root stays
 *   trivially empty throughout, which is itself part of what's being asserted: a disabled
 *   datepicker can never be opened by any means exercised here).
 * - `keyboard-nav`: open (focus lands on January 15, 2024's cell automatically — no extra click
 *   needed, see datepicker.ts's FOCUS RESTORATION note), then ArrowRight → 16, ArrowDown → 23,
 *   ArrowLeft → 22, ArrowUp → 15, Home → 1, End → 31, PageUp → Dec 31 2023, Alt+PageUp → Dec 31
 *   2022, PageDown → Jan 31 2023, Alt+PageDown → Jan 31 2024, Enter (selects Jan 31 2024, closes,
 *   input becomes "1/31/2024") — every intermediate active cell was confirmed live.
 * - `escape-restore-focus`: open (toggle loses focus, the active cell gains it), Escape (closes;
 *   the toggle regains real focus and — for the first time ever on this element — carries
 *   `cdk-focused cdk-program-focused`, see datepicker.ts's FOCUS RESTORATION note).
 * - `actions`: single field — open(0), click "January 15, 2024" (pending, panel STAYS open, no
 *   value committed), click "Cancel" (closes, input still empty); open(0) again, click "January
 *   15, 2024", click "Apply" (closes AND commits, input "1/15/2024"). Range field — open(1), click
 *   "January 5, 2024" (start), click "January 25, 2024" (end — range complete but panel STILL
 *   open, unlike `range-basic`, because an actions portal is registered), click "Apply" (closes,
 *   commits both ends — "1/5/2024"/"1/25/2024").
 * - `touch-ui`: open (global-centered overlay, dark backdrop, `-dialog`/`-content-touch` classes —
 *   see datepicker.ts's TOUCH UI note), click "January 15, 2024" (selects, closes, "1/15/2024").
 */

const route = 'mat-datepicker';
const OVERLAY_ROOT = '.cdk-overlay-container';

const toggle = (page: Page, index = 0) => page.locator('mat-datepicker-toggle button').nth(index);

/** Waits for the calendar content to be attached and past its ~120ms enter animation. */
async function waitOpen(page: Page): Promise<void> {
  await page.waitForSelector('.mat-datepicker-content', {state: 'attached', timeout: 5000});
  await page.waitForFunction(
    () => !document.querySelector('.mat-datepicker-content.mat-datepicker-content-animating'),
    undefined,
    {timeout: 2000},
  );
}

/** Waits for the calendar content to fully detach (past its ~150ms exit animation). */
async function waitClosed(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('.mat-datepicker-content').length === 0,
    undefined,
    {timeout: 3000},
  );
}

/** Clicks a toggle button and waits for its calendar to finish opening. */
const open = (index = 0): ParityStep => ({
  name: `click toggle ${index} (open)`,
  run: async (page: Page) => {
    await toggle(page, index).click();
    await waitOpen(page);
  },
});

/** A calendar cell (day/month/year), matched by its exact accessible name. */
const cell = (page: Page, name: string) => page.getByRole('button', {name, exact: true});

/** Clicks a cell that is expected to close the picker (a single-date selection, or the second
 * end of a complete range with no actions portal registered). */
const clickCellAndClose = (name: string): ParityStep => ({
  name: `click cell "${name}" (closes)`,
  run: async (page: Page) => {
    await cell(page, name).click();
    await waitClosed(page);
  },
});

/** Clicks a cell that is expected to leave the picker open (a drill-down into a coarser view, a
 * start-of-range click, or any click while an actions portal is registered). */
const clickCellStayOpen = (name: string): ParityStep => ({
  name: `click cell "${name}" (stays open)`,
  run: async (page: Page) => {
    await cell(page, name).click();
    await page.waitForTimeout(150);
  },
});

/** Hovers a cell — exercises the range-preview classes (see file header). */
const hoverCell = (name: string): ParityStep => ({
  name: `hover cell "${name}"`,
  run: async (page: Page) => {
    await cell(page, name).hover();
    await page.waitForTimeout(150);
  },
});

/** A navigation key that only moves the active cell — synchronous, no close. */
const nav = (key: string): ParityStep => ({
  name: `press ${key} (nav)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(120);
  },
});

/** Escape — always closes (see file header's OPEN/CLOSE TRANSIENTS section). */
const escape: ParityStep = {
  name: 'press Escape',
  run: async (page: Page) => {
    await page.keyboard.press('Escape');
    await waitClosed(page);
  },
};

/** Enter on the final active cell — selects and closes. */
const enterAndClose: ParityStep = {
  name: 'press Enter (selects, closes)',
  run: async (page: Page) => {
    await page.keyboard.press('Enter');
    await waitClosed(page);
  },
};

/** Clicks a named button (Cancel/Apply) by its accessible text. */
const clickButton = (name: string, opts: {closes: boolean}): ParityStep => ({
  name: `click button "${name}"`,
  run: async (page: Page) => {
    await page.getByRole('button', {name, exact: true}).click();
    if (opts.closes) await waitClosed(page);
    else await page.waitForTimeout(150);
  },
});

/** Replaces an input's value wholesale and blurs it (datepicker.ts's `typed-date-blur`). */
const typeAndBlur = (text: string): ParityStep => ({
  name: `type "${text}" + blur`,
  run: async (page: Page) => {
    const input = page.locator('[data-parity-root] input');
    await input.fill(text);
    await input.blur();
    await page.waitForTimeout(150);
  },
});

/** Runs the same scenario twice: once against the field (`[data-parity-root]`) and once against
 * the calendar overlay (`.cdk-overlay-container`) — see file header for why both matter here. */
function parityBoth(scenario: string, steps: ParityStep[] = []) {
  test(`${scenario} (field)`, ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario,
      steps,
    }));
  test(`${scenario} (calendar)`, ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario,
      steps,
      rootSelector: OVERLAY_ROOT,
    }));
}

test.describe('mat-datepicker — Angular DOM parity', () => {
  parityBoth('basic-popup', [
    open(),
    clickCellAndClose('January 22, 2024'),
    open(), // startAt is fixed, so this reopens on January 1 again, not day 22
    escape,
  ]);

  parityBoth('preselected-value', [open(), escape]);

  parityBoth('start-view-year', [
    open(),
    clickCellStayOpen('June 2024'), // drills into June's month view
    clickCellAndClose('June 10, 2024'),
  ]);

  parityBoth('start-view-multi-year', [
    open(),
    clickCellStayOpen('1975'), // drills into 1975's year view
    clickCellStayOpen('March 1975'), // drills into March 1975's month view
    escape, // closes without ever selecting a day
  ]);

  parityBoth('min-max-filter', [open(), clickCellAndClose('January 16, 2024')]);

  // Single root: no popup/overlay is ever created by this scenario (see file header).
  test('inline-calendar', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'inline-calendar',
      steps: [clickCellStayOpen('January 20, 2024'), clickCellStayOpen('January 5, 2024')],
    }));

  parityBoth('range-basic', [
    open(),
    clickCellStayOpen('January 10, 2024'), // start: no range-* classes yet
    hoverCell('January 20, 2024'), // preview-start/-end/-in-preview appear
    clickCellAndClose('January 20, 2024'), // end: completes the range, auto-closes
  ]);

  // Single root: these steps never open the popup (see file header).
  test('typed-date-blur', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'typed-date-blur',
      steps: [
        typeAndBlur('2024-02-14'), // valid, differently-formatted: reformats to "2/14/2024"
        typeAndBlur('not a date'), // unparseable: error appears, text stays as typed
        typeAndBlur('3/5/2024'), // valid again: recovers
      ],
    }));

  parityBoth('disabled');

  parityBoth('keyboard-nav', [
    open(),
    nav('ArrowRight'), // 15 -> 16
    nav('ArrowDown'), // 16 -> 23
    nav('ArrowLeft'), // 23 -> 22
    nav('ArrowUp'), // 22 -> 15
    nav('Home'), // -> 1
    nav('End'), // -> 31
    nav('PageUp'), // -> Dec 31, 2023
    nav('Alt+PageUp'), // -> Dec 31, 2022
    nav('PageDown'), // -> Jan 31, 2023
    nav('Alt+PageDown'), // -> Jan 31, 2024
    enterAndClose,
  ]);

  parityBoth('escape-restore-focus', [open(), escape]);

  parityBoth('actions', [
    open(0),
    clickCellStayOpen('January 15, 2024'), // pending, actions present: stays open
    clickButton('Cancel', {closes: true}), // discards, input stays empty
    open(0),
    clickCellStayOpen('January 15, 2024'),
    clickButton('Apply', {closes: true}), // commits: input becomes "1/15/2024"
    open(1),
    clickCellStayOpen('January 5, 2024'), // range start
    clickCellStayOpen('January 25, 2024'), // range end: complete but stays open (actions present)
    clickButton('Apply', {closes: true}), // commits both ends
  ]);

  parityBoth('touch-ui', [open(), clickCellAndClose('January 15, 2024')]);
});
