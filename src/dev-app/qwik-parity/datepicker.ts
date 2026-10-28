import {DatePipe} from '@angular/common';
import {Component, Type} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-datepicker/. See
// button-toggle.ts for the general approach, and select.ts/autocomplete.ts for the overlay-
// location investigation this file's header builds on (and contrasts with — datepicker turns
// out to behave like dialog/menu/tooltip, NOT like select/autocomplete; see below). Component-
// level inputs (`startAt`, `startView`, `touchUi`, `min`, `max`, `matDatepickerFilter`) use
// `[prop]` bindings; native `<input>` attributes a real consumer writes directly (`placeholder`,
// `disabled`) are plain attributes, same split as form-field.ts. Every `<mat-form-field>` is
// `style="width: 300px"` for the same layout-determinism reason as every other form-field-hosted
// scenario file.
//
// ============================ TWO ROOTS — VERIFIED LIVE ============================
// Unlike `mat-select`/`mat-autocomplete` (which render their panel as a plain DOM sibling inside
// the field via `FlexibleConnectedPositionStrategy`'s `'inline'` popover location), `MatDatepicker
// Base._openOverlay()` (datepicker-base.ts) calls the PLAIN `createOverlayRef()` with an ordinary
// `OverlayConfig` and NO popover-location override at all — confirmed by reading `_getDropdownStrategy
// `/`_getDialogStrategy` (neither calls `.withPopoverLocation`/`.withFlexibleDimensions(false)` the
// way select/autocomplete's positioning does) AND by dumping the live DOM: opening any scenario
// below creates the calendar overlay as a fresh child of `.cdk-overlay-container` under `<body>`,
// never inside `[data-parity-root]`. So — exactly like material-dialog's spec — every scenario here
// needs `rootSelector: '.cdk-overlay-container'`, and `[data-parity-root]`'s own content (just the
// `<mat-form-field>`) is a SECOND thing worth asserting separately (the field, the toggle, the
// always-empty `<mat-datepicker>`/`<mat-date-range-input>` tags), so — again like material-dialog
// — most scenarios use TWO `test()`s per scenario-key: one at the default `[data-parity-root]` root
// (closed-state field + open/close transitions of the field itself) and one at
// `.cdk-overlay-container` (the calendar's own content, gated with `skipInitialCompare: true` since
// the overlay doesn't exist until a step opens it). A `popover="manual"` attribute (the native HTML
// Popover API) IS present on the bounding-box div here too, same as select's/autocomplete's — CONF
// IRMED this is NOT a location signal, just a cross-cutting CDK overlay attribute now added
// regardless of insertion point; ignore it as an indicator either way.
//
// ============================ CALENDAR STRUCTURE — VERIFIED LIVE ============================
// `.cdk-overlay-container` > `div[popover=manual].cdk-overlay-popover` (+ `.cdk-overlay-connected-
// position-bounding-box` in dropdown mode, `.cdk-global-overlay-wrapper` in touch/dialog mode — see
// TOUCH UI below) > `.cdk-overlay-backdrop` (class `mat-overlay-transparent-backdrop` in dropdown
// mode, `cdk-overlay-dark-backdrop` in touch mode; ALWAYS present, `hasBackdrop` has no opt-out here)
// + `#cdk-overlay-N.cdk-overlay-pane` (class `mat-datepicker-popup` dropdown / `mat-datepicker-dialog`
// touch) containing:
//   <mat-datepicker-content class="mat-datepicker-content mat-primary
//       mat-datepicker-content-animations-enabled [mat-datepicker-content-touch]">
//     <div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" tabindex="0"></div>
//     <div cdkTrapFocus role="dialog" aria-modal="true" aria-labelledby="<form-field-label-id>"
//         class="mat-datepicker-content-container [mat-datepicker-content-container-with-actions]">
//       <mat-calendar class="mat-calendar" [id]="<datepicker id, shared>">
//         <mat-calendar-header>…</mat-calendar-header>
//         <div class="mat-calendar-content" cdkMonitorSubtreeFocus tabindex="-1">
//           <mat-month-view>|<mat-year-view>|<mat-multi-year-view>
//             <table role="grid" class="mat-calendar-table"> … </table>
//         </div>
//       </mat-calendar>
//       <!-- [matDatepickerActions]/[matDateRangePickerActions] content portal lands HERE, see
//            ACTIONS below -->
//       <button class="mat-datepicker-close-button cdk-visually-hidden" matButton="elevated">
//         Close calendar</button> <!-- ALWAYS present, SR-only, never exercised below -->
//     </div>
//     <div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" tabindex="0"></div>
//   </mat-datepicker-content>
// The two focus-trap-anchor `<div>`s are `CdkTrapFocus`'s own sentinels (`src/cdk/a11y/focus-trap/
// focus-trap.ts`) — the directive is on `.mat-datepicker-content-container`, but `_createAnchor()`
// inserts its anchors as SIBLINGS of the host (`parentNode.insertBefore(..., this._element)` / `(...,
// this._element.nextSibling)`), so they flank that div inside `<mat-datepicker-content>` rather than
// nesting inside it — easy to get backwards.
//
// `<mat-calendar-header>`'s content (`calendar-header.html`, unconditional on every scenario below):
// a `<span aria-live="polite" class="cdk-visually-hidden" id="mat-calendar-period-label-N">` mirroring
// the SAME text as the visible period button (the live-announcement region the task asked to document
// — screen readers hear period changes through this, not a separate banner); a `<button matButton
// class="mat-calendar-period-button">` with a `<span aria-hidden="true">` holding the visible text and
// an SVG arrow (`.mat-calendar-invert` added whenever `currentView !== 'month'`); a `.mat-calendar-
// spacer`; two `<button matIconButton disabledInteractive>` (prev/next) carrying `mat-mdc-tooltip-
// trigger` (a real `[matTooltip]`, AriaDescriber bookkeeping already normalized by the harness) and
// going `aria-disabled="true"` (+ classes `mat-mdc-button-disabled mat-mdc-button-disabled-interactive`
// `mat-ripple-loader-disabled` — NOT the native `disabled` attribute, `disabledInteractive` keeps them
// focusable) whenever the active period is already at the `min`/`maxDate` boundary — see MIN/MAX/
// FILTER below for a scenario where BOTH end up disabled simultaneously.
//
// HEADER TEXT/LABEL PER VIEW (confirmed live, `MatCalendarHeader._updateLabels`, `datepicker-intl.ts`
// defaults): month view → visible text `"JAN 2024"` (short month, uppercased, + numeric year), period
// button `aria-label="Choose month and year"` (`switchToMultiYearViewLabel`); year view → visible text
// plain `"2024"` (NOT uppercased), period button `aria-label="Choose date"` (`switchToMonthViewLabel`);
// multi-year view → visible text `"2016 – 2039"` (en-dash-joined `formatYearRange`, the FULL 24-year
// window's first/last year), period button `aria-label` is ALSO `"Choose date"` — a genuinely easy
// mistake: `_updateLabels`'s `else` branch (multi-year) reuses `switchToMonthViewLabel`, same as year
// view, because `currentPeriodClicked()` only ever toggles between `'month'` and `'multi-year'`
// (`view == 'month' ? 'multi-year' : 'month'`), so year view's header button is unreachable by its own
// click path, but still renders the "Choose date" label since it's mid-drill-down UI, not clickable
// history. The hidden live-announcement span's text always matches whichever of these is current.
//
// CELL STRUCTURE (`calendar-body.html`, shared by all three views): `<td role="gridcell">` wraps a
// `<button type="button" class="mat-calendar-body-cell …">` (role is implicit from `<button>`, no
// explicit `role="gridcell"` ambiguity — the ROW's `<tr role="row">`, the cell's `<td>` just carries
// layout data-attrs `data-mat-row`/`data-mat-col` + inline `style="width: …; padding-top: …; padding-
// bottom: …"`), containing a content `<span class="mat-calendar-body-cell-content mat-focus-
// indicator">` (the visible day/month/year number/label) and an always-present, always-empty `<span
// aria-hidden="true" class="mat-calendar-body-cell-preview"></span>` (a decorative preview-range
// background layer, present on EVERY cell regardless of range/preview state).
//
// aria-label FORMAT PER VIEW (confirmed live, `MAT_NATIVE_DATE_FORMATS`): month view day cell →
// `"January 15, 2024"` (`dateA11yLabel`: long month, numeric day, numeric year); year view month cell
// → `"June 2024"` (`monthYearA11yLabel`: long month + numeric year, NO day); multi-year view year cell
// → bare `"2025"` (just `getYearName()`, no "Year" prefix — displayValue and ariaLabel are the exact
// same string for a year cell). `aria-pressed="false"`/`"true"` is on EVERY cell always (never
// omitted); `aria-disabled="true"` is omitted entirely (not `"false"`) on an enabled cell.
//
// ACTIVE/SELECTED/TODAY STATE (confirmed live): the ACTIVE cell (the one keyboard focus/navigation
// currently targets — real DOM focus, not just a visual ring; see FOCUS RESTORATION below) gets
// `tabindex="0"` + class `mat-calendar-body-active` on the `<button>` itself; every other cell in the
// SAME view is `tabindex="-1"` with no `-active` class (true roving tabindex, one active cell per
// rendered table). The SELECTED cell gets `aria-pressed="true"` (every other cell always carries
// `aria-pressed="false"`) PLUS class `mat-calendar-body-selected` on the inner CONTENT SPAN (not the
// button). `-active` and `-selected` are independent and can coincide (confirmed:
// `preselected-value`'s initial render has them on the SAME cell, January 15 — `MatMonthView`'s
// `activeDate` getter defaults to the calendar's own `startAt`, which falls back to the
// currently-selected value when nothing else overrides it) or diverge (confirmed: `keyboard-nav`'s
// every arrow/Home/End/PageUp/PageDown step moves `-active` with NO selection ever made until the
// final Enter). TODAY gets `aria-current="date"` + class `mat-calendar-body-today` on the content
// span, but ONLY when the rendered period's year (year/multi-year view) or year+month (month view)
// literally equals the real current date's — see the DETERMINISM PITFALL note below for why this
// nearly broke the `start-view-multi-year` scenario.
//
// ============ DETERMINISM PITFALL — VERIFIED LIVE, genuinely cost debugging time ============
// Every scenario below is anchored on a fixed `startAt` far from whatever day the suite happens to
// run on (per the task's own instruction), overwhelmingly January 2024 — safe for a MONTH or YEAR
// view, since neither the active month nor the active year will ever equal "today"'s. It is NOT
// automatically safe for a MULTI-YEAR view: that view's window spans a full 24 years around the
// active year (`yearsPerPage` in multi-year-view.ts), wide enough that a `startAt` of January 2024
// still rendered a window of 2016–2039 — CONFIRMED LIVE this put "today" (October 2026, the real date
// this task ran on) inside the grid, with 2026's cell carrying `aria-current="date"`/`mat-calendar-
// body-today` unexpectedly. `start-view-multi-year` below anchors on 1990 instead (window 1968–1991)
// specifically to dodge this — safe for decades, since the window is a pure function of the anchor
// year, not of whatever day the test happens to run on. No other scenario below opens a multi-year
// view at the 2024 anchor, so this is the only one needing the older anchor.
//
// DISABLED CELLS (`min`/`max`/`matDatepickerFilter`, confirmed live): a disabled cell's `<button>`
// gets class `mat-calendar-body-disabled` PLUS `aria-disabled="true"` (both OMITTED, not false/absent-
// as-empty-string, when enabled). `min-max-filter` below combines a `[min]`/`[max]` RANGE (Jan 10–20)
// with a `matDatepickerFilter` excluding weekends, deliberately chosen so both mechanisms are visible
// at once within one month view: days 1–9 disabled (before min), 10–12 enabled (Wed–Fri), 13–14
// disabled (weekend, inside the min/max range), 15–19 enabled (Mon–Fri), 20–31 disabled (20 is both
// the max boundary AND a Saturday; 21+ simply past max). Because `startAt` (Jan 15) falls in the SAME
// month as both `min` and `max`, this ALSO disables (via `disabledInteractive`) BOTH the previous- and
// next-month header buttons simultaneously — `MatCalendarHeader.previousEnabled()`/`nextEnabled()`
// both key off "is the active period's view already the same as the boundary date's view", and here
// it is, on both sides at once; not exercised as a click (Playwright's actionability check refuses an
// `aria-disabled="true"` element) but structurally present and worth the Qwik port reproducing.
//
// FOCUS RESTORATION — VERIFIED LIVE via FocusMonitor classes, genuinely useful since the harness
// cannot assert `document.activeElement` directly. Opening (`MatDatepickerContent.ngAfterViewInit`
// calls `this._calendar.focusActiveCell()`) moves REAL DOM focus off the toggle button and onto the
// active calendar cell. Closing, by ANY means — Escape, selecting a date, a Cancel/Apply action button
// — calls `this._focusedElementBeforeOpen!.focus()` whenever `restoreFocus` is true (the default,
// never overridden below), which is always the toggle button here (every scenario opens via a toggle
// click). CDK's `FocusMonitor` classifies that `.focus()` call as PROGRAMMATIC origin, so the toggle
// button's own `<button>` — which has NO `cdk-focused` class at all before the very first open —
// permanently gains `cdk-focused cdk-program-focused` the first time the picker is opened and then
// closed by any path, and keeps it through every subsequent open/close cycle in the same scenario.
// `escape-restore-focus` below isolates exactly this (open, Escape, assert the toggle's own class
// list changed) but it is a REAL, confirmed side effect of every other scenario's open+close steps
// too — not unique to that one.
//
// TYPED-DATE PARSING/BLUR (`typed-date-blur`, confirmed live) — needs a `[formControl]`, NOT a bare
// `[matDatepicker]`, because `MatDatepickerInput` only participates in Angular's validator chain
// through an `NgControl` on the same element (it provides `NG_VALIDATORS`, but that's inert without
// one). `_onBlur()` (datepicker-input-base.ts) ONLY reformats the native `<input>`'s `.value` when the
// model's CURRENT value is non-null — confirmed live: typing an unparseable string (`"not a date"`)
// and blurring leaves that literal text sitting in the input UNCHANGED (no reformat, no clearing),
// while the underlying selection model silently resets to `null` and the control's own
// `matDatepickerParse` validator error fires (`ng-invalid`, `mat-form-field-invalid`, `aria-invalid=
// "true"`, `aria-describedby` pointing at a `<mat-error id="mat-mdc-error-N">`) — `touched` flips
// unconditionally on blur regardless of value, so the error surfaces immediately, no separate blur-
// elsewhere step needed. Typing a validly-parseable but differently-FORMATTED string (ISO
// `"2024-02-14"`) and blurring DOES get reformatted to the adapter's canonical display shape (`M/D/
// YYYY`, no leading zeros — confirmed live: input ends up literally `"2/14/2024"`).
//
// RANGE SELECTION/PREVIEW (`range-basic`, confirmed live): clicking a first date adds NEITHER
// `-range-start` NOR `-in-range` yet (the range isn't complete) — only hovering a SECOND, later date
// (`mouseenter`, capturing — `calendar-body.ts`) activates `DefaultMatCalendarRangeStrategy.
// createPreview()`, which adds class `mat-calendar-body-preview-start` to the ALREADY-clicked start
// cell, `mat-calendar-body-preview-end` to the hovered cell, and `mat-calendar-body-in-preview` to
// EVERY cell in between INCLUDING both of those (confirmed live: the start AND end cells carry BOTH
// their own `-preview-start`/`-preview-end` class AND the generic `-in-preview` class simultaneously —
// not mutually exclusive). Only once the SECOND date is actually CLICKED does the range become
// "complete" and the preview classes are replaced by the real `mat-calendar-body-range-start`/`-range-
// end`/`-in-range` triad — confirmed live clicking the second date (no actions portal registered)
// immediately closes the overlay too, same auto-close rule as a single-date selection.
// `<mat-date-range-input>` itself (`date-range-input.html`) is a REAL element (not a stand-in wrapper
// div) — `role="group"`, host-bound `id`/`aria-labelledby` (pointing at the form field's floating-
// label id, confirmed, same mechanism select.ts documents for its OWN `aria-labelledby`)/`aria-
// describedby`/`data-mat-calendar` — containing `.mat-date-range-input-container` >
// `.mat-date-range-input-wrapper` (one per side, the end one also carrying `mat-date-range-input-end-
// wrapper`) each wrapping the projected native `<input matStartDate>`/`<input matEndDate>` PLUS an
// always-present, `aria-hidden="true"` MIRROR `<span class="mat-date-range-input-mirror">` whose text
// mirrors that input's own current value (a sizing trick, confirmed non-empty once a value exists) —
// and a `<span class="mat-date-range-input-separator">` ("–") between the two wrappers.
//
// DATEPICKER ACTIONS (`actions`, confirmed live) — mirrors upstream's own `datepicker-actions-example`
// almost verbatim (both a single-date AND a range field, each with its own Cancel/Apply pair), the
// closest 1:1 reuse of an existing upstream demo in this file. `<mat-datepicker-actions>` AND
// `<mat-date-range-picker-actions>` share ONE component/template (`MatDatepickerActions`, selector
// `'mat-datepicker-actions, mat-date-range-picker-actions'`) — BOTH render to the exact same `<div
// class="mat-datepicker-actions">` wrapper, confirmed identical regardless of which tag name was
// written. This content is a `TemplatePortal`, so it is ONLY present in the DOM once the picker has
// actually opened at least once (same category as `<mat-autocomplete>`'s panel, NOT like `<mat-
// datepicker>`'s always-empty host) — it lands as a DOM SIBLING directly after `</mat-calendar>` and
// before the hidden close button, inside `.mat-datepicker-content-container`, which ALSO gains an
// extra modifier class `mat-datepicker-content-container-with-actions` for as long as ANY actions
// portal is registered (confirmed present from the very first open, since `registerActions` runs in
// the actions component's own `ngAfterViewInit`, before the calendar content's `_assignActions` call
// that would otherwise need a force-rerender). CONFIRMED LIVE, the behavior-changing part: registering
// ANY actions portal switches `MatDatepickerContent._handleUserSelection` onto a CLONED, PENDING
// selection model — picking a date (or, for the range field, completing a full start+end pair) no
// longer auto-applies to the real model NOR auto-closes the overlay; only `[matDatepickerCancel]`/
// `[matDateRangePickerCancel]` (closes, discards the pending selection) or `[matDatepickerApply]`/
// `[matDateRangePickerApply]` (applies the pending selection to the real model, THEN closes) do.
//
// TOUCH UI (`touch-ui`, confirmed live) — `[touchUi]="true"` is bound as a PROPERTY, not the bare
// `touchUi` upstream's own `datepicker-touch-example` writes: `<mat-datepicker>` is a permanently-
// empty-template host (see below) with no host-attribute nulling, so a bare boolean attribute
// matching this `@Input` name would echo onto it forever — same footgun as `<mat-checkbox checked>`,
// same fix as every other qwik-parity file's component-level-input convention. `MatDatepickerBase.
// _openOverlay()`'s `isDialog` branch (`touchUi` truthy) swaps the position strategy to
// `createGlobalPositionStrategy().centerHorizontally().centerVertically()` — STILL through the SAME
// `.cdk-overlay-container`/`createOverlayRef()` path documented above, NOT a real `MatDialog` (no
// `mat-dialog-container` anywhere) — confirmed live the bounding-box div swaps from `.cdk-overlay-
// connected-position-bounding-box` to `.cdk-global-overlay-wrapper` (flex `justify-content: center;
// align-items: center`), the backdrop swaps from `mat-overlay-transparent-backdrop` to the SAME `cdk-
// overlay-dark-backdrop` class a real dialog uses, the pane swaps `mat-datepicker-popup` for `mat-
// datepicker-dialog` (with inline `style="position: static"` instead of `top`/`left` coordinates), and
// `<mat-datepicker-content>` gains an extra class `mat-datepicker-content-touch`. Calendar content
// itself (table structure, cell classes, header) is otherwise identical to the dropdown case.
//
// EMPTY-HOST COMPONENTS (confirmed live, same family as autocomplete.ts's/select.ts's own findings):
// `<mat-datepicker>` AND `<mat-date-range-picker>` (`datepicker.ts`/`date-range-picker.ts`, both
// `template: ''`) render as literally empty tags (`<mat-datepicker></mat-datepicker>`) FOREVER at
// their declaration site — confirmed they land inside `.mat-mdc-form-field-infix`, as the LAST child
// there, directly after the native `<input>`/`<mat-date-range-input>` (the SAME slot the input/range-
// input occupies, exactly autocomplete.ts's `<mat-autocomplete>` finding) — NOT the subscript-wrapper-
// adjacent slot. The Qwik port needs an equivalent empty placeholder element in that exact position.
//
// IDS (`_IdGenerator`, one app-global counter per id-prefix, digits squashed by the harness
// regardless): `mat-datepicker-N` (the datepicker/range-picker's OWN id — shared verbatim as the
// calendar's `[id]`, the toggle's/input's/range-input's `data-mat-calendar` value, and — only while
// open — the input's `aria-owns`); `mat-calendar-period-label-N` (the header's live-announcement
// span); `mat-calendar-body-start-N`/`-end-N`/`-comparison-start-N`/`-comparison-end-N` (FOUR hidden
// `<span class="mat-calendar-body-hidden-label">` at the end of EVERY `mat-calendar-body`, for EVERY
// view, confirmed present even on a plain single-date month view with empty text content — only
// referenced via a cell's `aria-describedby` when `isRange` is true, which only month-view ever sets).
// `mat-date-range-input-N` (the range input's own group id). A fresh `MatCalendar`/`MatDatepicker
// Content` instance (and thus a fresh set of these ids) is created on EVERY open — `_openOverlay()`
// calls `_destroyOverlay()` first — so a scenario that reopens the SAME picker gets NEW id numbers
// each time (squashed to `#` regardless by the harness, so not a real diff risk, just worth knowing
// if a step ever needed to read back an id).
//
// Scenarios (Type → DATEPICKER_SCENARIOS key), all anchored on January 2024 except where noted:
//
// - **basic-popup**: single `matInput` + toggle, `[startAt]` fixed (no value yet). Open, click a
//   day (closes + formats into the input), reopen (the FIXED `startAt` always wins over the now-
//   set value, so the active cell resets to day 1 every time — contrast with `preselected-value`),
//   Escape closes unchanged.
// - **preselected-value**: single field with `[value]` set from the start, NO `startAt` override —
//   isolates the "selected cell is also the active cell on open" behavior `startAt`'s fallback-to-
//   value produces when nothing else overrides it (see ACTIVE/SELECTED/TODAY above).
// - **start-view-year**: `[startView]="'year'"`. Open (year grid), click a month cell (drills to
//   that month's month view), click a day (selects, closes).
// - **start-view-multi-year**: `[startView]="'multi-year'"`, anchored on **1990**, not 2024 (see the
//   DETERMINISM PITFALL note above). Open (multi-year grid), click a year cell (drills to year
//   view), click a month cell (drills to month view), Escape closes WITHOUT selecting — contrast
//   with `start-view-year`, which does select, so both a selecting and a non-selecting drill-down
//   are covered between the two.
// - **min-max-filter**: `[min]`/`[max]` (Jan 10–20) + `matDatepickerFilter` (no weekends) together;
//   see DISABLED CELLS above for the exact enabled/disabled map and the simultaneously-disabled
//   prev/next buttons. Click an enabled day (16) to close.
// - **inline-calendar**: a bare `<mat-calendar>` with NO form field/popup at all, `[(selected)]`
//   two-way bound, a `<p>` below showing the formatted selection (`DatePipe 'M/d/yyyy'`, chosen
//   over raw `{{selected}}` interpolation specifically to avoid a platform/timezone-dependent
//   `Date.prototype.toString()` string — see upstream's own `datepicker-inline-calendar-example`,
//   which this mirrors but with deterministic output). Click a day (selects), click another day
//   (selection moves — the first cell's `-selected`/`aria-pressed` clear, the second's set).
// - **range-basic**: `mat-date-range-input` + `matStartDate`/`matEndDate` + `mat-date-range-picker`,
//   `[startAt]` fixed (pins the displayed month regardless of selection state, since an empty range
//   would otherwise fall back to `getStartValue()` → null → today's month). Open, click a start day
//   (10), HOVER a later day (20, exercising the preview classes — see RANGE SELECTION/PREVIEW
//   above), click that same day as the end (completes the range, auto-closes).
// - **typed-date-blur**: single field, `[formControl]` (needed for the parse-error path — see
//   TYPED-DATE PARSING/BLUR above), a `mat-error` gated on `control.hasError('matDatepickerParse')`.
//   No popup interaction at all — purely native `<input>` typing + blur. Type a differently-
//   formatted-but-valid ISO date + blur (reformats), type unparseable text + blur (error appears,
//   text stays literally as typed), type a valid date again + blur (recovers).
// - **disabled**: single field, `[disabled]="true"` on the input (propagates to the toggle via
//   `MatDatepickerBase.disabled`'s fallback) with a preset `[value]`, so the disabled contract is
//   checked against a non-empty display too. No steps — Playwright refuses to click a `disabled`
//   toggle, same accepted exception as select.ts's/form-field.ts's own `disabled` scenarios.
// - **keyboard-nav**: single field, `[startAt]` = January 15, 2024 (a Monday). Open (focus lands on
//   the active cell automatically, no extra click needed — see FOCUS RESTORATION above), then
//   ArrowRight/ArrowDown/ArrowLeft/ArrowUp (day/week deltas), Home/End (first/last of month),
//   PageUp/PageDown (±1 month), Alt+PageUp/Alt+PageDown (±1 year), Enter (selects the final active
//   date and closes) — every key's exact resulting active cell was confirmed live, see the spec.
// - **escape-restore-focus**: single field, isolates the FOCUS RESTORATION behavior documented
//   above on its own: open (toggle loses its `cdk-focused` classes entirely, focus moves into the
//   calendar), Escape (overlay gone, toggle regains focus and — for the first time ever on this
//   element — carries `cdk-focused cdk-program-focused`).
// - **actions**: upstream's own two-field `datepicker-actions-example` almost verbatim (single +
//   range, each with Cancel/Apply) — see DATEPICKER ACTIONS above for the shared-template/pending-
//   model mechanics. Single field: open, click a day (pending, stays open), Cancel (closes,
//   discards); open, click a day, Apply (closes, commits). Range field: open, click start, click
//   end (range complete but STILL open, unlike `range-basic` — actions suppress auto-close), Apply
//   (closes, commits both ends).
// - **touch-ui**: single field, `[touchUi]="true"` (bound as a property — see TOUCH UI above for
//   why). Open (global-centered overlay, dark backdrop, `-dialog`/`-content-touch` classes instead
//   of the dropdown ones), click a day (selects, closes) — calendar content itself is unchanged
//   from the dropdown scenarios.

