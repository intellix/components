import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-paginator (+ its inner mat-select, mat-icon-button, matTooltip) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/paginator.ts (exports
 * `PAGINATOR_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-paginator/<scenario>).
 * The Qwik side must render the same markup at
 * http://localhost:4173/mat-paginator/<scenario>/ inside its own `[data-parity-root]`. Read
 * paginator.ts's own header first — it documents the full structure, the page-size
 * `<mat-select>`'s paginator-specific behavior (on top of select.ts's general one), the nav
 * buttons' `disabledInteractive` contract, and the exact range-label text algorithm. This
 * file's header focuses on interaction mechanics only.
 *
 * ============================ ONE ROOT ONLY ============================
 * Like select.ts (read its header), the page-size `<mat-select>`'s panel never lands in
 * `.cdk-overlay-container` — it is inserted as a plain DOM sibling inside
 * `[data-parity-root]` (first-ever open: inside `<mat-select>` itself; every later open: inside
 * `<mat-form-field>`). Every scenario below therefore has exactly ONE `test()`, against the
 * default `[data-parity-root]` root.
 *
 * ============================ TOOLTIPS ARE NEVER HOVERED ============================
 * Every nav button carries `[matTooltip]` (text = the corresponding `_intl.*Label`,
 * `matTooltipPosition="above"`, disabled in lockstep with the button itself). `MatTooltip`'s own
 * DOM contract is already covered exhaustively by material-tooltip's spec — no scenario/step
 * below hovers a nav button or asserts `.cdk-overlay-container`. Every click helper below moves
 * the mouse to `(0, 0)` immediately afterwards specifically so the step never finishes
 * mid-hover (Playwright's `.click()` hovers the target first, and `matTooltipShowDelay`
 * defaults to 0 — see paginator.ts's header), even though the only root this spec ever asserts
 * (`[data-parity-root]`) wouldn't see the tooltip panel anyway.
 *
 * ========= PLAYWRIGHT'S `.click()` REFUSES `aria-disabled="true"` — USE `force: true` =========
 * Confirmed live (see paginator.ts's NAV BUTTONS section for the full story): every paginator
 * nav button uses `disabledInteractive`, so a "disabled" one never gets a native `disabled`
 * attribute and would happily dispatch a real click if one reached it — but Playwright's OWN
 * actionability pre-check for `.click()` treats `aria-disabled="true"` as "element is not
 * enabled" and refuses to proceed, timing out after 30s with no `force`. `clickNav` below always
 * takes an explicit `disabled` flag and passes `{force: true}` exactly when the button is
 * `aria-disabled="true"` AT THE MOMENT OF THE CLICK, mirroring material-checkbox's own
 * `{force: true}` pattern for its disabled-click steps. A button that is enabled at click time
 * needs no `force` (confirmed live for every such click below).
 *
 * ======== OPENING THE PAGE-SIZE SELECT: CLICK THE TOUCH-TARGET, NOT THE SELECT ========
 * Confirmed live, genuinely surprising: `paginator.html` renders
 * `<div class="mat-mdc-paginator-touch-target" (click)="selectRef.open()">` as a sibling of
 * `<mat-select>` inside the same form-field infix, CSS-positioned to fully cover it. A
 * Playwright `.click()` aimed at `.mat-mdc-select` itself fails forever
 * (`<div class="mat-mdc-paginator-touch-target"> intercepts pointer events`) — `openPageSizeSelect`
 * below clicks `.mat-mdc-paginator-touch-target`, exactly as a real pointer would.
 *
 * ============================ SELECT PANEL SETTLING ============================
 * The inner `<mat-select>` is the exact same component select.ts's own spec documents (exit
 * animation via a transient `mat-select-panel-exit` class, etc.) — `waitForSelectPanel` below is
 * the same "exact count, none still exiting" pattern select.ts's spec already uses, reused here
 * because the page-size select goes through the identical open/close machinery. The paginator's
 * page-size form field is always OUTLINE appearance (see paginator.ts's header), which has no
 * line-ripple at all, so (unlike select.ts's own spec) no line-ripple wait is needed here.
 *
 * Per-scenario render contract (see paginator.ts for the full structural/id/aria detail):
 *
 * - `basic`: length 100, pageSize 10, pageSizeOptions [5, 10, 25]. No `showFirstLastButtons` —
 *   only `previous`/`next` nav buttons. No steps; this is the static baseline. Initial: range
 *   label "1 – 10 of 100", `previous` disabled, `next` enabled, page-size select shows "10".
 * - `show-first-last`: same inputs plus `showFirstLastButtons`. Steps: click `last` (enabled at
 *   click time) — jumps to the last page (index 9), range "91 – 100 of 100", `next`/`last`
 *   become disabled, `first`/`previous` become enabled; click `first` (enabled at click time) —
 *   back to index 0, range "1 – 10 of 100", `first`/`previous` disabled again.
 * - `hide-page-size`: same inputs plus `hidePageSize` — the entire `.mat-mdc-paginator-page-size`
 *   block is absent. Step: click `next` (enabled) — range becomes "11 – 20 of 100".
 * - `disabled`: length 100, pageSize 10, pageSizeOptions [5, 10, 25], `pageIndex` 1 (deliberately
 *   not a boundary), `disabled` true. Both nav buttons are `aria-disabled="true"` from the start
 *   (the global flag overrides the per-page checks). Step: click `next` WITH `{force: true}` —
 *   a real no-op click (`_buttonClicked`'s `isDisabled` guard), DOM must stay byte-for-byte
 *   identical to the initial snapshot.
 * - `custom-intl`: provides a custom `MatPaginatorIntl` (see paginator.ts for the exact label
 *   strings and `getRangeLabel` format — `"Page N of M"`), `showFirstLastButtons` true. Steps:
 *   click `next` (enabled) — range becomes "Page 2 of 10"; click `last` (enabled at click time) —
 *   jumps to index 9, range "Page 10 of 10", `next`/`last` become disabled with the custom
 *   tooltip text ("Go forward"/"Jump to last") unchanged.
 * - `length-zero`: length 0, pageSize 5, pageSizeOptions [5, 10, 25] (default intl). Both nav
 *   buttons are `aria-disabled="true"` from the start via `hasNextPage()`/`hasPreviousPage()`
 *   alone — no `disabled` input involved. Range label is exactly "0 of 0". Step: click `next`
 *   WITH `{force: true}` — DOM must stay identical to the initial snapshot.
 * - `interactions`: the thorough round-trip — length 100, pageSize 10, pageSizeOptions
 *   [5, 10, 25], `showFirstLastButtons` true, default intl. Steps (every click below is on an
 *   ENABLED button/option, so none needs `force`): next, next, previous, last, first (classic
 *   page navigation, exercising every nav button and the resulting range-label/disabled-state
 *   changes — see paginator.ts for the exact expected values at each step), then open the
 *   page-size select via its touch-target (this select's FIRST-EVER open — the panel lands
 *   inside `<mat-select>` itself, per select.ts's documented CD-timing quirk) and choose "25"
 *   (`_changePageSize` recomputes `pageIndex`/range — becomes "1 – 25 of 100"), then open the
 *   select again (steady-state open this time — panel lands inside `<mat-form-field>`) and
 *   choose "5" (range becomes "1 – 5 of 100").
 */

const route = 'mat-paginator';

const navButton = (name: 'first' | 'previous' | 'next' | 'last') =>
  `.mat-mdc-paginator-navigation-${name}`;

/**
 * Clicks a nav button and moves the mouse away afterwards (see the file header — avoids ever
 * finishing a step mid-hover over a tooltip trigger). `disabled` must be `true` when the button
 * is `aria-disabled="true"` AT THE MOMENT OF THIS CLICK — Playwright's own actionability
 * pre-check otherwise refuses `.click()` on it forever (see the file header); pass `{force:
 * true}` in that case to reach the real (no-op) click.
 */
const clickNav = (name: 'first' | 'previous' | 'next' | 'last', disabled = false): ParityStep => ({
  name: `click ${name}${disabled ? ' (disabled, force)' : ''}`,
  run: async (page: Page) => {
    await page.locator(navButton(name)).click(disabled ? {force: true} : undefined);
    await page.mouse.move(0, 0);
  },
});

/** Waits until exactly `count` `.mat-mdc-select-panel` elements exist and none is mid-exit. */
const waitForSelectPanel = (page: Page, count: number) =>
  page.waitForFunction(
    (n: number) => {
      const panels = document.querySelectorAll('.mat-mdc-select-panel');
      return (
        panels.length === n &&
        Array.from(panels).every(p => !p.classList.contains('mat-select-panel-exit'))
      );
    },
    count,
    {timeout: 5000},
  );

/**
 * Opens the page-size select by clicking its touch-target (NOT `.mat-mdc-select` — see the file
 * header for why that locator's own `.click()` fails forever).
 */
const openPageSizeSelect: ParityStep = {
  name: 'open page-size select (click touch-target)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] .mat-mdc-paginator-touch-target').click();
    await waitForSelectPanel(page, 1);
  },
};

/** Clicks an open page-size option by its accessible name (the bare number) and waits for the
 * single-selection panel to close. */
const choosePageSize = (value: string): ParityStep => ({
  name: `choose page size "${value}"`,
  run: async (page: Page) => {
    await page.getByRole('option', {name: value, exact: true}).click();
    await waitForSelectPanel(page, 0);
    await page.mouse.move(0, 0);
  },
});

test.describe('mat-paginator — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('show-first-last', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'show-first-last',
      steps: [clickNav('last'), clickNav('first')],
    }));

  test('hide-page-size', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'hide-page-size',
      steps: [clickNav('next')],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled',
      steps: [clickNav('next', /* disabled */ true)],
    }));

  test('custom-intl', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-intl',
      steps: [clickNav('next'), clickNav('last')],
    }));

  test('length-zero', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'length-zero',
      steps: [clickNav('next', /* disabled */ true)],
    }));

  test('interactions', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'interactions',
      steps: [
        clickNav('next'),
        clickNav('next'),
        clickNav('previous'),
        clickNav('last'),
        clickNav('first'),
        openPageSizeSelect,
        choosePageSize('25'),
        openPageSizeSelect,
        choosePageSize('5'),
      ],
    }));
});
