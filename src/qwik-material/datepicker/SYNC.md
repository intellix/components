# qwik-material/datepicker sync log

Tracks the sync state between this port and `src/material/datepicker/` upstream. Companion to
`src/qwik-material/timepicker/SYNC.md` (closest analogue — overlay/key-manager/form-field-control
plumbing) and `src/qwik-material/core/SYNC.md` (the `DateAdapter`/`NativeDateAdapter`/
`MAT_DATE_FORMATS` abstraction this reuses verbatim).

**Status at handoff: calendar rendering stack built and unit-tested; the popup/input/toggle/
range-input/actions/touch-ui half of this component is NOT started.** See "Done when" at the
bottom for the exact scenario-by-scenario breakdown and the one open structural-vs-interaction
issue that blocked further progress this session.

## Upstream sync state (SCSS)

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `scss/datepicker/calendar.scss` | `src/material/datepicker/calendar.scss` | synced | cdk-stub swap only |
| `scss/datepicker/calendar-body.scss` | `src/material/datepicker/calendar-body.scss` | synced | cdk-stub swap only |
| `scss/datepicker/date-range-input.scss` | `src/material/datepicker/date-range-input.scss` | synced | cdk-stub swap only |
| `scss/datepicker/datepicker-toggle.scss` | `src/material/datepicker/datepicker-toggle.scss` | synced | cdk-stub swap only |
| `scss/datepicker/datepicker-content.scss` | `src/material/datepicker/datepicker-content.scss` | synced | byte-identical (no `@angular/cdk` reference) — has the `_mat-datepicker-content-{dropdown,dialog}-enter`/`-exit` `@keyframes` and the `mat-datepicker-content-animating` CSS hook this port's (not-yet-built) open/close animation JS needs to drive |
| `scss/datepicker/datepicker-actions.scss` | `src/material/datepicker/datepicker-actions.scss` | synced | byte-identical |
| `scss/datepicker/_m2-datepicker.scss` / `_m3-datepicker.scss` / `_datepicker-theme.scss` | same | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/datepicker/datepicker-prebuilt.scss` | n/a (qwik-material-specific) | new | `@use`s all 6 component stylesheets above (upstream has no single aggregated `datepicker.scss` — 6 separate component `styleUrl`s) + a small `:root` block for the 4 `--mat-sys-*` roles (`secondary`, `tertiary-container`, `surface-container-high`, `corner-large`) that no other already-shipped `*-prebuilt.css` in this project defines (confirmed via `grep -l` across `dist/*.css`) |

Entry wired into `package.json` (`./datepicker`, `./datepicker-prebuilt.css`), `vite.config.ts`
(`entries` + `sassEntries`), and the dev-app's `root.tsx` prebuilt-CSS import list — same pattern
every other entry point uses.

## What's built

### Pure logic (framework-free, fully unit-tested — 32/32 passing)

- **`calendar-math.ts`** — ports every non-Angular-lifecycle algorithm from upstream
  `calendar-body.ts`/`month-view.ts`/`year-view.ts`/`multi-year-view.ts`: cell-grid building
  (`buildMonthView`/`buildYearView`/`buildMultiYearView`), the 24-year multi-year window math
  (`getActiveYearOffset`/`getStartingYear`/`isSameMultiYearPage`, confirmed against the contract's
  own "startAt=1990 → window 1968-1991" determinism-pitfall note), keyboard deltas per view
  (`monthActiveDateDelta`/`yearActiveDateDelta`/`multiYearActiveDateDelta` — every key's exact
  resulting date pinned by a test matching the `keyboard-nav` scenario's own documented sequence),
  cell predicates (`isActiveCell`/`isSelected`/`isRangeStart`/`isRangeEnd`/`isInRange`), and the
  calendar-header's period/prev/next logic (`isSameCalendarView`/`previousPeriodEnabled`/
  `nextPeriodEnabled`/`periodDelta` — the `min-max-filter` scenario's "both prev AND next disabled
  simultaneously" case is a pinned test).
- **`date-range-selection.ts`** — ports `MatRangeDateSelectionModel.add()` (`rangeModelAdd`) and
  `DefaultMatCalendarRangeStrategy.selectionFinished()`/`createPreview()` (`rangeSelectionFinished`/
  `rangeCreatePreview`), including the non-obvious "clicking an earlier date restarts the range
  rather than auto-swapping" and "hovering before the pending start previews nothing, not a
  backward range" behaviors, each pinned by a test.

### Components (typecheck clean, full `qwik-material` vitest suite — 737/737 non-skipped — passes with zero regressions)

- **`mat-calendar-body.tsx`** (`MatCalendarBody`) — the shared `<tbody mat-calendar-body>` table
  body (month/year/multi-year all delegate to this): exact cell classes (`-active`/`-selected`/
  `-today`/`-disabled`/range+preview triads), `data-mat-row`/`-col`, the ragged-first-row label
  cell, and the 4 `mat-calendar-body-hidden-label` spans (see "Foster parenting" below for why
  these are NOT plain JSX children).
- **`mat-month-view.tsx` / `mat-year-view.tsx` / `mat-multi-year-view.tsx`** — each wraps
  `calendar-math.ts`'s grid builder + `MatCalendarBody`, owns the Enter/Space armed-on-keydown/
  fired-on-keyup state machine (mirrors `_selectionKeyPressed`), and dispatches
  `onActiveDateChange$`/`onUserSelect$` (month) or `onMonthSelected$`/`onYearSelected$`
  (year/multi-year, drill-down only — see `mat-calendar.tsx`).
- **`mat-calendar-header.tsx`** (`MatCalendarHeader`) — period button (reuses `<MatButton>`) +
  prev/next nav buttons (does NOT reuse `<MatIconButton>` — see "CalendarNavButton" below) +
  the hidden `aria-live` announcement span.
- **`mat-calendar.tsx`** (`MatCalendar`) — owns `activeDate`/`currentView` as internal signals
  (seeded once from `startAt`/`startView`, never re-seeded — relies on a FRESH component instance
  per popup open, same "fresh overlay per open()" simplification `select`/`tooltip`/`timepicker`
  already establish, once the popup half of this component exists), switches between the three
  views, and handles drill-down navigation (`_goToDateInView`) entirely internally — never
  forwarded to the consumer.
- **`datepicker-intl.ts`** — default i18n strings (`DATEPICKER_INTL`), `formatYearRange`/
  `formatYearRangeLabel`. Plain module constants, no live-override mechanism — same "no live
  locale switching" deviation this port's other components already accept.

### Dev-app route

- `src/qwik-cdk-dev-app/src/routes/mat-datepicker/inline-calendar/index.tsx` — the ONLY scenario
  wired up so far. Structural DOM parity against the real Angular dev-app's `[data-parity-root]`
  passes on the INITIAL (pre-interaction) render (confirmed via the parity harness's own
  `compare('initial')` step — see "Open issue" below for why the full scenario, including its two
  click steps, could not be confirmed end-to-end this session).

## Deviations from upstream (so far)

1. **No comparison-range cells/bridges, no drag-to-select, no custom per-date CSS classes
   (`dateClass`), no custom calendar header (`ComponentPortal`/`headerComponent`).** None of this
   port's 13 contract scenarios exercise them.
2. **`DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` module singletons used everywhere** — render
   code AND interactive code, unlike `timepicker`'s own split (which still calls
   `useDateAdapter()`/`useDateFormats()` hooks from render-time code). Simplification: no scenario
   here needs a non-default locale either, and using the singleton uniformly sidesteps a real
   hazard (see next point).
3. **`dateFilter` is resolved inside a `useTask$`, never inside the component's own render body.**
   `component$`'s `OnRenderFn<P>` cannot return a `Promise` in this Qwik version (confirmed via a
   real `TS2345` build error attempting `component$<Props>(async props => ...)`), but
   `matDatepickerFilter` must be a `QRL` (functions-as-props need a QRL to survive the SSR→resume
   boundary — the same "options" lesson `select/SYNC.md` documents) and `calendar-math.ts`'s cell
   builders need a plain synchronous predicate. Each view's `useTask$` resolves the QRL (async
   branch, only when a filter is actually passed) or skips straight to a synchronous rebuild (no
   filter — the common case), writing the fully-built plain-data grid into a signal. Never stores
   a *resolved function* in a signal (that would need `noSerialize()` and would read back
   `undefined` until a later client task repopulates it — too late for SSR-correct disabled-cell
   classes).
4. **No re-focus-into-the-new-active-cell on a view-switch** (upstream's
   `MatCalendar._moveFocusOnNextTick`/`ngAfterViewChecked`) — not exercised by any scenario (every
   drill-down scenario proceeds by mouse click; nothing asserts focus immediately after one).
5. **The 4 `mat-calendar-body-hidden-label` spans are created via plain `document.createElement`/
   `appendChild` in a `useVisibleTask$`, never as JSX children of `<tbody>`.** See the big doc
   comment in `mat-calendar-body.tsx` for the full story — short version: upstream's real template
   puts them as direct `<tbody>` children, which is fine for Angular's DOM-API-built live DOM but
   NOT fine for this port's SSR'd HTML text, which the browser parses and "foster-parents" (HTML5's
   rule that a `<tbody>` can only directly contain `<tr>`/`<script>`/`<style>`/`<template>`)
   relocates them to before the `<table>`. The first fix attempted (move the misplaced JSX nodes
   into place via `appendChild` after mount) DID fix the structural diff, but — confirmed via
   bisection — corrupted Qwik's own reconciliation bookkeeping for the component, reproducibly
   hanging the page on the component's NEXT state-driven re-render. Creating the 4 spans entirely
   outside JSX (so Qwik never has a descriptor for them to reconcile against) avoids that.
6. **Calendar header's prev/next buttons don't reuse `<MatIconButton>`.** Confirmed live:
   `MatIconButton`'s `disabledInteractive` prop is consumed internally (drives `aria-disabled`/
   classes) but never echoed as a literal `disabledinteractive` DOM attribute, while upstream's
   real `calendar-header.html` writes it as a bare (non-bracketed) template attribute that Angular
   DOES echo verbatim. `qwik-material/paginator`'s `PaginatorNavButton` already hit and worked
   around this exact gap for its own nav buttons (rather than widening `MatIconButton` for every
   existing caller); `mat-calendar-header.tsx`'s own `CalendarNavButton` mirrors that same
   workaround (reusing `MatIconButton`'s internal ripple-loader/focus-indicator/touch-target
   pieces directly). No tooltip hover interaction wired (same accepted gap `PaginatorNavButton`
   documents — no scenario in this contract hovers a prev/next button).
7. **`comparisonDateAccessibleName` text is hardcoded to `DATEPICKER_INTL.comparisonDateLabel`
   ("Comparison range") concatenated with the start/end accessible name.** Confirmed live: upstream
   always interpolates `{{comparisonDateAccessibleName}} {{startDateAccessibleName}}` regardless
   of `isRange`/comparison-range support (neither ported — see deviation 1), so the 2 comparison
   spans' text is non-empty on every view, not just range ones.

## Open issue: a hang reproduces when interacting with `inline-calendar` — NOT fully diagnosed

**This is the one thing blocking further progress and needs attention before continuing the
port.** Symptom: running `inline-calendar`'s real `angular-parity.spec.ts` test (or a hand-rolled
Playwright script doing the same thing) past the FIRST click/focus on a calendar cell causes the
QWIK page to stop responding to ANY further CDP command (including a plain `locator.count()` or
even `Profiler.stop()`) for 20-60+ seconds, well past what a `waitForTimeout(150)` (a pure
Node-side timer, confirmed via trace inspection to never fire its `after` event until the browser
context is eventually force-closed by the test timeout) should ever take. The REAL Angular page
never exhibits this.

**What was ruled out / learned, in order:**

1. It is NOT the `useVisibleTask$`-based DOM-repair for the 4 hidden-label spans — confirmed by
   fully disabling that task (reverting to a no-op): the hang still reproduced. (An EARLIER,
   now-superseded version of this investigation incorrectly concluded the DOM-repair task was the
   cause, because disabling it made the test fail FAST on the `compare('initial')` structural
   diff — i.e. it never even reached the click steps that trigger the real hang. That version of
   the fix — "move the misplaced spans via `appendChild`" — is real and worth keeping regardless
   (see deviation 5), but it is not what's causing THIS hang.)
2. Adding `console.log` instrumentation with an explicit call-count circuit breaker to
   `onActiveDateChange$`/`onUserSelect$` (`mat-calendar.tsx`) showed each firing EXACTLY ONCE per
   click/focus in isolated manual Playwright scripts — i.e. not a tight, ever-incrementing
   call-count loop in application code that a circuit breaker could catch.
3. A `Profiler.start()`/`stop()` CDP session (meant to capture a flame graph of whatever's
   spinning during the hang) itself never returned — strong evidence the renderer's main thread is
   genuinely, synchronously unresponsive for the whole window, not just "many renders spread over
   time with gaps a profiler could sample."
4. **A real, separate, confirmed problem was found and is almost certainly at least partially
   responsible for the inconsistent timings observed while debugging this**: this session's own
   earlier diagnostic scripts left **7 orphaned `chrome-headless-shell --type=renderer` processes
   each pegged at 100-113% CPU** (confirmed via `ps aux`), from Node-side script processes that
   were force-killed mid-run without their spawned Chromium subprocess being cleanly closed
   first. With 7 renderer processes competing for the CPU, ANY new Playwright-driven browser
   instance in this sandbox is severely CPU-starved — fully consistent with the observed
   inconsistency (some manual repro attempts completed in under 400ms; others, running the
   identical script, hung for 15-30+ seconds). **This session's sandbox permission layer denied
   every attempt to kill these stray processes** (both a broad `pkill -f chrome-headless-shell`
   and a targeted `kill -9 <specific 7 PIDs>` were refused by the auto-mode classifier as
   "Interfere With Workloads"), so this could not be cleaned up or ruled out as the sole cause.
5. A targeted code change was still made and kept regardless of root-cause uncertainty (cheap,
   plausible, no downside): `mat-month-view.tsx`/`mat-year-view.tsx`/`mat-multi-year-view.tsx`'s
   `useTask$` callbacks were changed from unconditionally `async` to synchronous-unless-a-real-
   filter-needs-resolving (deviation 3 above), reducing the window where this task's own
   microtask chain could overlap with a near-simultaneous second re-render triggered by a
   different handler (e.g. a single click firing both a native `focus` event, handled by
   `onCellFocus$`, and a `click` event, handled by `onCellClick$`, each writing a DIFFERENT
   signal). **This did not resolve the hang** when retested (still reproduced after the stray
   processes were confirmed still present) — but it's a reasonable, low-risk change on its own
   merits, so it stays.

**Next steps for whoever picks this up:**

- **First**, get a clean environment: kill every stray `chrome-headless-shell`/`chromium` process
  left over from this session (`ps aux | grep chrome-headless-shell`, then kill each PID) before
  attempting to reproduce anything — this session's own sandbox would not allow it, but a fresh
  session/shell should be able to.
- Re-run `inline-calendar`'s `angular-parity.spec.ts` test (just that one, `-g inline-calendar`)
  in the clean environment. If it now passes reliably (3x, per the task's own bar), the hang WAS
  purely the stray-process CPU contention and no further code changes are needed here — proceed
  to `basic-popup` per the task's own prescribed order.
- If it still hangs in a verified-clean environment, the next diagnostic step not yet tried: bisect
  by removing `onCellFocus$`'s `props.onActiveDateChange$(...)` call entirely (confirmed, in this
  session, that this alone — with the DOM-repair task also disabled — eliminates the hang in
  isolated manual scripts) and re-test with the REAL harness (not a manual script) to confirm
  whether the combination of "real test harness's click sequencing" + "activeDate update on
  focus" is what's needed to reproduce it, as opposed to either alone. If confirmed, the fix is
  likely to decouple the focus-driven active-cell tracking from the signal write that triggers
  `mat-month-view.tsx`'s `useTask$` re-run (e.g. writing to a plain, untracked field instead of a
  signal for the "visual active cell" concern specifically, separate from the real `activeDate`
  signal used for keyboard navigation).

## Done when (status against the task's own bar)

- `inline-calendar`: structural DOM parity confirmed on initial (pre-interaction) render only.
  The scenario's 2 click steps are blocked by the open issue above — **not yet passing
  end-to-end**.
- `basic-popup` and the other 11 scenarios (`preselected-value`, `start-view-year`,
  `start-view-multi-year`, `min-max-filter`, `range-basic`, `typed-date-blur`, `disabled`,
  `keyboard-nav`, `escape-restore-focus`, `actions`, `touch-ui`): **not started.** None of
  `MatDatepickerInput`, `MatDatepickerToggle`, the overlay open/close runtime (dropdown
  `FlexibleConnectedPositionStrategy` / touch `GlobalPositionStrategy`, the enter/exit animation
  class wiring already described in the SCSS, focus-trap + focus-restore via `focusVia`),
  `MatDateRangeInput`/`MatStartDate`/`MatEndDate`, `MatDatepickerActions`/pending-model handling,
  or `useMatDatepicker()`/`useMatDateRangePicker()` hooks exist yet. The research notes below (and
  the design plan in this file's own history) cover what's needed for all of them; the "Do" list
  in the original task brief is otherwise unchanged.
- `pnpm -C src/qwik-material build && test && lint:no-ssr-leaks && typecheck`: **passes** (147
  test files / 737 non-skipped tests / 0 failures; typecheck clean; no SSR leaks).
- `pnpm -C src/qwik-cdk build && test && lint:no-ssr-leaks`: not re-run this session (no qwik-cdk
  files were touched).
- Regression check (form-field/timepicker/select/dialog specs): covered by the full
  `qwik-material` vitest run above (same test run, same zero-failures result) — their own
  Playwright specs were not separately re-run this session (no browser-based testing could be
  completed reliably — see open issue above).
- Preview server: killed at session end (port 4181).
