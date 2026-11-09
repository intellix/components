# qwik-material/datepicker sync log

Tracks the sync state between this port and `src/material/datepicker/` upstream. Companion to
`src/qwik-material/timepicker/SYNC.md` (closest analogue — overlay/key-manager/form-field-control
plumbing, and the source of the "min-max"-style frozen-element-reference defense used here) and
`src/qwik-material/core/SYNC.md` (the `DateAdapter`/`NativeDateAdapter`/`MAT_NATIVE_DATE_FORMATS`
abstraction this reuses verbatim).

**Status: all 13 contract scenarios implemented, 13/13 passing the full Angular-vs-Qwik DOM
parity harness 3 consecutive times (`--repeat-each=3`)** as of the Qwik v2 regression pass below
— `typed-date-blur` and the `(calendar)` half of `actions`, previously documented as open issues
at handoff (see "Open issues" below for the historical record), are now fixed; see "Qwik v2
regression fixes (2026-11-01)". `pnpm -C src/qwik-material build && test && typecheck &&
lint:no-ssr-leaks` all pass with zero regressions; datepicker-scoped unit tests are 32/32; the
regression specs for form-field/timepicker/select/dialog show no new failures (the one timepicker
failure, `min-max`, predates this port — see its own SYNC.md).

### Qwik v2 regression fixes (2026-11-01)

Upgrading `@qwik.dev/core` 1.20 → 2.0.0-rc.4 broke 3 of this component's scenarios that had
passed reliably under v1 (per the "Done when" table below, as it stood before this pass):
`actions (field)` (newly broken), `actions (calendar)` and `typed-date-blur` (both previously
*separately* broken for different, now-superseded reasons — see "Open issues"/"Resolved issues"
below — but reproducible under v2 for a NEW reason regardless). Root causes, confirmed live via
instrumented Playwright runs against the built preview (not assumed):

1. **`useFocusTrap`'s anchor attach + auto-focus raced Qwik v2's deferred DOM commit.** Fixed in
   `qwik-cdk/a11y/focus-trap/{focus-trap.ts,use-focus-trap.ts}` — see that package's own SYNC.md.
   This alone fixed most of the datepicker popup's missing `cdk-focus-trap-anchor` siblings.
2. **`ActionsOutlet`'s `<Slot/>` lost the actions row's Cancel/Apply text on the FIRST open.**
   `mat-datepicker-content.tsx`'s `ActionsOutlet` projected `props.actionsContent` (arrives via a
   prop, not literal JSX children at that call site) through `<Slot/>`; fixed by taking `content:
   JSXOutput` as an explicit prop instead and interpolating `{props.content}` directly.
3. **The SAME actions row broke AGAIN, specifically on a SECOND open.** `datepicker-runtime.ts`
   deliberately reuses the exact same captured `JSXOutput` object across every open (by design —
   worked fine under v1). Qwik v2's `JSXNodeImpl` caches render-time state on the node object
   itself, so rendering the identical object a second time (in a brand-new overlay) corrupts it.
   Fixed via `core/jsx-reuse.ts`'s new `cloneJsxForReuse()`, called at both
   `openDatepickerPanel`/`openDateRangePickerPanel`.
4. **`typed-date-blur`'s `mat-error` rendered with a permanently empty label.** Two compounding
   issues: the route's own dev-app code still had an EARLIER, already-known-unnecessary
   "frozen errors element" workaround (timepicker's SYNC.md had already found and removed the
   same pattern there for a different prop) — removed, now passes `errors` the plain, idiomatic
   way (`error-state`'s own convention). That alone wasn't sufficient: `MatFormField`'s own
   `MatIdScope` helper ALSO projected the (now letter-for-letter correct) `<MatError>` through a
   `<Slot/>` for the exact same reason as (2) — fixed the same way, in `qwik-material/form-field`
   (shared code; see that package's own SYNC.md for the full writeup, kept here as a pointer
   since it's outside this component's own files).

All 3 scenarios now pass `--repeat-each=3` (9/9), plus a combined 108-test run alongside
cdk-dialog/material-dialog/material-bottom-sheet/material-snack-bar/material-form-field with zero
regressions.

## Upstream sync state (SCSS)

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `scss/datepicker/calendar.scss` | `src/material/datepicker/calendar.scss` | synced | cdk-stub swap only |
| `scss/datepicker/calendar-body.scss` | `src/material/datepicker/calendar-body.scss` | synced | cdk-stub swap only |
| `scss/datepicker/date-range-input.scss` | `src/material/datepicker/date-range-input.scss` | synced | cdk-stub swap only |
| `scss/datepicker/datepicker-toggle.scss` | `src/material/datepicker/datepicker-toggle.scss` | synced | cdk-stub swap only |
| `scss/datepicker/datepicker-content.scss` | `src/material/datepicker/datepicker-content.scss` | synced | byte-identical — has the `_mat-datepicker-content-{dropdown,dialog}-enter`/`-exit` `@keyframes` and the `mat-datepicker-content-animating` CSS hook `datepicker-runtime.ts`'s open/close animation timers (`DROPDOWN_ENTER_MS`/`DIALOG_ENTER_MS`/`EXIT_MS`) drive |
| `scss/datepicker/datepicker-actions.scss` | `src/material/datepicker/datepicker-actions.scss` | synced | byte-identical |
| `scss/datepicker/_m2-datepicker.scss` / `_m3-datepicker.scss` / `_datepicker-theme.scss` | same | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/datepicker/datepicker-prebuilt.scss` | n/a (qwik-material-specific) | new | `@use`s all 6 component stylesheets above (upstream has no single aggregated `datepicker.scss` — 6 separate component `styleUrl`s) only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-datepicker-*`/`--mat-calendar-*` name already carries a real fallback to `--mat-sys-*` baked in via `token-utils.slot()`. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

Entry wired into `package.json` (`./datepicker`, `./datepicker-prebuilt.css`), `vite.config.ts`
(`entries` + `sassEntries`), and the dev-app's `root.tsx` prebuilt-CSS import list — same pattern
every other entry point uses. SCSS was never modified during this port.

## What's built

### Pure logic (framework-free, fully unit-tested — 32/32 passing)

- **`calendar-math.ts`** — every non-Angular-lifecycle algorithm from upstream
  `calendar-body.ts`/`month-view.ts`/`year-view.ts`/`multi-year-view.ts`: cell-grid building, the
  24-year multi-year window math, keyboard deltas per view, cell predicates, and the
  calendar-header's period/prev/next logic.
- **`date-range-selection.ts`** — `MatRangeDateSelectionModel.add()` (`rangeModelAdd`) and
  `DefaultMatCalendarRangeStrategy.selectionFinished()`/`createPreview()` (`rangeSelectionFinished`/
  `rangeCreatePreview`), including "clicking an earlier date restarts the range rather than
  auto-swapping" and "hovering before the pending start previews nothing, not a backward range."

### Components

- **`mat-calendar-body.tsx`**, **`mat-month-view.tsx`** / **`mat-year-view.tsx`** /
  **`mat-multi-year-view.tsx`**, **`mat-calendar-header.tsx`**, **`mat-calendar.tsx`**
  (`MatCalendar`) — the calendar rendering stack (built before this session; see "Resolved" below
  for its one historical bug and this session's one new one).
- **`datepicker-intl.ts`** — default i18n strings, no live-override mechanism (same deviation this
  port's other components already accept).
- **`use-mat-datepicker.ts`** — `useMatDatepicker()`/`useMatDateRangePicker()`, the shared
  cross-component state-bag hooks (`MatDatepickerHandle`/`MatDateRangePickerHandle`, both extending
  `MatDatepickerCore`). See "Architecture" below for why this shared-handle shape exists.
- **`datepicker-runtime.ts`** — module-level open/close/selection orchestration
  (`openDatepickerPanel`/`openDateRangePickerPanel`/`closeDatepickerPanel`,
  `handleDatepickerUserSelect`/`handleRangePickerUserSelect`,
  `handleDatepickerInput`/`handleDatepickerBlur`, `applyDatepickerSelection`/
  `cancelDatepickerSelection`/the range variants, `formatDateForDisplay`).
- **`mat-datepicker-content.tsx`** (`MatDatepickerContent`) — the overlay content component
  rendered via `overlay.create()`; hosts the calendar, the range hover-preview, actions row, and
  the hidden close button.
- **`mat-datepicker.tsx`** (`MatDatepicker`/`MatDateRangePicker`) — the empty-template marker
  components that only exist to stash `actions` JSX onto the shared handle.
- **`mat-datepicker-input.tsx`** (`MatDatepickerInput`) — single-date input, merging `matInput` +
  `[matDatepicker]`.
- **`mat-date-range-input.tsx`** (`MatDateRangeInput`) — the range form-field control (both native
  inputs + mirror/separator spans, one component).
- **`mat-datepicker-toggle.tsx`** (`MatDatepickerToggle`) — shared single/range toggle button via
  the `AnyDatepickerHandle<D>` union + `isRangeHandle()` runtime discriminator.

### Dev-app routes

All 13 scenarios are wired up under `src/qwik-cdk-dev-app/src/routes/mat-datepicker/<scenario>/`:
`inline-calendar`, `basic-popup`, `preselected-value`, `start-view-year`, `start-view-multi-year`,
`min-max-filter`, `typed-date-blur`, `disabled`, `keyboard-nav`, `escape-restore-focus`, `actions`,
`range-basic`, `touch-ui`. Each mirrors the corresponding Angular component in
`src/dev-app/qwik-parity/datepicker.ts`.

## Architecture

- **Shared handle, not per-component props.** `useMatDatepicker<D>()`/`useMatDateRangePicker<D>()`
  return one object (`MatDatepickerHandle`/`MatDateRangePickerHandle`) that `MatDatepickerInput`/
  `MatDateRangeInput`, `MatDatepickerToggle`, and `MatDatepicker`/`MatDateRangePicker` all take as
  a `picker` prop — mirroring how upstream's `MatDatepickerInput`/`-Toggle` both `inject()` the
  same `MatDatepickerControl`/`MatDatepickerBase` instance via `[matDatepicker]`'s template
  reference, rather than Angular's DI being reproduced here.
- **Pending-vs-real selection model** (`_pendingValue` on the handle) mirrors
  `MatDatepickerContent._assignActions()`'s clone-model pattern: when an `actions` row is present,
  calendar clicks write to `_pendingValue`, not `value` — only `applyDatepickerSelection`/
  `cancelDatepickerSelection` (or the range variants) commit/discard it. Without an `actions` row,
  selections commit to `value` directly (same simplification upstream's own "no actions = no
  pending model" fallback uses).
- **Calendar focus-origin is an explicit signal `MatCalendar` owns, not `useFocusOrigin()`.**
  `CalendarContent` (inside `mat-calendar.tsx`) renders its `cdk-*-focused` classes from a
  `focusOrigin: Signal<'mouse' | 'keyboard' | null>` that every calendar interaction handler
  writes directly, rather than inferring the origin from `focusin`/`focusout` events the normal
  `useFocusOrigin()` way. This was a deliberate, confirmed-necessary departure — see
  `mat-calendar.tsx`'s own doc comment for the full write-up, short version: a plain per-cell
  `useFocusOrigin()` raced itself on `keyboard-nav`'s very first `ArrowRight` (the outgoing cell's
  cold `focusout` QRL chunk resolved *after* the incoming cell's already-warm `focusin` chunk,
  despite firing first, permanently clobbering the correct classification).
- **Re-focus-on-change is signal-driven, not inline.** Every handler that changes
  `activeDate`/`currentView` writes a `pendingFocusOrigin` signal; a separate `useVisibleTask$`
  that `track()`s `activeDate`/`currentView`/`pendingFocusOrigin` does the actual
  `querySelector('.mat-calendar-body-active')?.focus()` once Qwik's own render for that batch of
  writes has landed. An inline (even double-deferred, `requestAnimationFrame`+`setTimeout(0)`,
  mirroring upstream's `afterNextRender()`+`setTimeout()`) query was tried first and found live to
  sometimes still hit the OLD view's cell on a drill-down — no fixed defer duration is reliably
  "after" a specific Qwik render; a `useVisibleTask$` tracking the same signals is.
- **Never share a plain (non-`$()`) helper function across more than one `$()` boundary inside a
  component.** `MatCalendar` originally had a `refocusActiveCell(origin)` closure called from six
  different `$()` handlers; Qwik's optimizer captured it as a runtime closure value instead of
  inlining its body into each chunk, and that value — a bare JS function — can't be serialized
  into the SSR'd resumability state. This crashed `inline-calendar`'s page load intermittently
  (`QError_verifySerializable`/"Code(3)" at container-close, after the main HTML had already
  streamed — see "Resolved" below). Fixed by inlining the one-line write at each call site instead.
  Module-level consts/functions (e.g. `DEFAULT_DATE_ADAPTER`) are fine to reference from multiple
  `$()` handlers — only a component-LOCAL plain function shared this way is unsafe.
- **`infixContent` on `MatFormField` needed the same "frozen JSX reference" fix `control` already
  had.** `mat-form-field.tsx` now freezes `infixContent` into a `useSignal(() => props.infixContent)`
  at mount, same as its pre-existing `controlSnapshot`. Root cause: `<MatDatepicker
  actions={...}>` is a real `component$()` passed through `infixContent`, and a brand-new JSX
  element reference for an unresolved-client-side component QRL crashes Qwik core
  ("Rendering promises in JSX signals is not supported") — the exact bug class `controlSnapshot`
  was built to avoid, just never hit via `infixContent` before (its only prior consumer,
  `mat-paginator`, passed plain host markup, not a real component). This is a shared-component fix
  with applicability beyond datepicker.
- **`MatDateRangeInput`'s MDC classes (`mat-mdc-input-element`, `mat-mdc-form-field-input-control`,
  `mdc-text-field__input`) live on the HOST `<mat-date-range-input>` element**, not the two inner
  `<input>`s — confirmed live against upstream's own constructor `classList.add` call.
- **Both `MatDatepickerInput` and `MatDateRangeInput` live-resync `formField.empty`/
  `.shouldLabelFloat` during render**, reading `picker.value.value` directly, rather than relying
  purely on native `input`/`blur` events. A calendar-cell click never focuses/blurs the native
  input, so the event-driven path alone never ran for a calendar-only selection (`basic-popup`,
  `range-basic` both surfaced this as a stuck placeholder/non-floating label).

## Deviations from upstream

1. **No comparison-range cells/bridges, no drag-to-select, no custom calendar header
   (`ComponentPortal`/`headerComponent`).** None of this port's scenarios exercise them.
   `comparisonDateAccessibleName` text is still hardcoded to `DATEPICKER_INTL.comparisonDateLabel`
   + the start/end accessible name on every view (matches upstream's own unconditional
   interpolation). ~~no custom per-date CSS classes (`dateClass`)~~ — **ported, 2026-11-03**, see
   "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" below.
2. ~~`DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` module singletons used everywhere~~ —
   **pluggable, 2026-11-03** (app-wide or per subtree, via `QwikMaterialProvider`), see
   "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" below for the full design.
   `dateFilter` is STILL resolved inside a `useTask$` per view, never inside the component's own
   render body, writing the fully-built plain-data grid into a signal — that part of the
   original design is unchanged, and `dateClass`/the configurable adapter reuse the exact same
   task.
3. **No separate `MatDatepickerActions`/`MatDatepickerCancel`/`MatDatepickerApply` components.**
   `MatDatepicker`/`MatDateRangePicker` take a plain `actions` JSX prop (a `<div
   class="mat-datepicker-actions">` containing ordinary `<MatButton>`s calling
   `applyDatepickerSelection`/`cancelDatepickerSelection` directly) instead of reproducing
   upstream's `ContentChild`-queried/`TemplatePortal`-projected indirection. See `mat-datepicker.tsx`'s
   doc comment and the usage example below.
4. **`MatStartDate`/`MatEndDate`'s typed-text parsing is not ported** (`_onInput`'s
   `DateAdapter.parse` dispatch, arrow-key cross-navigation at a boundary, Backspace-to-previous-
   field) — no scenario in this port's contract types into either range input (`range-basic`/
   `actions` only ever click calendar cells). Both placeholders are named props
   (`startPlaceholder`/`endPlaceholder`), not `<Slot>`-projected content.
5. **The disabled/independent 3-way fallback chain (input/toggle/picker each with their own
   `disabled`) is collapsed into one `disabled` flag on the shared handle** — no scenario needs
   them independent.
6. **The 4 `mat-calendar-body-hidden-label` spans are created via plain `document.createElement`/
   `appendChild` in a `useVisibleTask$`, never as JSX children of `<tbody>`** (HTML5 foster-
   parenting of non-`<tr>` `<tbody>` children breaks this port's SSR'd markup; see
   `mat-calendar-body.tsx`'s own doc comment). A `MutationObserver` re-appends them after Qwik's
   reconciliation drops them on a re-render.
7. **Calendar header's prev/next buttons don't reuse `<MatIconButton>`** — `MatIconButton`'s
   `disabledInteractive` prop isn't echoed as a literal attribute the way upstream's real template
   does; `CalendarNavButton` reuses `MatIconButton`'s internal pieces directly instead (same
   workaround `qwik-material/paginator`'s `PaginatorNavButton` already established). No tooltip
   hover interaction wired (same accepted gap).
8. **A reopened popup gets a fresh `MatCalendar`/`MatDatepickerContent` instance per `open()` call**
   (never re-seeded from a prop change mid-session) — the same "fresh overlay per open()"
   simplification this project's other overlay-backed ports (`select`/`tooltip`/`timepicker`)
   already establish.

## Resolved issues

### `inline-calendar`'s click hang (pre-dates this session)

Root cause: `mat-calendar-body.tsx`/`mat-calendar-header.tsx` called `idGen.getId(...)`
unmemoized in their render bodies — `getId` bumps a shared counter signal, so every client
re-render subscribed to and re-bumped it, re-rendering forever. Fixed by generating ids once per
mount via `useSignal(() => ...)`. **Lesson: always memoize `useIdGenerator().getId()` calls** —
grep for unmemoized `idGen.getId(` first if a Qwik page hangs on its first client re-render with a
clean SSR/initial compare.

### `inline-calendar`'s intermittent SSR crash (this session)

Symptom: `inline-calendar`'s route intermittently returned `net::ERR_EMPTY_RESPONSE` to Playwright
even on a bare page load with no interaction, reproducible via repeated plain `curl` too (sometimes
200 clean, sometimes a well-formed SSR HTML document immediately followed, in the same response
stream, by a second appended "500 Internal Server Error" HTML fragment). The preview server's log
showed a recurring `Error: Code(3)` (`QError_verifySerializable`) thrown from `beforeClose` in
`entry.preview.js`, logging the unserializable value as a bare `[Function: i]`.

Root cause: `mat-calendar.tsx`'s `MatCalendar` had a plain (non-`$()`) local `refocusActiveCell`
helper, called from six separate `$()` handlers (`onPeriodClick$`/`onPrevious$`/`onNext$`/
`onActiveDateChange$`/the two drill-down handlers/the mount task). Qwik's optimizer captured this
shared helper as a runtime closure value rather than inlining its one-line body into each chunk;
a plain function value can't be serialized into the SSR'd resumability state, so the container's
`beforeClose` serialization step threw — *after* the main HTML had already streamed, corrupting
the HTTP response with an appended error page. `inline-calendar` is the one scenario rendering
`<MatCalendar>` directly in the initial SSR'd page (every other scenario's calendar lives inside a
client-created overlay, which doesn't hit the SAME container's serialization at initial load).

Fixed by inlining `pendingFocusOrigin.value = <origin>` at each of the six call sites instead of
calling the shared closure. Verified: 20 back-to-back `curl` requests with zero `Code(3)` errors,
`inline-calendar` passing `--repeat-each=3`, and a full datepicker-suite re-run showing no other
regressions. See "Architecture" above for the generalized lesson.

## Resolved issues (were open at handoff)

- **`typed-date-blur` label not floating for unparseable text.** The input's render-time resync
  derived `empty` from the model only; upstream's `MatInput.empty` reads the native value, so
  "not a date" (model `null`) still floats the label. Now empty = no model AND no native text.
- **`typed-date-blur` stuck `mdc-line-ripple--active --deactivating`.** A harness frame-scheduling
  race, lost by either app (observed on both): blurring before a frame paints `--active` makes
  the deactivation an opacity 0 -> 0 no-op, so `transitionend` never fires. The step now blurs
  only once the ripple's `::after` is fully visible, as it always is for a real user.
- **`actions (calendar)` ripple state on re-open.** Upstream re-attaches the SAME actions view on
  every open, so a Cancel/Apply button whose ripple was lazily initialized stays initialized
  (`mat-ripple-loader-uninitialized` gone, `.mat-mdc-button-ripple` present). This port
  re-creates the buttons per open; `ActionsOutlet` (`mat-datepicker-content.tsx`) records which
  buttons (by DOM position) were initialized in `picker._actionsRippleMemory` and replays a
  `mouseenter` to them on re-open.

## Public API usage example

Single date, with an actions row (mirrors upstream's own two-field
`datepicker-actions-example` almost verbatim):

```tsx
import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  applyDatepickerSelection,
  cancelDatepickerSelection,
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: new Date(2024, 0, 1),
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });

  return (
    <MatFormField
      label={<MatLabel>Choose a date</MatLabel>}
      control={
        <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
      }
      iconSuffix={<MatDatepickerToggle picker={picker} />}
      infixContent={
        <MatDatepicker
          picker={picker}
          actions={
            <>
              <MatButton onClick$={$(() => cancelDatepickerSelection(picker))}>Cancel</MatButton>
              <MatButton appearance="elevated" onClick$={$(() => applyDatepickerSelection(picker))}>
                Apply
              </MatButton>
            </>
          }
        />
      }
    />
  );
});
```

A date range swaps `MatDatepickerInput`/`MatDatepicker`/`useMatDatepicker` for
`MatDateRangeInput`/`MatDateRangePicker`/`useMatDateRangePicker` (value becomes
`DateRange<Date>` — `{start, end}` — and `MatDateRangeInput` takes `startPlaceholder`/
`endPlaceholder`/`disableAutomaticLabeling` instead of a `value` prop); see
`range-basic`'s/`actions`'s own dev-app routes for the full form. `typed-date-blur`'s route shows
the `[formControl]`-bound shape (`formBound` prop on `MatDatepickerInput`, `picker.touched`/
`.dirty`/`.parseError` wired to `MatFormField`). `touchUi`, `min`/`max`, `dateFilter`,
`startView`, and `disabled` are all plain live options on `useMatDatepicker()`/
`useMatDateRangePicker()` — see each scenario's own dev-app route for a worked example of each
(`touch-ui`, `min-max-filter`, `start-view-year`/`start-view-multi-year`, `disabled`).

## Done when (status against the task's own bar)

| Scenario | Status |
| --- | --- |
| `inline-calendar` | **pass 3×** (fixed this session — see "Resolved" above) |
| `basic-popup` | pass 3× |
| `preselected-value` | pass 3× |
| `start-view-year` | pass 3× |
| `start-view-multi-year` | pass 3× |
| `min-max-filter` | pass 3× |
| `typed-date-blur` | pass 3× (Qwik v2 regression, fixed 2026-11-01 — see "Qwik v2 regression fixes" above) |
| `disabled` | pass 3× |
| `keyboard-nav` | pass 3× |
| `escape-restore-focus` | pass 3× |
| `actions` (field) | pass 3× |
| `actions` (calendar) | pass 3× (Qwik v2 regression, fixed 2026-11-01 — see "Qwik v2 regression fixes" above) |
| `range-basic` | pass 3× |
| `touch-ui` | pass 3× |

- `pnpm -C src/qwik-material build && test && typecheck && lint:no-ssr-leaks`: **all pass** (147
  test files / 737 non-skipped tests / 0 failures; typecheck clean; no SSR leaks). Datepicker-scoped
  unit tests (`vitest run datepicker`): **32/32 passing**.
- `pnpm -C src/qwik-cdk`: not touched this session; `build`/`lint:no-ssr-leaks` re-confirmed clean
  as part of the normal rebuild-before-test cycle (full `qwik-cdk` vitest suite not separately
  re-run — no source changes to it).
- Regression specs re-run against this branch's build:
  - `specs/material-form-field` + `specs/material-timepicker`: 22/23 pass — the 1 failure
    (`material-timepicker`'s `min-max`) is a pre-existing, separately documented Qwik-core crash
    (see `qwik-material/timepicker/SYNC.md`'s own "Known open issue" section), unrelated to this
    port.
  - `specs/material-select` + `specs/material-dialog`: 37/37 pass.
- Preview server: left running on port 4181 for any immediate follow-up verification; kill via
  `kill $(lsof -tiTCP:4181 -sTCP:LISTEN)` before finishing if not needed further.

## `ref` prop — composed with `picker._elementRef` (2026-11-02)

`MatDatepickerInputProps.ref` (new): an external ref, merged via `composeRef()` with
`picker._elementRef` (previously the sole `ref` on the rendered `<input>`, internal to this
package). Same rationale and zero-effect-when-omitted guarantee as `qwik-material/input`'s
identical addition — see that package's SYNC.md and `qwik-material/README.md`'s "Using with
Formisch". For a datepicker, the recommended Formisch wiring syncs `picker.value`
(this port's typed `D | null`) to the field's input via `useMatDatepicker()`'s existing
`onValueChange$` (fires uniformly whether the user typed or picked a date — no new API needed
for that half); `ref` is only needed so Formisch's `focus()` can find the native element.

## `useMatDatepicker({value})` external resets — `setMatDatepickerValue`, not a `useTask$` on the option (2026-11-02)

Same NEED as `qwik-material/select`'s 2026-11-02 `value` fix (a consumer needing to
imperatively put a value back into the picker from outside after mount — first real consumer:
Formisch's `reset()`/`setInput()`, see `qwik-material/README.md`'s "Using with Formisch") — but
NOT the same fix. First tried the identical `useTask$(({track}) => value.value = track(() =>
options.value))` pattern that fixed `MatSelect`. **Confirmed live it does NOT work**: built a
throwaway debug route calling both `<MatSelect value={sig.value}/>` (a JSX prop) and
`useMatDatepicker({value: sig.value})` (a plain hook-call argument) side by side, with a button
reassigning `sig.value` for each — the select's displayed value updated after the click, the
datepicker's did not (confirmed via Playwright reading both elements' text/value before and
after). Root cause: Qwik's live per-prop tracking (the thing that lets `track(() =>
props.value)` inside a CHILD's own `useTask$` observe a change made several components away) is
specifically a property of `component$` PROPS — Qwik's runtime keeps a component's `props`
object genuinely live/subscribable across re-renders. A plain function argument (`options`,
here) has no such mechanism: by the time `useMatDatepicker(options)` runs, `options.value` is
already a fully-resolved plain `D | null`, with no signal left behind to subscribe to, so a
`track()` call against it only ever runs once (at mount) and never again — no amount of the
ROUTE itself re-rendering changes that, since `useTask$`'s re-invocation is driven purely by
what it tracked, not by its owning hook being "called again".

Fixed instead with an explicit, exported imperative setter — `setMatDatepickerValue(picker,
value)` (`datepicker-runtime.ts`), doing exactly what every INTERNAL selection path already does
(`picker.value.value = value` + the same `writeFormattedValue` DOM-property write
`handleDatepickerUserSelect`/`applyDatepickerSelection`/`handleDatepickerInput` use). The
CONSUMER calls this from their OWN component's `useTask$` tracking whatever live signal they
actually have (Formisch's `field.input.value`, in the Formisch example) — which genuinely works,
because that task lives in a REAL component, not inside this hook. See `use-mat-datepicker.ts`'s
`UseMatDatepickerOptions.value` doc comment. Not applied to `useMatDateRangePicker()`/range
selections in this pass (no consumer needs it yet; same fix shape would apply).

## Fixed: standalone `useContext` crash for the optional form-field contexts (2026-11-02)

This component's `useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined)`/`useContext(
MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined)` calls were switched to `core/mat-form-field-
control.ts`'s new `useOptionalFormFieldControlState()`/`useOptionalFormFieldConnectedOrigin()`
— see that file's own SYNC.md entry for the full write-up (a real, previously-latent Qwik
`Code(Q8)` crash whenever this component is used with no `<MatFormField>` ancestor at all, found
porting `qwik-material/autocomplete`'s `autocomplete-plain-input` docs example). Zero behavior
change for every existing (always form-field-nested) scenario.

## Added: independent per-element `disabled` override (2026-11-02, docs example port)

`MatDatepickerInput`/`MatDatepickerToggle` both used to read `picker.disabled.value`
unconditionally — any `disabled` prop passed directly to either (not through the shared
`useMatDatepicker()` call) was silently ignored, even though `MatDatepickerInputProps` already
declared the field (inherited from `MatFormFieldControlProps`) and `MatDatepickerToggleProps` had
no such field at all. Found porting the docs site's `datepicker-disabled` example, which needs 3
independent combinations: the whole picker disabled, just the toggle, and just the input
(upstream's real `<input matInput disabled>`/`<mat-datepicker-toggle disabled>` already override
independently of each other and of `<mat-datepicker>`'s own state). Fixed: both components now
compute `props.disabled ?? picker.disabled.value` (added a `disabled?: boolean` field to
`MatDatepickerToggleProps`) and use that for their own rendered `disabled` attribute (and, for
the input, the focus-handler's disabled gate) instead of the shared flag directly. Every
pre-existing scenario omits this prop on the sub-components, so `props.disabled` is always
`undefined` there and the fallback keeps the exact previous behavior — confirmed via `pnpm -C
src/qwik-material test` (783/783 unchanged). Does NOT extend to `<MatDatepicker>`/`<MatCalendar>`
themselves (upstream's `<mat-datepicker disabled="false">` forcing the CALENDAR enabled
independently of the input) — not needed by any scenario's default (closed, non-interacting)
render, so left as a documented gap rather than widening the fix further.

## Fixed: custom toggle icon lost on re-render (2026-11-03)

`MatDatepickerToggle`'s `icon` prop was rendered directly, so a re-render of this component (hover/focus state) rendered the same
`JSXOutput` a second time, which Qwik v2 corrupts: the `<mat-icon>` came back empty. Wrapped in
`cloneJsxForReuse()` (`core/jsx-reuse.ts`), as `MatMenuItem` already does for its `icon`. Guarded by
`qwik-cdk-parity-tests/specs/examples-rerender/`, which hovers and focuses every example.

## DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass (2026-11-03)

Ports upstream's pluggable `DateAdapter` abstraction, `MAT_DATE_FORMATS`, `MAT_DATE_LOCALE`
(+ runtime `setLocale()`), and `dateClass` (`MatCalendarCellClassFunction`) — previously
hardcoded to the `en-US` `NativeDateAdapter` everywhere (Deviation 2, above) and entirely unported
(`dateClass`, Deviation 1). Shared infrastructure lives in `core/datetime/` (see `core/SYNC.md`'s
own, shorter pointer to this section) and `core/datetime/native-date-adapter.ts`'s
`NativeDateAdapter` class.

### The core design problem, and why it shapes everything below

A custom `DateAdapter` is, almost by definition, a class with methods (upstream's own
`DateAdapter` is an abstract class apps subclass). This project's own established rule — repeated
across many `SYNC.md` files — is that **a class instance with methods can't be put into Qwik's
serializable resumable state**: reading it back after a real SSR→resume round trip throws
`Code(Q20)` (`QError_serializeErrorUnknownType`) the moment the container tries to serialize a
reference to it (confirmed live, the hard way — see "A genuine regression found and fixed" below).
So the question this whole feature has to answer is: **how is an app-supplied adapter available
on the server AND on the client after resume, without ever serializing the instance itself?**

The answer, consistently applied everywhere below: **never store a live adapter instance in Qwik
state. Store a `QRL` *factory* instead (`QRL<(locale: string) => DateAdapter<D>>`), and resolve it
into a fresh instance wherever one is actually needed, every time, discarding it immediately
after.** A `QRL` is Qwik's own native "survives serialization" primitive (a lazy chunk reference,
not a captured live object) — this project already relies on exactly this mechanism for other
callback-shaped props that must survive resume (see `mat-month-view.tsx`'s own `dateFilter`
QRL — "a QRL is itself callable, resolving+invoking in one step" — and `autocomplete/mat-
autocomplete.tsx`'s `displayWith$`). `dateClass` reuses the identical mechanism. Constructing a
fresh `NativeDateAdapter`-family instance is cheap (no I/O, just a few `Intl.DateTimeFormat`
objects), so "rebuild it every time" costs nothing observable.

The one place this project still allows a module-level **singleton instance** (`DEFAULT_DATE_ADAPTER`,
unchanged since the original timepicker port) is for the hardcoded, non-configurable fallback —
and purely for **arithmetic** (`getYear`/`addCalendarDays`/`sameDate`/etc., which are
locale/adapter-independent: a subclass in this project's intended use case only ever overrides
`parse()`/`format()`, never the arithmetic). Locale-sensitive **label** text (month/weekday
names, the calendar header's period text) and a possibly-custom adapter's `parse()`/`format()`
are the only things that ever need the *configured* adapter.

### Public API

```tsx
import {$, component$} from '@qwik.dev/core';
import {
  NativeDateAdapter,
  useMatDateAdapterProvider,
  type MatDateFormats,
} from '@angular-community/qwik-material/core';