const JAN_1_2024 = new Date(2024, 0, 1);
const JAN_15_2024 = new Date(2024, 0, 15);
const JAN_10_2024 = new Date(2024, 0, 10);
const JAN_20_2024 = new Date(2024, 0, 20);

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerBasicPopup {
  startAt = JAN_1_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" [value]="value" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerPreselectedValue {
  value = JAN_15_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startView]="'year'" [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerStartViewYear {
  startAt = JAN_1_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startView]="'multi-year'" [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerStartViewMultiYear {
  // A multi-year grid spans 24 years around the active year (see the spec header); 1990 keeps
  // that whole window clear of "today" (2026) for the foreseeable future, unlike 2024's window.
  startAt = new Date(1990, 0, 1);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input
          matInput
          [min]="minDate"
          [max]="maxDate"
          [matDatepickerFilter]="noWeekends"
          [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerMinMaxFilter {
  startAt = JAN_15_2024;
  minDate = JAN_10_2024;
  maxDate = JAN_20_2024;
  noWeekends = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    return day !== 0 && day !== 6;
  };
}

@Component({
  template: `
    <div data-parity-root>
      <mat-calendar [startAt]="startAt" [(selected)]="selected"></mat-calendar>
      <p>Selected: {{ selected ? (selected | date: 'M/d/yyyy') : '(none)' }}</p>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatDatepickerModule, DatePipe],
})
export class DatepickerInlineCalendar {
  startAt = JAN_1_2024;
  selected: Date | null = null;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Enter a date range</mat-label>
        <mat-date-range-input [rangePicker]="picker">
          <input matStartDate placeholder="Start date" />
          <input matEndDate placeholder="End date" />
        </mat-date-range-input>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-date-range-picker #picker [startAt]="startAt"></mat-date-range-picker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatDatepickerModule],
})
export class DatepickerRangeBasic {
  startAt = JAN_1_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" [formControl]="control" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
        @if (control.hasError('matDatepickerParse')) {
          <mat-error>Please enter a valid date</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, ReactiveFormsModule],
})
export class DatepickerTypedDateBlur {
  control = new FormControl<Date | null>(null);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" [value]="value" [disabled]="true" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerDisabled {
  value = JAN_15_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerKeyboardNav {
  startAt = JAN_15_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerEscapeRestoreFocus {
  startAt = JAN_1_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="datepicker" />
        <mat-datepicker-toggle matIconSuffix [for]="datepicker"></mat-datepicker-toggle>
        <mat-datepicker #datepicker [startAt]="startAt">
          <mat-datepicker-actions>
            <button matButton matDatepickerCancel>Cancel</button>
            <button matButton="elevated" matDatepickerApply>Apply</button>
          </mat-datepicker-actions>
        </mat-datepicker>
      </mat-form-field>
      <mat-form-field style="width: 300px">
        <mat-label>Enter a date range</mat-label>
        <mat-date-range-input [rangePicker]="rangePicker">
          <input matStartDate placeholder="Start date" />
          <input matEndDate placeholder="End date" />
        </mat-date-range-input>
        <mat-datepicker-toggle matIconSuffix [for]="rangePicker"></mat-datepicker-toggle>
        <mat-date-range-picker #rangePicker [startAt]="startAt">
          <mat-date-range-picker-actions>
            <button matButton matDateRangePickerCancel>Cancel</button>
            <button matButton="elevated" matDateRangePickerApply>Apply</button>
          </mat-date-range-picker-actions>
        </mat-date-range-picker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonModule],
})
export class DatepickerActions {
  startAt = JAN_1_2024;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Choose a date</mat-label>
        <input matInput [matDatepicker]="picker" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker [touchUi]="true" [startAt]="startAt"></mat-datepicker>
      </mat-form-field>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
})
export class DatepickerTouchUi {
  startAt = JAN_1_2024;
}

export const DATEPICKER_SCENARIOS: Record<string, Type<unknown>> = {
  'basic-popup': DatepickerBasicPopup,
  'preselected-value': DatepickerPreselectedValue,
  'start-view-year': DatepickerStartViewYear,
  'start-view-multi-year': DatepickerStartViewMultiYear,
  'min-max-filter': DatepickerMinMaxFilter,
  'inline-calendar': DatepickerInlineCalendar,
  'range-basic': DatepickerRangeBasic,
  'typed-date-blur': DatepickerTypedDateBlur,
  'disabled': DatepickerDisabled,
  'keyboard-nav': DatepickerKeyboardNav,
  'escape-restore-focus': DatepickerEscapeRestoreFocus,
  'actions': DatepickerActions,
  'touch-ui': DatepickerTouchUi,
};
