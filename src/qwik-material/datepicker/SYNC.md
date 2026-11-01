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

1. **No comparison-range cells/bridges, no drag-to-select, no custom per-date CSS classes
   (`dateClass`), no custom calendar header (`ComponentPortal`/`headerComponent`).** None of this
   port's 13 contract scenarios exercise them. `comparisonDateAccessibleName` text is still
   hardcoded to `DATEPICKER_INTL.comparisonDateLabel` + the start/end accessible name on every
   view (matches upstream's own unconditional interpolation).
2. **`DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` module singletons used everywhere** — no
   scenario needs a non-default locale, and the singleton sidesteps a real hazard (storing a
   *resolved* filter function in a signal needs `noSerialize()` and reads back `undefined` until a
   later client task — too late for SSR-correct disabled-cell classes). `dateFilter` is resolved
   inside a `useTask$` per view, never inside the component's own render body, writing the
   fully-built plain-data grid into a signal.
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
import {$, component$, useSignal} from '@builder.io/qwik';
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