// Apps whose users type dates as dd.mm.yyyy: subclass NativeDateAdapter, overriding only
// parse()/format() — every other method (arithmetic, comparisons, locale-aware names, time
// parsing/formatting) is inherited for free, so the SAME subclass works for the datepicker
// input, the date-range input, AND the timepicker.
class DotDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value === 'string') {
      const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (match) {
        const [, dd, mm, yyyy] = match;
        return this.createDate(Number(yyyy), Number(mm) - 1, Number(dd));
      }
    }
    return super.parse(value, parseFormat);
  }
  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'DD.MM.YYYY') {
      const dd = String(this.getDate(date)).padStart(2, '0');
      const mm = String(this.getMonth(date) + 1).padStart(2, '0');
      return `${dd}.${mm}.${this.getYear(date)}`;
    }
    return super.format(date, displayFormat);
  }
}

const DOT_DATE_FORMATS: MatDateFormats = {
  parse: {dateInput: 'DD.MM.YYYY'},
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: {year: 'numeric', month: 'short'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
  },
};

export default component$(() => {
  // App-wide if called near your app's root; scoped to one subtree if called deeper (an inner
  // call shadows an outer one for its own descendants, like every other provider hook). ONE
  // call configures useMatDatepicker(), useMatDateRangePicker(), AND useMatTimepicker()
  // together.
  useMatDateAdapterProvider({
    factory: $((locale: string) => new DotDateAdapter(locale)),
    formats: DOT_DATE_FORMATS,
    locale: 'en-GB',
  });
  return <MyPage />;
});
```

`factory` is a **`QRL` factory**, never a live instance — see "The core design
problem" above. Omit any of the three keys to fall back to `NativeDateAdapter`/
`MAT_NATIVE_DATE_FORMATS`/`'en-US'` (unchanged behavior for every pre-existing scenario, none of
which provide any of them).

**Runtime locale changes** (upstream: `DateAdapter.setLocale()`, which notifies subscribed
views via `localeChanges`) are Qwik-native here: `useDateLocale()` (exported from
`@angular-community/qwik-material/core`) returns the SAME reactive `Signal<string>` every
date-aware descendant resolves its locale from. Writing to it directly re-renders every consumer
tracking it — no `setLocale()` call needed on any particular instance:

```tsx
import {useDateLocale} from '@angular-community/qwik-material/core';

