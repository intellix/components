import {Component, Injectable, Type} from '@angular/core';
import {MatPaginatorIntl, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {Subject} from 'rxjs';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-paginator/. See
// button-toggle.ts for the general approach. `<mat-paginator>` carries a fixed
// `style="width: 600px"` on the host itself (same reason select.ts's scenarios fix their
// `<mat-form-field>` width — the page-size `<mat-select>`'s panel measures real layout). All
// component-level inputs use `[prop]` bindings per the harness's static-attribute-echo rule.
// `aria-label="Select page"` is a plain, non-reflected HTML attribute (MatPaginator has no
// `@Input('aria-label')`), matching upstream's own `paginator-overview-example.html` — safe to
// write as a literal attribute because it is not also an `@Input` name (unlike the checkbox/
// select inputs the rule warns about).
//
// NON-OBVIOUS, VERIFIED LIVE (http://localhost:4200/qwik-parity/mat-paginator/<scenario>,
// Chromium) — read this before writing the Qwik route:
//
// ============================ STRUCTURE (paginator.html) ============================
// <mat-paginator class="mat-mdc-paginator" role="group" [aria-label]> (ViewEncapsulation.None)
//   <div class="mat-mdc-paginator-outer-container">
//     <div class="mat-mdc-paginator-container">
//       @if (!hidePageSize) {
//         <div class="mat-mdc-paginator-page-size">
//           <div class="mat-mdc-paginator-page-size-label" id="mat-paginator-page-size-label-#"
//                aria-hidden="true">{{itemsPerPageLabel}}</div>
//           @if (displayedPageSizeOptions.length > 1) {
//             <mat-form-field appearance="outline" class="mat-mdc-paginator-page-size-select">
//               <mat-select aria-labelledby="mat-paginator-page-size-label-#" hideSingleSelectionIndicator ...>
//                 <mat-option *for pageSizeOption>...</mat-option>
//               </mat-select>
//               <div class="mat-mdc-paginator-touch-target" (click)="selectRef.open()"></div>
//             </mat-form-field>
//           } @else {
//             <div class="mat-mdc-paginator-page-size-value">{{pageSize}}</div>
//           }
//         </div>
//       }
//       <div class="mat-mdc-paginator-range-actions">
//         <div class="mat-mdc-paginator-range-label" aria-atomic="true" aria-live="polite"
//              role="status">{{rangeLabel}}</div>
//         [first] [previous] [next] [last] — each <button matIconButton type="button"> below
//       </div>
//     </div>
//   </div>
// </mat-paginator>
//
// `_formFieldAppearance` (paginator.ts constructor) defaults to `'outline'` whenever no
// `MAT_PAGINATOR_DEFAULT_OPTIONS` is provided — none of the scenarios below provide that token,
// so every page-size `<mat-form-field>` below is OUTLINE appearance (the exhaustive outline
// skeleton — notched-outline divs, `.mdc-notched-outline__notch`, etc. — is already documented
// in form-field.ts/its spec; not repeated here). `[color]="color"` is passed through to the
// form field too, but no scenario below binds `MatPaginator.color`, so it is always `null`/no
// color class.
//
// ============================ PAGE-SIZE SELECT — CONFIRMED LIVE ============================
// The inner `<mat-select>` is the SAME component select.ts/its spec document exhaustively
// (inline popover location, `_popoverLocation = 'inline'`, first-open-vs-steady-state landing
// spot, exit-animation class, etc.) — read select.ts's header first. Paginator-specific
// details, confirmed live, not covered there:
//   - `hideSingleSelectionIndicator` is written as a bare, static attribute directly on
//     `<mat-select>` in paginator.html itself (not a scenario choice) — confirmed live the
//     selected page-size option NEVER gets ANY pseudo-checkbox (full or the single-selection
//     "minimal" trailing checkmark select.ts's own single-selection scenarios document) —
//     the option's only visual state is its `mdc-list-item--selected`/`aria-selected="true"`
//     classes/attribute, same as everywhere else.
//   - `[aria-labelledby]="_pageSizeLabelId"` on `<mat-select>` points at the sibling
//     `.mat-mdc-paginator-page-size-label` div's `id` (NOT a `<mat-label>` — paginator's
//     form field has no label element and no floating-label machinery at all: `_hasFloatingLabel()`
//     is false, so the select's trigger never shows a placeholder either — it always shows the
//     current page size, immediately, from the very first render).
//   - The `<div class="mat-mdc-paginator-touch-target" (click)="selectRef.open()">` is a
//     DIRECT CHILD of `<mat-form-field>` in the template, same content-projection level as
//     `<mat-select>` itself — `mat-form-field`'s own template (form-field.html) has exactly one
//     unnamed `<ng-content>`, inside `.mat-mdc-form-field-infix`, so BOTH land inside
//     `.mat-mdc-form-field-infix` as siblings, in source order: `<mat-select>` first, the
//     touch-target div second. This does NOT interact with the select panel's own insertion
//     point (the panel/popover host is inserted as a sibling of the OUTER
//     `.mat-mdc-text-field-wrapper`, per select.ts's header — a different, higher level of
//     nesting than the infix — so the touch-target div's position inside the infix is
//     unaffected by whether the panel is open).
//   - CONFIRMED LIVE, genuinely surprising: the touch-target div is CSS-positioned to fully
//     COVER `<mat-select>` and sits after it in paint order, so it — not the select — receives
//     the click. A Playwright `.click()` aimed at `[data-parity-root] .mat-mdc-select` itself
//     fails its actionability check forever (`<div class="mat-mdc-paginator-touch-target">
//     intercepts pointer events`, confirmed live by letting it time out) — the spec must target
//     `.mat-mdc-paginator-touch-target` to open the page-size select, exactly as a real user
//     clicking anywhere in that area would hit the touch-target first. This is paginator-
//     specific; it does not apply to select.ts's own scenarios (no touch-target there).
//   - `_displayedPageSizeOptions.length > 1` is true for every scenario below (every
//     `pageSizeOptions` array below has 3 entries and already includes the current `pageSize`),
//     so every scenario renders the `<mat-select>` branch. The `@else` branch
//     (`<div class="mat-mdc-paginator-page-size-value">{{pageSize}}</div>`, taken when there is
//     0 or 1 displayed option) is a real, documented-but-NOT-exercised branch here — an accepted
//     gap, same category as select.ts's un-exercised `ariaLabel` input.
//   - First-ever open of THIS select instance lands inside `<mat-select>` itself (sibling of
//     `.mat-mdc-select-trigger`) rather than inside `<mat-form-field>` (sibling of
//     `.mat-mdc-text-field-wrapper`) — select.ts's documented CD-timing quirk, confirmed live
//     here too. Only `interactions` below opens the select (and only once), so it only ever
//     exercises the FIRST-open shape; see select.ts's `fill-basic` scenario for the steady-state
//     shape if the Qwik port needs to special-case it.
//
// ============================ NAV BUTTONS — CONFIRMED LIVE ============================
// All four nav buttons (`first`/`previous`/`next`/`last`, `first`/`last` only present when
// `showFirstLastButtons`) are `<button matIconButton type="button" disabledInteractive>` —
// every one carries the static `disabledInteractive` attribute UNCONDITIONALLY (not tied to any
// scenario input), which changes how `[disabled]` renders per `MatButtonBase`
// (src/material/button/button-base.ts):
//   - `_getDisabledAttribute()` → `disabledInteractive || !disabled ? null : true` — since
//     `disabledInteractive` is always true here, the native `disabled` ATTRIBUTE is NEVER
//     present on any paginator nav button, even when logically disabled. At the raw DOM level
//     this means the button still DISPATCHES a real `click` event when activated — the reason
//     the upstream code comment on `_buttonClicked` gives ("paginator buttons do [dispatch
//     click], because we're using disabledInteractive"); `MatPaginator._buttonClicked` itself
//     re-checks `isDisabled` and no-ops the navigation, so activating a disabled nav button is a
//     real click that does nothing, not a click the browser itself blocks.
//     HOWEVER — confirmed live, and the opposite of this file's first assumption — Playwright's
//     OWN actionability pre-check for `.click()` treats `aria-disabled="true"` as "not enabled"
//     and refuses to proceed at all (`locator.click: Timeout ... element is not enabled`), even
//     though the DOM itself has no `disabled` attribute and would happily dispatch the click.
//     Every scenario/step below that clicks a button carrying `aria-disabled="true"` at click
//     time (`disabled`, `length-zero`) therefore MUST pass `{force: true}` (same escape hatch
//     material-checkbox's spec already uses for its own disabled-click steps) to bypass
//     Playwright's pre-check and reach the real, do-nothing click described above. Steps that
//     click a button that is still ENABLED at click time (e.g. `show-first-last`'s `last`,
//     clicked while on page 0) need no `force`.
//   - `_getAriaDisabled()` → `true` (string, stringifies to `aria-disabled="true"`) exactly
//     when `disabled && disabledInteractive`, else attribute is absent entirely (not
//     `"false"`). Confirmed live.
//   - `[tabindex]="_previousButtonsDisabled() ? -1 : null"` /
//     `_nextButtonsDisabled() ? -1 : null"` on the template (paginator.html) is a SEPARATE,
//     explicit binding, layered on top of `MatButtonBase`'s own `[attr.tabindex]="_getTabIndex()"`
//     host binding (`_getTabIndex()` returns the component's own `tabIndex` input verbatim for a
//     non-anchor button) — net effect: `tabindex="-1"` attribute present when disabled,
//     ABSENT (not `tabindex="0"`) when enabled, confirmed live.
//   - `_previousButtonsDisabled()` = `disabled || !hasPreviousPage()`; `hasPreviousPage()` =
//     `pageIndex >= 1 && pageSize != 0`. `_nextButtonsDisabled()` = `disabled ||
//     !hasNextPage()`; `hasNextPage()` = `pageIndex < getNumberOfPages() - 1 && pageSize != 0`.
//     `first`/`last` share the SAME disabled predicate as `previous`/`next` respectively (not
//     their own "am I already on page 0/last" check — confirmed by reading `_buttonClicked`'s
//     call sites in paginator.html, and live: at `pageIndex=0` both `first` AND `previous` are
//     disabled together, never independently).
//   - Each button also carries `[matTooltip]`/`[matTooltipDisabled]="<same predicate>"
//     matTooltipPosition="above"` (text = the corresponding `_intl.*Label`). No scenario below
//     hovers a nav button or asserts `.cdk-overlay-container` — tooltip.ts/its spec already
//     cover `MatTooltip` exhaustively, and `showDelay` defaults to 0 (`MAT_TOOLTIP_DEFAULT_OPTIONS`),
//     so a step that merely clicks a button (Playwright's `.click()` hovers first) can
//     schedule a real tooltip show a tick later while the mouse stays put; every click helper
//     below moves the mouse to `(0, 0)` afterwards so no step is left mid-hover at snapshot
//     time, even though the tooltip overlay itself lives outside `[data-parity-root]` (the only
//     root any scenario below asserts).
//   - Ripple: every button click produces a transient `.mat-ripple-element` inside the button's
//     `.mat-mdc-button-ripple` host — already handled generically by the harness's
//     `snapshotParityRoot` (waits out any non-persistent `.mat-ripple-element` before every
//     compare), no scenario-specific handling needed.
//
// ============================ RANGE LABEL TEXT — CONFIRMED LIVE ============================
// Default `MatPaginatorIntl.getRangeLabel(page, pageSize, length)`: `0 of ${length}` when
// `length === 0 || pageSize === 0`; otherwise `${startIndex + 1} – ${endIndex} of ${length}`
// (an EN DASH `–`, U+2013, surrounded by plain spaces — not a hyphen). `startIndex = page *
// pageSize`; `endIndex = startIndex < length ? min(startIndex + pageSize, length) : startIndex
// + pageSize`. Confirmed live for `basic` below: page 0, pageSize 10, length 100 → exactly
// `"1 – 10 of 100"` (verified via `textContent`, not just read from source).
//
// Per-scenario render contract:
//
// - `basic`: `[length]="100" [pageSize]="10" [pageSizeOptions]="[5,10,25]"`, no
//   `showFirstLastButtons`/`hidePageSize`/`disabled` bindings (all default `false`), default
//   `MatPaginatorIntl`. `_displayedPageSizeOptions` = `[5, 10, 25]` (10 already present, array
//   just sorted as-is). Only `previous`/`next` nav buttons (no `first`/`last`). Initial: range
//   label `"1 – 10 of 100"`, `previous` disabled (`aria-disabled="true" tabindex="-1"`, tooltip
//   disabled), `next` enabled, page-size select shows `10` selected. `<p>Page: 0 Size:
//   10</p>` from the `(page)` handler (unchanged until a page event fires — there are no steps
//   in this scenario, it is the static baseline every other scenario's structural delta is
//   judged against).
//
// - `show-first-last`: identical inputs to `basic` plus `[showFirstLastButtons]="true"`. Initial:
//   all four nav buttons present; `first`/`previous` disabled (page 0), `next`/`last` enabled.
//   Steps: click `last` — `getNumberOfPages()` = `ceil(100/10)` = 10, navigates to index 9;
//   `first`/`previous` become enabled, `next`/`last` become disabled (page 9 is the last of 10);
//   range label becomes `"91 – 100 of 100"`; `<p>` becomes `Page: 9 Size: 10`. Then click
//   `first` — back to index 0, `first`/`previous` disabled again, `next`/`last` enabled, range
//   `"1 – 10 of 100"`, `<p>` becomes `Page: 0 Size: 10`. (Clicking `last`/`first` while already
//   focused keeps focus ON that same button even after it becomes `aria-disabled` — confirmed
//   live, the whole point of `disabledInteractive`, per the upstream doc comment on
//   `_buttonClicked` quoted above — so no FocusMonitor-class churn beyond the normal click-origin
//   classes every button click already produces.)
//
// - `hide-page-size`: identical inputs to `basic` plus `[hidePageSize]="true"`. Confirmed live:
//   the ENTIRE `.mat-mdc-paginator-page-size` div is absent (the `@if (!hidePageSize)` block,
//   not just hidden via CSS) — `.mat-mdc-paginator-range-actions` (label + previous/next) is the
//   only content inside `.mat-mdc-paginator-container`. `pageSizeOptions` is still bound
//   (`[5,10,25]`) to prove it has no effect while hidden. Step: click `next` — range label
//   `"11 – 20 of 100"`, `previous` becomes enabled, `<p>` becomes `Page: 1 Size: 10` (paginator
//   navigation still works with the page-size UI hidden).
//
// - `disabled`: `[length]="100" [pageSize]="10" [pageSizeOptions]="[5,10,25]" [pageIndex]="1"
//   [disabled]="true"` (no `showFirstLastButtons`). `pageIndex=1` is deliberately NOT a
//   boundary (page 1 of 10) so that, absent the global `disabled` flag, BOTH `previous` and
//   `next` would normally be enabled — proving `disabled` overrides the per-page
//   `hasNextPage()`/`hasPreviousPage()` checks for both buttons simultaneously. Confirmed live:
//   both nav buttons get `aria-disabled="true" tabindex="-1"` and disabled tooltips; the
//   page-size `<mat-select>` itself gets `aria-disabled="true" tabindex="-1"` (same contract as
//   select.ts's own `disabled` scenario) — Playwright's actionability check refuses to
//   `.click()` an `aria-disabled="true"` element, so (exactly like select.ts's `disabled`
//   scenario) the select is never opened here. Step: click `next` anyway, with `{force: true}`
//   (see the NAV BUTTONS section above — `next` carries `aria-disabled="true"` throughout, so a
//   plain `.click()` would time out on Playwright's own pre-check even though the real click
//   handler is a harmless no-op) — `_buttonClicked`'s `isDisabled` guard no-ops the navigation;
//   DOM must stay byte-for-byte identical to the initial snapshot (`<p>Page: 1 Size: 10</p>`
//   unchanged, range label stays `"11 – 20 of 100"`).
//
// - `custom-intl`: provides a `MatPaginatorIntl` subclass-by-interface (same pattern as
//   upstream's own `paginator-intl-example.ts` — a plain class implementing the
//   `MatPaginatorIntl` interface, decorated `@Injectable()`, supplied via
//   `providers: [{provide: MatPaginatorIntl, useClass: ...}]`, NOT `extends MatPaginatorIntl`).
//   EXACT label strings used below (document these verbatim — the Qwik port's own default-intl
//   object must be swappable to produce byte-identical text):
//     itemsPerPageLabel: 'Rows:'
//     nextPageLabel: 'Go forward'
//     previousPageLabel: 'Go backward'
//     firstPageLabel: 'Jump to first'
//     lastPageLabel: 'Jump to last'
//     getRangeLabel(page, pageSize, length): length===0||pageSize===0 ? 'No items' :
//       `Page ${page + 1} of ${Math.ceil(length / pageSize)}`
//   `[length]="100" [pageSize]="10" [pageSizeOptions]="[5,10,25]"
//   [showFirstLastButtons]="true"`. Initial: `.mat-mdc-paginator-page-size-label` text is
//   `"Rows:"`; all four nav buttons' `aria-label`/tooltip text use the strings above (e.g. `next`
//   → `"Go forward"`); range label is `"Page 1 of 10"` (confirmed live — NOT the default format).
//   Steps: click `next` — `"Page 2 of 10"`, `<p>Page: 1 Size: 10</p>`; click `last` — navigates
//   to index 9, `"Page 10 of 10"`, `<p>Page: 9 Size: 10</p>`, `next`/`last` now disabled with
//   tooltip text still `"Go forward"`/`"Jump to last"` (label text is independent of disabled
//   state).
//
// - `length-zero`: `[length]="0" [pageSize]="5" [pageSizeOptions]="[5,10,25]"` (default intl,
//   no `showFirstLastButtons`) — mirrors `paginator.spec.ts`'s own unit test ("should show first
//   page of list of 0, each page contains 5 items"). `getNumberOfPages()` = `ceil(0/5)` = `0`;
//   `hasNextPage()`: `maxPageIndex = -1`, `0 < -1` is false → false; `hasPreviousPage()`:
//   `pageIndex(0) >= 1` is false → false — so BOTH `previous` and `next` are disabled from the
//   very first render, with NO `disabled` input involved at all (contrast with the `disabled`
//   scenario above, where the override is explicit). Range label: `length === 0` short-circuits
//   to `"0 of 0"` (confirmed live, exact text — not `"1 – 0 of 0"` or similar). Page-size select
//   still renders normally (shows `5` selected, `_displayedPageSizeOptions` = `[5, 10, 25]`).
//   Step: click `next` anyway, with `{force: true}` (same Playwright-pre-check reason as the
//   `disabled` scenario above) — same `disabledInteractive`-permits-the-real-click,
//   `isDisabled`-guard-no-ops-the-navigation story as the `disabled` scenario, but reached via
//   the zero-length path instead of the `disabled` input; DOM must stay identical to the initial
//   snapshot.
//
// - `interactions`: the most thorough scenario — `[length]="100" [pageSize]="10"
//   [pageSizeOptions]="[5,10,25]" [showFirstLastButtons]="true"`, default intl. Steps, each
//   value confirmed live by walking through the same sequence in the real dev-app:
//     1. click `next` → pageIndex 0→1, range `"11 – 20 of 100"`, `previous`/`first` become
//        enabled, `<p>Page: 1 Size: 10</p>`.
//     2. click `next` → pageIndex 1→2, range `"21 – 30 of 100"`, `<p>Page: 2 Size: 10</p>`.
//     3. click `previous` → pageIndex 2→1, range back to `"11 – 20 of 100"`, `<p>Page: 1 Size:
//        10</p>`.
//     4. click `last` → pageIndex→9 (`getNumberOfPages() - 1`), range `"91 – 100 of 100"`,
//        `next`/`last` become disabled, `previous`/`first` stay enabled, `<p>Page: 9 Size:
//        10</p>`.
//     5. click `first` → pageIndex→0, range `"1 – 10 of 100"`, `previous`/`first` disabled
//        again, `<p>Page: 0 Size: 10</p>`.
//     6. open the page-size select — click `.mat-mdc-paginator-touch-target`, NOT
//        `.mat-mdc-select` (see the touch-target-intercepts-pointer-events note above; THIS
//        select's first-ever open, so the panel lands inside `<mat-select>` itself per the
//        header's CD-timing note) — then click option `"25"` — `_changePageSize(25)`:
//        `startIndex = 0 * 10 = 0`, new `pageIndex = floor(0 / 25) = 0`, `pageSize = 25`;
//        `_displayedPageSizeOptions` stays `[5, 10, 25]` (25 was already present); range becomes
//        `"1 – 25 of 100"` (4 pages total now, `next`/`last` still enabled since page 0 of 4),
//        `<p>Page: 0 Size: 25</p>`, select trigger now shows `25`. Selecting an option closes
//        the single-selection panel (same mechanics as select.ts).
//     7. open the select again via the same touch-target (steady-state landing spot this time —
//        sibling of `.mat-mdc-text-field-wrapper`, per the header note) and click option `"5"` —
//        `_changePageSize(5)`: `startIndex = 0 * 25 = 0`, new `pageIndex = floor(0 / 5) = 0`,
//        `pageSize = 5`; range becomes `"1 – 5 of 100"` (20 pages total), `<p>Page: 0 Size:
//        5</p>`, select trigger now shows `5`.
//
//   Confirmed live (Chromium, repeated runs): every click above on an ENABLED button (all of
//   1–5, plus both touch-target opens and both option clicks in 6–7) succeeds with a plain
//   `.click()` — `{force: true}` is only ever needed for a button that is `aria-disabled="true"`
//   AT THE MOMENT OF THE CLICK (see the NAV BUTTONS section above), which never happens to a
//   button this scenario actually clicks.

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorBasic {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [showFirstLastButtons]="true"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorShowFirstLast {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [hidePageSize]="true"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorHidePageSize {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [pageIndex]="1"
        [disabled]="true"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorDisabled {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 1;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

/**
 * Mirrors upstream's own `paginator-intl-example.ts`: a plain class implementing (not
 * extending) `MatPaginatorIntl`, decorated `@Injectable()`, supplied through
 * `providers: [{provide: MatPaginatorIntl, useClass: ...}]` on the scenario below. See this
 * file's header for the exact strings and why they're documented verbatim.
 */
@Injectable()
class QwikParityPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();
  itemsPerPageLabel = 'Rows:';
  nextPageLabel = 'Go forward';
  previousPageLabel = 'Go backward';
  firstPageLabel = 'Jump to first';
  lastPageLabel = 'Jump to last';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0 || pageSize === 0) {
      return 'No items';
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Page ${page + 1} of ${amountPages}`;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [showFirstLastButtons]="true"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
  providers: [{provide: MatPaginatorIntl, useClass: QwikParityPaginatorIntl}],
})
export class PaginatorCustomIntl {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorLengthZero {
  length = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-paginator
        style="width: 600px"
        aria-label="Select page"
        [length]="length"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [showFirstLastButtons]="true"
        (page)="onPage($event)">
      </mat-paginator>
      <p>Page: {{ pageIndex }} Size: {{ pageSize }}</p>
    </div>
  `,
  imports: [MatPaginatorModule],
})
export class PaginatorInteractions {
  length = 100;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  pageIndex = 0;

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
}

export const PAGINATOR_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': PaginatorBasic,
  'show-first-last': PaginatorShowFirstLast,
  'hide-page-size': PaginatorHidePageSize,
  'disabled': PaginatorDisabled,
  'custom-intl': PaginatorCustomIntl,
  'length-zero': PaginatorLengthZero,
  'interactions': PaginatorInteractions,
};
