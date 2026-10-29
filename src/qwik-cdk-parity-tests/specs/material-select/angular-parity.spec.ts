import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-select (+ mat-option, mat-optgroup, inside mat-form-field) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/select.ts (exports
 * `SELECT_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-select/<scenario>). The
 * Qwik side must render the same markup at http://localhost:4173/mat-select/<scenario>/ inside
 * its own `[data-parity-root]`. Every fact below was captured live against the real Angular
 * dev-app (not just read from source) — see select.ts's own header for the structural/id/aria
 * notes; this file's header focuses on interaction mechanics and the single-vs-dual-root
 * decision.
 *
 * ============================ ONE ROOT ONLY — VERIFIED LIVE ============================
 * Every other overlay-based component with a parity spec (menu, tooltip, dialog) needs a SECOND
 * root (`rootSelector: '.cdk-overlay-container'`) because its panel is appended to a separate
 * `.cdk-overlay-container` under `<body>`. `mat-select` is different: as select.ts's header
 * documents in detail (read it first), `MatSelect` passes `_popoverLocation = 'inline'` to its
 * `cdk-connected-overlay`, so `FlexibleConnectedPositionStrategy.getPopoverInsertionPoint()`
 * returns a real element and `OverlayRef._attachHost()` inserts the overlay's host via
 * `customInsertionPoint.after(this._host)` — i.e. as a plain DOM sibling inside the page's own
 * content, NEVER into `.cdk-overlay-container`. Confirmed live, repeatedly, across every
 * scenario below: `.cdk-overlay-container` is absent until a select first opens, and even then
 * it is created EMPTY and stays that way — it exists purely as a side effect of
 * `FlexibleConnectedPositionStrategy._getContainerRect()` (src/cdk/overlay/position/
 * flexible-connected-position-strategy.ts), which calls `overlayContainer.getContainerElement()`
 * unconditionally (even for inline/popover overlays) solely to borrow its full-viewport
 * dimensions as a Safari workaround for measuring available space — it is never used as an
 * insertion point for an inline popover. Confirmed by direct inspection: after opening, the only
 * `.cdk-overlay-container` in the document is `<div class="cdk-overlay-container" style="">`,
 * permanently childless. Because of this, there is nothing a second `rootSelector` compare would
 * ever usefully assert (the harness already asserts `aCount === qCount` for ANY selector, so a
 * hypothetical second `.cdk-overlay-container` test would just be asserting "0 on both sides,
 * forever" — true, but not worth a dedicated test). Every scenario below therefore has exactly
 * ONE `test()`, against the default `[data-parity-root]` root, which — unlike every prior
 * overlay-based component's parity spec — is enough to see the ENTIRE select, panel included,
 * at every step.
 *
 * ============== FIRST OPEN vs. EVERY LATER OPEN — VERIFIED LIVE, NON-OBVIOUS ==============
 * A genuinely surprising, 100%-reproducible (not flaky) Angular timing artifact, confirmed by
 * opening/closing the same select 3 times in a row and inspecting the popover's parent each
 * time: on a select's FIRST-EVER open, its overlay host lands as a child of `<mat-select>`
 * itself (a sibling of `.mat-mdc-select-trigger`) — but on the SECOND and every subsequent open,
 * it lands as a child of `<mat-form-field>` (a sibling of `.mat-mdc-text-field-wrapper`,
 * matching the "preferred origin" described in select.ts's header). The cause: `MatSelect.open()`
 * assigns `this._preferredOverlayOrigin = this._parentFormField.getConnectedOverlayOrigin()`
 * *imperatively*, then calls `this._overlayDir.attachOverlay()` synchronously in the same
 * function — but the template binding that actually feeds the overlay directive,
 * `[cdkConnectedOverlayOrigin]="_preferredOverlayOrigin || fallbackOverlayOrigin"`, is only
 * re-evaluated by Angular's own change-detection pass, which runs AFTER the click handler
 * returns, i.e. too late for the attach that already happened. On the very first open in the
 * component's life `_preferredOverlayOrigin` was still `undefined` as of the LAST CD pass, so the
 * directive's cached `origin` input is still `fallbackOverlayOrigin` (the select's own trigger
 * div) when `attachOverlay()` reads it. Every later open benefits from the CD pass that already
 * ran after the first open/close cycle, so the binding is current from then on. Every scenario
 * below that opens the panel more than once therefore exercises BOTH shapes; 'fill-basic' is the
 * most thorough. The Qwik port does not need to literally reproduce Angular's binding-staleness
 * mechanism, but it DOES need to produce the exact same two DOM shapes at the exact same steps
 * for the diff to pass — this is flagged prominently in the task report as a risk area; it may
 * be more practical to special-case/document this as an accepted difference in
 * lib/material-parity.ts than to replicate the Angular timing bug verbatim.
 *
 * ========================== BACKDROP COVERS THE FULL VIEWPORT ==========================
 * The select's own bounding-box host (`.cdk-overlay-popover.cdk-overlay-connected-position-
 * bounding-box`) is sized/positioned to just the trigger's own quadrant of the viewport (e.g.
 * `inset: 152px auto auto 32px; width: 1248px; height: 568px;` for a trigger near the
 * dev-app's default top-left content position) — NOT the full viewport. Despite that, a click
 * anywhere else on the page still closes the panel, because `src/cdk/overlay/_index.scss` has an
 * explicit override: `.cdk-overlay-popover .cdk-overlay-backdrop { position: fixed; z-index:
 * auto; }` — switching the backdrop from `position: absolute` (which would confine it to its
 * small popover parent) to `position: fixed`, so its `top/right/bottom/left: 0` resolves against
 * the VIEWPORT regardless of DOM nesting. Confirmed live: `getBoundingClientRect()` on the
 * backdrop reports the full `{top:0, left:0, width:1280, height:720}` viewport even though its
 * DOM parent is a small, offset box. A corner click (5,5) reliably lands on, and is captured by,
 * the backdrop (`elementFromPoint(5,5)` returns the backdrop div) — same `backdropClick` pattern
 * as material-menu's spec, reused verbatim below.
 *
 * ============================ TYPEAHEAD DEBOUNCE — 200ms ============================
 * Letter-key typeahead (as opposed to Home/End/arrow navigation, which update synchronously
 * inside the keydown handler — see `ListKeyManager.onKeydown`'s explicit switch cases for
 * TAB/arrows/HOME/END, all synchronous) goes through `ListKeyManager`'s `default` branch, which
 * defers to `Typeahead.handleKey()` — internally debounced 200ms (`withTypeAhead`'s default
 * `debounceInterval`) so multi-letter words can accumulate before the match is applied. A
 * typeahead step below therefore waits out this debounce explicitly (350ms, a safety margin
 * over the 200ms default) BEFORE the harness's own two-animation-frame settle runs — otherwise
 * the comparison would race a timer that has nothing to do with rendering.
 *
 * ============================ EXIT ANIMATION ============================
 * Closing (`MatSelect._exitAndDetach`) adds `mat-select-panel-exit` to the (still fully present,
 * still fully populated) panel element and waits for either its `animationend` or a 200ms
 * fallback timer before actually detaching the overlay — a real, observable transient state,
 * same category as material-menu's `mat-menu-panel-animating`. `waitForSelectPanel` below polls
 * for the exact expected `.mat-mdc-select-panel` count AND that none of them still carries
 * `mat-select-panel-exit`, so every step that opens/closes the panel always lands on a fully
 * settled DOM on each independently-timed app before the structural diff runs.
 *
 * Per-scenario render contract (see select.ts for full structural/id/aria detail):
 *
 * - `fill-basic`: fill, label "Fruit", 4 options (Apple/Banana/Cherry[disabled]/Date), distinct
 *   first letters chosen specifically to exercise typeahead unambiguously. The single most
 *   thorough scenario — exercises click-open (both the first-open and steady-state overlay
 *   shapes), ArrowDown/Home/End moving the active (not yet selected) option, Enter
 *   selecting-and-closing, Escape closing, closed-select letter typeahead (selects directly,
 *   panel never opens), open-panel letter typeahead onto the DISABLED option (highlights only —
 *   confirmed live `_skipPredicate` returns `option.disabled` ONLY while closed, so Cherry is
 *   reachable/highightable while open but unreachable while closed), Tab closing (confirmed live:
 *   tabbing out with a DISABLED option active does NOT select it — `_selectViaInteraction`'s own
 *   `!this.disabled` guard — so the previous selection survives), and backdrop-click closing.
 * - `outline-basic`: identical content, `[appearance]="'outline'"` — isolates the outline
 *   skeleton (already documented exhaustively in form-field.ts/its spec) combined with a select;
 *   steps are a shorter version of fill-basic's (open, move, select, reopen, close) since the
 *   keyboard-interaction contract itself doesn't vary by appearance.
 * - `preselected-value`: fill, label "Fruit", 3 options (Apple/Banana/Cherry), `value = 'banana'`
 *   from the start — no FormControl, just `[(value)]`. Confirmed live: label floats and the
 *   trigger shows "Banana" from the very first render (no focus needed); opening highlights the
 *   ALREADY-SELECTED option (Banana), not the first enabled one (contrast with fill-basic's empty
 *   start, which highlights Apple) — `_highlightCorrectOption`'s `!this.empty` branch. Closing via
 *   Escape without choosing anything else leaves the selection unchanged.
 * - `placeholder`: fill, NO `<mat-label>` at all (isolates `mat-mdc-select-placeholder` from the
 *   floating-label machinery entirely — confirmed live: with no label, `_hasFloatingLabel()` is
 *   false so `mat-form-field-hide-placeholder` never applies, and the select's own
 *   `aria-labelledby` falls back to `_valueId` — i.e. `mat-select-value-N`, since
 *   `_getTriggerAriaLabelledby` falls back to `this._valueId` when there's no label id and no
 *   `ariaLabelledby` input — confirmed live), `[placeholder]="'Choose a fruit'"`, 3 options.
 *   Step selects an option by clicking it, replacing the placeholder span with the normal
 *   value-text span.
 * - `multiple`: fill, label "Toppings", `[multiple]="true"`, 4 toppings, 2 preselected
 *   (`['mushroom', 'onion']`) so the initial trigger text is already the `, `-joined
 *   "Mushroom, Onion" and every option already carries its full-size pseudo-checkbox (confirmed
 *   live: `multiple` options ALWAYS get a leading `<mat-pseudo-checkbox appearance="full">`
 *   regardless of selected state, unlike single-selection's selected-only/minimal one). Steps
 *   toggle a 3rd topping ON (click, panel stays open, trigger becomes 3-joined) then toggle one
 *   of the original two OFF (click again, panel still open, back to 2-joined) — confirmed live
 *   both ways, then Escape closes.
 * - `optgroups`: fill, label "Pokemon", two `<mat-optgroup>`s — "Grass" (enabled, 2 options) and
 *   "Fire" (`[disabled]="true"`, 2 options). Confirmed live: `MatOption.disabled`'s getter ORs in
 *   `this.group.disabled`, so both options inside the disabled group get `mdc-list-item--disabled
 *   aria-disabled="true"` even though neither has its own `[disabled]` binding; the group itself
 *   gets `role="group" aria-disabled="true" aria-labelledby="mat-optgroup-label-N"` (not inert —
 *   `MatSelect` never sets `inertGroups`, unlike `MatAutocomplete`, which sets it on Safari only).
 *   Step: open, then End — confirmed live this jumps straight into the DISABLED group's last
 *   option ("Vulpix", highlighted, not selected, same open-mode skip-predicate behavior as
 *   fill-basic's Cherry) — then Escape closes without selecting anything.
 * - `disabled`: fill, label "Fruit", `[disabled]="true"`, preselected `value = 'banana'` (so the
 *   disabled contract is checked against a NON-empty display too, not just an empty one).
 *   Confirmed live: host gets `aria-disabled="true"` and `tabindex="-1"`; critically, Playwright
 *   itself refuses to `.click()` an element with `aria-disabled="true"` (actionability check), so
 *   — exactly like form-field.ts's own 'disabled' scenario — there are NO steps here beyond the
 *   initial structural compare; `.cdk-overlay-container`/popover never get created at all for
 *   this scenario since the panel never opens.
 * - `required-error-state`: fill, label "Fruit", `[formControl]="control"` built with
 *   `Validators.required`, 3 options, `@if (control.invalid) { <mat-error> }`. Confirmed live:
 *   the select gets `aria-required="true"` and the label gets its required-marker `<span>` from
 *   the FIRST render (`MatSelect.required`'s getter checks `ngControl.control.hasValidator(...)`,
 *   same mechanism as `MatInput`), with NO literal `required` attribute possible (selects have no
 *   such native IDL property). `MatSelect.close()` (unconditionally, by ANY dismissal — Escape,
 *   backdrop, Tab, or picking an option) calls `this._onTouched()`, so simply opening and closing
 *   the panel WITHOUT choosing anything is enough to flip `ng-untouched`→`ng-touched`,
 *   `mat-mdc-select-invalid`/`mat-form-field-invalid` to appear, `aria-invalid` to flip to
 *   `"true"` (no `empty && required` short-circuit here, unlike `MatInput` — see select.ts's
 *   header), and `<mat-error>You must make a selection</mat-error>` to render. A second
 *   open→ArrowDown→Enter cycle (selecting "Banana") then clears all of that back to
 *   `ng-dirty ng-valid`, confirming the recovery path too — mirrors form-field.ts's own
 *   'error-state' scenario's thoroughness, condensed to what's select-specific.
 * - `panel-class`: fill, label "Color", `[panelClass]="'custom-select-panel'"`, 3 colors. Step:
 *   open — confirmed live the custom class is merged into the panel's existing class list
 *   (`mat-mdc-select-panel mdc-menu-surface mdc-menu-surface--open custom-select-panel
 *   mat-select-panel-animations-enabled mat-primary`), not a replacement — then Escape closes.
 * - `custom-trigger`: fill, label "Toppings", `[multiple]="true"`, a `<mat-select-trigger>`
 *   projecting a `<span>` with the first selected value plus a conditional "(+N more)" `<span>`
 *   (mirrors upstream's `select-custom-trigger` example), 3 toppings preselected
 *   (`['cheese','mushroom','onion']`). Confirmed live: the custom trigger renders even while
 *   CLOSED (its condition is `!empty`, unrelated to `panelOpen`) and COMPLETELY REPLACES the
 *   plain `.mat-mdc-select-min-line` span — the two are mutually exclusive, never both present.
 *   Initial content: `<span>cheese</span><span class="extra-count">(+2 more)</span>`. Step:
 *   open, click "Onion" to deselect it (panel stays open, multiple selection) — confirmed live
 *   the custom trigger content updates reactively to "(+1 more)" — then Escape closes.
 */

const route = 'mat-select';

const select = (page: Page, index = 0) =>
  page.locator('[data-parity-root] .mat-mdc-select').nth(index);

/**
 * Waits out the fill appearance's line-ripple deactivation transition (~180ms, only runs once
 * the host has been focused-then-blurred — see form-field.ts's big LINE-RIPPLE comment, same
 * mechanism). VERIFIED LIVE to matter here: `Tab` and a backdrop click both blur the select host
 * as a side effect of moving focus away (confirmed: `document.activeElement` becomes `<body>`
 * after either), which — exactly like a plain `matInput` blurring — flips the form field's line
 * ripple from `active` to `active deactivating` together for ~180ms before both classes are
 * removed. Without this wait, a step that closes the panel via Tab/backdrop can race this
 * transition on two independently-timed pages, leaving one snapshot mid-transition and the other
 * already settled — a false-positive diff unrelated to select's own contract. A no-op when
 * there's no line-ripple (outline appearance) or nothing was actually transitioning (every other
 * close path below keeps the host focused, so this resolves immediately).
 */
const waitForLineRippleSettled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector(
        '[data-parity-root] .mdc-line-ripple--active.mdc-line-ripple--deactivating',
      ),
    undefined,
    {timeout: 2000},
  );

/**
 * Waits until exactly `count` `.mat-mdc-select-panel` elements exist AND none of them is
 * mid-exit-animation (`mat-select-panel-exit`, added on close — see the file header), THEN waits
 * out any in-flight line-ripple transition (see `waitForLineRippleSettled` above). Used after
 * every action that opens or closes the panel, so the structural compare that follows always
 * sees a fully settled DOM on both independently-timed apps, never a mid-transition frame — same
 * pattern as material-menu's `waitForPanelCount`.
 */
const waitForSelectPanel = async (page: Page, count: number) => {
  await page.waitForFunction(
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
  await waitForLineRippleSettled(page);
};

/** Clicks the trigger and waits for the panel to finish opening. */
const open = (index = 0): ParityStep => ({
  name: `click trigger ${index} (open)`,
  run: async (page: Page) => {
    await select(page, index).click();
    await waitForSelectPanel(page, 1);
  },
});

/** A navigation key (ArrowDown/Up/Home/End) that only moves the active option — synchronous,
 * no panel-count change, no debounce (see `ListKeyManager.onKeydown`'s switch cases). */
const nav = (key: string): ParityStep => ({
  name: `press ${key} (nav)`,
  run: (page: Page) => page.keyboard.press(key),
});

/** A single letter key, relying on `ListKeyManager`'s typeahead path (200ms debounced — see the
 * file header). Waits out the debounce explicitly before returning. */
const typeahead = (letter: string): ParityStep => ({
  name: `press "${letter}" (typeahead)`,
  run: async (page: Page) => {
    await page.keyboard.press(letter);
    await page.waitForTimeout(350);
  },
});

/** Enter/Escape/Tab — each may open, close, or leave the panel count unchanged depending on
 * context, so the expected count is passed explicitly per call site. */
const keyTo = (key: string, expectedPanelCount: number): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitForSelectPanel(page, expectedPanelCount);
  },
});

/** Clicks an open option by its accessible name and waits for the resulting panel count to
 * settle (0 for single-selection, which closes; 1 for multiple, which stays open). */
const clickOption = (name: string, expectedPanelCount: number): ParityStep => ({
  name: `click option "${name}"`,
  run: async (page: Page) => {
    await page.getByRole('option', {name, exact: true}).click();
    await waitForSelectPanel(page, expectedPanelCount);
  },
});

/**
 * Clicks the full-viewport backdrop near a corner (`{5,5}`), well clear of the panel itself —
 * same technique as material-menu's `backdropClick` helper (a locator-based click, not raw
 * coordinates, so Playwright's own actionability wait absorbs the backdrop's fade-in). See the
 * file header for why this reliably hits the backdrop despite the select's small popover
 * bounding box (`position: fixed` override on `.cdk-overlay-popover .cdk-overlay-backdrop`).
 */
const backdropClick = (expectedPanelCount: number): ParityStep => ({
  name: 'click backdrop',
  run: async (page: Page) => {
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}});
    await waitForSelectPanel(page, expectedPanelCount);
  },
});

test.describe('mat-select — Angular DOM parity', () => {
  test('fill-basic', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'fill-basic',
      steps: [
        open(), // first-ever open: popover lands inside <mat-select> (see file header)
        nav('ArrowDown'), // Apple -> Banana
        nav('ArrowDown'), // Banana -> Cherry (disabled, still reachable while open)
        nav('Home'), // -> Apple
        nav('End'), // -> Date
        keyTo('Enter', 0), // selects Date, closes
        open(), // second open: steady-state popover location (inside <mat-form-field>)
        keyTo('Escape', 0),
        typeahead('b'), // closed-select typeahead: selects Banana directly, panel never opens
        open(),
        typeahead('c'), // open-panel typeahead onto the DISABLED option: highlights only
        keyTo('Tab', 0), // closes; disabled active item is never auto-selected on tab-out
        open(),
        backdropClick(0),
      ],
    }));

  test('outline-basic', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'outline-basic',
      steps: [open(), nav('ArrowDown'), keyTo('Enter', 0), open(), keyTo('Escape', 0)],
    }));

  test('preselected-value', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'preselected-value',
      steps: [open(), nav('ArrowDown'), keyTo('Escape', 0)],
    }));

  test('placeholder', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'placeholder',
      steps: [open(), clickOption('Banana', 0)],
    }));

  test('multiple', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'multiple',
      steps: [
        open(),
        clickOption('Pepperoni', 1), // toggle on: panel stays open
        clickOption('Mushroom', 1), // toggle off: panel stays open
        keyTo('Escape', 0),
      ],
    }));

  test('optgroups', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'optgroups',
      steps: [open(), nav('End'), keyTo('Escape', 0)],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'disabled',
    }));

  test('required-error-state', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'required-error-state',
      steps: [
        open(),
        keyTo('Escape', 0), // touched, invalid, mat-error appears
        open(),
        nav('ArrowDown'), // Apple -> Banana
        keyTo('Enter', 0), // selects Banana, error clears
      ],
    }));

  test('panel-class', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'panel-class',
      steps: [open(), keyTo('Escape', 0)],
    }));

  test('custom-trigger', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'custom-trigger',
      steps: [open(), clickOption('Onion', 1), keyTo('Escape', 0)],
    }));
});