const locale = useDateLocale();
// ... locale.value = 'fr';
```

`DateAdapter.setLocale()`/`.localeChanges` ARE also ported on the interface/`NativeDateAdapter`
itself (`setLocale(locale)` mutates `this.locale` and bumps `localeChanges: Signal<number>`) for
API-shape fidelity with upstream and for any code holding a live instance directly — but
`useDateLocale()`'s context signal is the mechanism every port component actually reads.

`dateClass` (mirrors upstream's `[dateClass]`): pass a `QRL<MatCalendarCellClassFunction<D>>` to
`useMatDatepicker()`/`useMatDateRangePicker()`:

```tsx
const picker = useMatDatepicker<Date>({
  dateClass: $((cellDate: Date, view: 'month' | 'year' | 'multi-year') =>
    view === 'month' && cellDate.getDate() === 1 ? 'month-start' : '',
  ),
});
```

Resolved the exact same way `dateFilter` already was (same `useTask$`, same `Promise.all`), and
applied via `calendar-math.ts`'s new `normalizeCellCssClasses()` (accepts a string, string array,
`Set`, or a record of class name to boolean — same shape as upstream's `ngClass`-compatible
return value) onto each `CalendarCell.cssClasses`, rendered by `mat-calendar-body.tsx` right after
the static `mat-calendar-body-cell` class, before every conditional one — mirrors upstream's own
`[class]="item.cssClasses"` binding order exactly.

### Where each piece is actually read — the full call chain

- **`core/datetime/use-date-adapter.ts`**: `MAT_DATE_ADAPTER_FACTORY` (QRL factory context),
  `MAT_DATE_FORMATS` (plain-data context, unchanged), `MAT_DATE_LOCALE` (`Signal<string>`
  context) + `useDateAdapterFactory()`/`useDateFormats()`/`useDateLocale()` +
  `resolveDateAdapter(factory, locale)` (the one place that actually calls a factory QRL).
- **`dialog/qwik-material-provider.tsx`**: `matDateAdapterFactory`/`matDateFormats`/
  `matDateLocale` props, providing the three contexts above. `matDateLocale` seeds a PLAIN
  `useSignal()` — deliberately NOT guarded-resynced against the prop on every render (see "A
  genuine regression found and fixed" below for why a guard here is actively wrong, not merely
  unnecessary).
- **`use-mat-datepicker.ts`**: `useDatepickerCoreSignals()` (shared by `useMatDatepicker()`/
  `useMatDateRangePicker()`) calls all three hooks ONCE, at hook-creation time (render-legal —
  this hook runs inside the CONSUMER's own render body, never nested inside another component's
  prop), stashing them onto `MatDatepickerCore<D>` as `_dateAdapterFactory`/`_dateFormats`/
  `_locale`. `dateClass`/`dateFilter` are plain QRL fields, re-read fresh (no signal needed —
  nothing subscribes to them reactively).
- **`use-mat-timepicker.ts`**: identical pattern, `MatTimepickerHandle`'s own
  `_dateAdapterFactory`/`_dateFormats`/`_locale`.
- **`datepicker-runtime.ts`**: `resolveAdapterForPicker(picker)` (async, calls
  `resolveDateAdapter(picker._dateAdapterFactory, picker._locale.value)`) is what every
  parse/format call site goes through: `handleDatepickerInput`/`handleDatepickerBlur`
  (via the shared `parseAndCommitTypedDate()` — see "A genuine regression found and fixed" for
  why blur re-parses the native input's own text rather than trusting the model was already
  updated), `handleDatepickerUserSelect`/`applyDatepickerSelection`/`handleRangePickerUserSelect`/
  `applyDateRangePickerSelection`/`writeRangeFormattedValues` (all now `async`).
  `formatDateForDisplay()`/`writeFormattedValue()` (unchanged name/signature, used for the
  SSR-correct INITIAL display snapshot and `setMatDatepickerValue()`'s existing contract) still
  use the hardcoded `DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` singleton — see "Known gaps"
  below for the one deviation this causes.
- **`timepicker-runtime.ts`**: `resolveAdapterForTimepicker(picker)`, same shape. Only the
  connected input's TEXT parse/format (`handleTimepickerInput`/`handleTimepickerBlur`/
  `selectTimepickerOption`'s reformat, via the shared `formatInputValue()`) goes through it;
  building the option LIST/labels still uses the hardcoded singleton (see `timepicker/SYNC.md`).
- **Calendar rendering** (`mat-calendar.tsx`/`mat-calendar-header.tsx`/`mat-month-view.tsx`/
  `mat-year-view.tsx`/`mat-multi-year-view.tsx`): these do NOT go through the QRL-factory
  mechanism at all — only LOCALE (a plain string, always safe to construct a hardcoded
  `new NativeDateAdapter(locale)` from, the same "hardcoded module function" shape
  `qwik-cdk`'s `ensureCdkDispatchers()` already establishes) is threaded, via a `locale?: string`
  prop each resolves with a `resolveLabelAdapter(locale)` helper (falls back to the plain
  `DEFAULT_DATE_ADAPTER` module constant when the locale matches it — skips even that trivial
  allocation on the overwhelmingly common default-locale path). `MatCalendar` itself resolves
  `props.locale ?? useDateLocale().value` — see the next section for why the prop exists at all.

### Why the calendar POPUP needs `locale` threaded as a prop (a genuine architecture bug, found and fixed)

`MatCalendar`'s own `useDateLocale()` call is correct for the **standalone** `inline-calendar`
case (a plain descendant of whatever `<QwikMaterialProvider>` the app renders) but WRONG for the
**popup** case: `MatDatepickerContent` (and the `MatCalendar` inside it) is created via
`overlay.create()`, and the resulting Qwik component tree is NOT a descendant of wherever the
owning `<input matDatepicker>`'s own `<QwikMaterialProvider>` sits in the page — confirmed live
(the `datepicker-locale` example, nested entirely inside its own `<QwikMaterialProvider
matDateLocale="ja-JP">`, opened a calendar showing `en-US`-default month names, not `ja-JP`, until
fixed). Fixed by threading the resolved locale explicitly: `datepicker-runtime.ts`'s
`openDatepickerPanel`/`openDateRangePickerPanel` read `picker._locale.value` (correctly scoped,
resolved by `useMatDatepicker()`'s own hook call) and pass it through `MatDatepickerContentProps.
locale` → `<MatCalendar locale={props.locale}>`, which prefers the prop over its own
`useDateLocale()` fallback. This is a snapshot taken at `open()` time, not a live binding — a
reopened popup gets the CURRENT locale (matches this project's own pre-existing "fresh overlay
per `open()` session" simplification for every other prop too; see Deviation 8, above) but an
ALREADY-OPEN popup's calendar does not follow a LATER locale change made while it's still open —
not tested by any scenario (the one functional spec exercising a live locale switch re-opens the
calendar afterward specifically because of this).

### A genuine regression found and fixed, mid-task: `useContext()`'s function-as-default gotcha

`useDateAdapterFactory()`'s first implementation did `useContext(MAT_DATE_ADAPTER_FACTORY,
DEFAULT_DATE_ADAPTER_FACTORY)` — passing the default FACTORY QRL directly as `useContext`'s
default-value argument. This crashed **every** `qwik-material/datepicker`/`timepicker` scenario's
real SSR (not just new ones) with `Code(Q20)`, confirmed live via the raw preview-server log. Root
cause: `useContext(ctx, defaultValue)` treats any FUNCTION-typed default as a lazy initializer,
invoking it immediately (with ZERO arguments) when no provider exists, and persisting the RETURN
VALUE — and a QRL is itself callable (`typeof someQrl === 'function'`), so it was invoked as
`DEFAULT_DATE_ADAPTER_FACTORY()` (missing its required `locale` argument), and the resulting
PENDING PROMISE — not a resolved adapter, not even a correctly-invoked one — is what got persisted
into the context slot and then failed to serialize. Exactly the same gotcha `mat-dialog.tsx`'s/
`mat-bottom-sheet.tsx`'s own `useContext(..., null)`-then-substitute pattern already documents
for a plain (non-QRL) factory default; it turns out to apply to a QRL default too, for the same
reason (both are `typeof 'function'`). Fixed: `useDateAdapterFactory()` now passes `null` (never a
function, never `undefined`) as the sentinel default, substituting `DEFAULT_DATE_ADAPTER_FACTORY`
in plain JS afterward.

A second, independent bug was found fixing the FIRST `datepicker-locale` functional test: an
earlier version of `QwikMaterialProvider`'s `matDateLocale` wiring read `localeSignal.value` for
comparison, inside a guard meant to re-sync the signal if the PROP changed (`if
(props.matDateLocale !== undefined && localeSignal.value !== props.matDateLocale) {
localeSignal.value = props.matDateLocale; }`). This is SELF-DEFEATING: reading `.value` during
`QwikMaterialProvider`'s OWN render SUBSCRIBES it to its own signal — so the very next time a
DESCENDANT changed it (the whole point of `useDateLocale()`), this re-render fired and
immediately overwrote it back to the stale prop value. Every click of the `datepicker-locale`
example's "Dynamically switch to French" button silently reverted. Fixed by removing the guard
entirely: `matDateLocale` is a ONE-TIME SEED only (`useSignal(props.matDateLocale ?? 'en-US')`,
nothing else) — exactly like `animationsDisabled`'s own, adjacent, unguarded seed in the same
file. A descendant-mutated `Signal` that a PROVIDER also reads-to-compare-against-its-own-prop is
a real, reusable lesson: don't.

A third bug, this one test-infrastructure-only (not a port bug): Playwright's `.click({force:
true})` on an element behind a full-viewport overlay backdrop (the calendar's own transparent
dismiss-on-outside-click backdrop) still uses coordinate-based synthetic mouse dispatch — `force`
only skips Playwright's OWN pre-click actionability checks, not the browser's real hit-testing —
so the click landed on the BACKDROP, not the button underneath it, closing the calendar but never
firing the button's own handler. Fixed in the test by using `.dispatchEvent('click')` (dispatches
a real DOM `click` directly at the element, no coordinate hit-testing — still bubbles to the same
outside-click dispatcher, so the backdrop dismissal still fires too, correctly).

### Known gaps

- ~~A pre-seeded `value`'s FIRST paint uses the hardcoded `en-US` `DEFAULT_DATE_ADAPTER`'s
  format, not a configured custom adapter's.~~ **FIXED** (coordinator follow-up, same task).
  `initialDisplay` on `<MatDatepickerInput>` (and `<MatTimepickerInput>` — see
  `timepicker/SYNC.md`) is now a `useComputed$`, not a plain `useSignal`, following the exact
  pattern `qwik-material/icon`'s `resolvedSvgIcon` established first (see that package's SYNC.md
  deviation #20): the compute function returns a plain, synchronous `''` when there's nothing to
  format (the common empty-input case — never even an `async function` for it, so it never enters
  the async-suspension engine at all), and a real `Promise<string>` — resolved through
  `resolveDateAdapter(picker._dateAdapterFactory, mountLocale.value).then(a =>
  formatDateWithAdapter(a, picker._dateFormats, mountValue.value))` — only when a non-null seed
  value needs the configured adapter's own `format()`. Reading `.value` on a still-pending
  `ComputedSignal` THROWS the in-flight promise, which Qwik's own renderer catches and retries —
  SSR blocks until resolved (confirmed live: the raw SSR response body for `/mat-datepicker/
  custom-adapter/`, fetched with a plain HTTP GET and no browser JS at all, already contains
  `"05.12.2024"`/`"14:30"` — the `DotDateAdapter`/`DOT_DATE_FORMATS`-correct text for that route's
  pre-seeded `PRESET_DATE`/`PRESET_TIME` — never the hardcoded-default `"12/5/2024"`/`"2:30 PM"`
  it produced before this fix), and the client re-suspends the same way on its own first read
  after a resume. `mountValue`/`mountLocale` snapshot `picker.value.value`/`picker._locale.value`
  ONCE, at mount, into separate frozen `useSignal`s BEFORE the `useComputed$` reads them — this
  preserves the existing "frozen, computed once, never reactively rewritten" invariant the native
  `value` DOM property write already required (see `mat-input.tsx`'s own `initialValue` doc
  comment); a `useComputed$` that instead called the (already-existing, private)
  `resolveAdapterForPicker(picker)` helper directly would auto-track the LIVE `picker._locale`
  signal (read synchronously, before its first `await`) and could reactively recompute — and
  rewrite the input's `.value` — while a user is actively typing. `MatDateRangeInput` needed no
  equivalent fix: its own `formatted` signal was already built with a `useTask$` that resolves the
  configured adapter (added earlier in this same task), which already blocks SSR the same way.
  New functional spec added: `specs/material-datepicker/functional.spec.ts`'s `pluggable
  DateAdapter — pre-seeded value, initial paint` describe block (2 tests: raw SSR HTML via
  `request.get()`, and the same values still correct after a real-browser resume). The
  `custom-adapter` route (`src/qwik-cdk-dev-app/src/routes/mat-datepicker/custom-adapter/
  index.tsx`) now seeds all three examples with a non-null value (`PRESET_DATE`/
  `PRESET_RANGE_START`/`PRESET_RANGE_END`/`PRESET_TIME`) specifically so a wrong
  (hardcoded-adapter) render is OBSERVABLY different from a correct one; `DOT_DATE_FORMATS.
  display.timeInput` was also changed to an explicit 24-hour `{hour: '2-digit', minute: '2-digit',
  hour12: false}` (was `{hour: 'numeric', minute: 'numeric'}`, which happened to collide with the
  default adapter's own 12-hour-with-numeric-hour shape for some times) so the SAME
  observable-difference trick works for the timepicker fixture too.
- **`<mat-hint>` text bound to a value computed from `useDateLocale()` does not update on a
  locale change.** Pre-existing, unrelated-to-this-task `MatFormField` limitation: `hintStart`
  (like `control`/`infixContent`) is captured into a frozen `useSignal(() => props.hintStart)`
  snapshot at mount (`mat-form-field.tsx`'s own `hintStartSnapshot`) — a later render's new
  `<MatHint>` JSX element for the same slot is never substituted in. Found porting the
  `datepicker-locale` example (upstream's own hint text DOES update, via a live Angular
  `computed()` signal) — the CALENDAR popup's own labels are unaffected (not threaded through any
  of `MatFormField`'s frozen content props), which is why `specs/material-datepicker/
  functional.spec.ts`'s `locale switch updates calendar labels` test only asserts the calendar,
  and why `specs/examples-forms/angular-parity.spec.ts` deliberately has no `datepicker-locale`
  interaction step (see that file's own comment). **Evaluated for a cheap fix in the coordinator
  follow-up above and deliberately left as-is**: `mat-form-field.tsx`'s own doc comment (around
  `controlSnapshot`) documents that EVERY frozen slot signal in that file — not just
  `hintStart` — exists to guard against a confirmed-live Qwik core bug (a freshly-reconstructed
  `JSXOutput` prop value swapped in for an unresolved child component's render QRL can be
  observed disconnected from the DOM mid-replace). Un-freezing `hintStart` alone to fix this one
  gap would reintroduce that exact class of bug for the hint slot specifically — not a small or
  safe change, so left documented rather than attempted.
- ~~`specs/material-datepicker/angular-parity.spec.ts`'s `actions (calendar)` scenario: a 12px
  horizontal overlay-position difference.~~ **This was a genuine REGRESSION introduced by this
  task, not pre-existing — found and fixed in the coordinator follow-up.** Proven with a
  throwaway `git worktree add /tmp/dates-base a684af0357` (the base commit on `qwik-port-21.2`,
  before any of this task's changes) built and served on `:4197`: `actions (calendar)` passed
  6/6 there (3 repeats) against the SAME `:4201` Angular reference that failed against this
  branch's own `:4192` preview. Root cause: `src/qwik-material-examples/datepicker/
  datepicker-locale/datepicker-locale-example.css` (added by THIS task, for the `datepicker-locale`
  example) had a bare, unscoped `mat-form-field { margin-right: 12px; }` rule, copied verbatim
  from upstream's own Angular example — which relies on Angular's automatic per-component View
  Encapsulation to scope that selector invisibly to just that one component's template. This
  port's plain CSS import (`import './datepicker-locale-example.css'`, same shape every other
  example uses) has NO such scoping: it is a GLOBAL side effect the moment that CSS chunk is
  bundled into the dev-app AT ALL, applying to every `<mat-form-field>` on every route, not just
  `datepicker-locale`'s own two fields — including the completely unrelated `actions` scenario,
  which happens to be the only scenario in this suite with two `<mat-form-field>`s side by side
  (making the leak position-sensitive, and therefore the only place a DOM-parity comparison could
  actually observe it; `actions (field)`, which compares structure/classes rather than absolute
  pixel position, never caught it either). Fixed by scoping the selector to the example's own
  host tag instead: `datepicker-locale-example mat-form-field { margin-right: 12px; }` (the
  component already renders a `<datepicker-locale-example>` wrapper). Verified: `actions`'s
  computed `margin` went from `0px 12px 0px 0px` back to `0px`; `datepicker-locale`'s own two
  fields are unaffected (still `0px 12px 0px 0px`). Two OTHER, pre-existing examples in the same
  directory have the identical unscoped shape (`timepicker-datepicker-integration-example.css`,
  `timepicker-validation-example.css`) — left untouched (out of scope for this fix; neither
  happens to collide with a position-sensitive scenario the way this one did, so they're latent,
  not regressions).

### Verification

- `pnpm -C src/qwik-material test` (build + vitest + lint:no-ssr-leaks + typecheck): vitest
  783/783 unchanged; `lint:no-ssr-leaks` shows the same 2 PRE-EXISTING, unrelated leaks
  (`select/mat-select.tsx:435`, `timepicker/mat-timepicker-input.tsx:201` — confirmed via `git
  show HEAD:...` that both lines are byte-identical to before this task, untouched); `tsc
  --noEmit` clean.
- `src/qwik-material-examples`/`src/qwik-material-docs` both typecheck clean.
- `pnpm -C src/qwik-material-docs generate` picks up the 2 new examples
  (`datepicker-date-class`/`datepicker-locale`) automatically.
- New functional specs (`specs/material-datepicker/functional.spec.ts`, now 7 tests — 5 from the
  original task plus the 2 pre-seeded-value/SSR ones from the coordinator follow-up): 21/21 across
  `--repeat-each=3`.
- New example parity cases (`datepicker-date-class`/`datepicker-locale`, default + the
  `date-class` interaction): 9/9 across `--repeat-each=3`; the full `specs/examples-forms` suite
  (50 tests, every batch — re-run clean after the `datepicker-locale-example.css` scoping fix) and
  `specs/examples`/`specs/examples-rerender` filtered to `date|time` all pass (21/21).
- `specs/formisch` (12/12, including its own `datepicker round-trips` test exercising the
  now-async `handleDatepickerBlur`/`setMatDatepickerValue` paths) unaffected.
- `specs/material-datepicker/angular-parity.spec.ts`: 24/24 — INCLUDING `actions (calendar)`,
  confirmed stable 10/10 across `--repeat-each=5` after the CSS-scoping fix.
  `specs/material-timepicker/angular-parity.spec.ts`: 6/7 (the one pre-existing, unrelated
  `min-max` failure this project's baseline already carries — see `qwik-port-21.2`'s own baseline,
  578/579).

## `ErrorStateMatcher` (2026-11-03)

`MatDatepickerInput`'s own `errorState` previously hardcoded the default formula directly. Now
reads `props.errorStateMatcher ?? <QwikMaterialProvider errorStateMatcher> ?? 'touched'` via the
same `useSignal`+`useTask$` resolution pair every other control now shares — see
`core/error-state-matcher.ts`'s doc comment for the full design and `input/SYNC.md`'s own
`ErrorStateMatcher` section for the shared write-up and the scenarios covering it. `touched`/
`dirty`/`invalid` themselves are unaffected — still sourced from `picker.touched.value`/
`picker.dirty.value`/`picker.parseError.value` (or the owning `MatFormField`'s context store)
exactly as before; only the formula combining them with `submitted` into `errorState` changed.

## Fixed: Code(Q3) under the Vite dev server (2026-11-06)

Qwik's dev mode verifies that every value a `$()` callback captures is serializable; production
builds don't, so this only showed under `vite` / `pnpm dev`. The calendar popup's `onSelect`/`onClose` props are plain functions created per open; the multi-year and year views' local `selectYear`/`selectMonth` helpers were plain functions captured by their key/click handlers. These values only exist in
the browser, so they're now marked `noSerialize` (or the local helper is inlined into the
handlers). Found by sweeping every dev-app page under the dev server.

## Toggle stops click propagation (2026-11-09)

Upstream's `MatDatepickerToggle` host click handler calls `event.stopPropagation()` when it opens
the picker, so the surrounding form field doesn't also focus the input. A lazily loaded `onClick$`
can't do that in time, so the host declares `stoppropagation:click` while enabled (Qwik's loader
stops propagation synchronously). Needed once the form field's container click actually focused
the input (see form-field/SYNC.md, 2026-11-09).
