/**
 * `<mat-calendar>` — ported from upstream `calendar.ts`/`.html`. Owns `activeDate`/`currentView`
 * as internal signals (seeded from `startAt`/`startView`, never re-seeded from a prop change —
 * matches upstream's own one-time `ngAfterContentInit` seeding; a reopened popup gets a FRESH
 * `MatCalendar` instance per `openDatepickerPanel()` call, same "fresh overlay per open()
 * session" simplification this project's other overlay-backed ports already use, which is what
 * gives this "seed once" approach the same reset-per-open behavior Angular gets from literally
 * destroying/recreating the component).
 *
 * Usable standalone (the `inline-calendar` scenario: `[(selected)]`-equivalent via `selected`/
 * `onSelectedChange$`) AND nested inside the popup's content component (which instead reads
 * `onUserSelect$` to route through its own pending-model/auto-close logic, and passes
 * `autoFocusActiveCell` — see `datepicker-runtime.ts`/`mat-datepicker-content.tsx`).
 *
 * Drill-down wiring (year-view's `monthSelected` -> `_goToDateInView(date,'month')`,
 * multi-year's `yearSelected` -> `_goToDateInView(date,'year')`) is handled ENTIRELY internally,
 * exactly mirroring `calendar.html`'s own wiring — never forwarded to the consumer, since
 * drilling down is navigation, not a value commit.
 *
 * ## Re-focus on open / a view switch / arrow-key nav (`ngAfterViewInit`'s `focusActiveCell()`,
 * `_moveFocusOnNextTick`, `_focusActiveCellAfterViewChecked`)
 *
 * Confirmed LIVE (`start-view-year`/`start-view-multi-year`'s drill-down steps, `keyboard-nav`'s
 * arrow-key steps) that ALL of these upstream behaviors are exercised, despite an earlier pass of
 * this file assuming the view-switch one wasn't: opening the popup, every `currentView` change
 * (drill-down/period-button click), and every `activeDate`-only change (arrow-key nav) all move
 * real DOM focus onto the (new) active cell — without the arrow-key-nav case specifically, a
 * second arrow-key press lands on nothing/`document.body` instead of the `<tbody>`'s own keydown
 * handler, since nothing else moves real focus to follow the roving `tabIndex`.
 *
 * The ACTUAL `.focus()` call is a plain one — `origin` is threaded explicitly from wherever the
 * change originated (`onActiveDateChange$`'s own `origin` param — see `mat-month-view.tsx`'s
 * identical doc comment — for an `activeDate`-only change; hardcoded `'mouse'` for every OTHER
 * handler below AND for the initial `autoFocusActiveCell` mount, since a toggle click/drill-down/
 * period/prev/next click is the only way any of them fire in this port's contract) and stored on
 * `focusOrigin`, which `CalendarContent` renders its `cdk-*-focused` classes from DIRECTLY — NOT
 * via its own `useFocusOrigin()` call, and NOT via `focusVia()` either. This was a deliberate,
 * confirmed-necessary departure from this project's usual `useFocusOrigin()`/`focusVia()`
 * pattern: a plain per-element `useFocusOrigin()` (tried first) raced itself on `keyboard-nav`'s
 * very first `ArrowRight` — the native `focusout` (outgoing cell) and `focusin` (incoming cell)
 * events fire in the correct order, confirmed via a raw capturing-listener trace, but `focusin`'s
 * QRL chunk was already warm (used once at open) while `focusout`'s was genuinely cold (never
 * fired before), so `focusout`'s handler finished LATER despite firing FIRST — permanently
 * clobbering `focusin`'s correct classification with `null`. `useFocusOrigin()`'s own doc comment
 * already flags this exact limitation ("callers with more than one focusable descendant... should
 * reconsider") — true here (dozens of cells), so this component drives the classification
 * explicitly instead, with no event-driven detection (or race) involved at all. `focusVia()`
 * itself was tried too (to force the origin while still going through the normal mechanism) and
 * rejected for a DIFFERENT reason: with no `focusin` listener left on this subtree to ever read
 * (and clear) its pending-origin DOM attribute, the attribute leaks onto the cell permanently —
 * confirmed live as a real structural diff (`data-cdk-pending-focus-origin="mouse"` on the
 * Angular side's non-existent counterpart). A plain `.focus()` plus the explicit `focusOrigin`
 * signal write needs no such attribute at all.
 *
 * Every handler below writes `pendingFocusOrigin.value = <origin>` directly (NOT via a shared
 * local helper function — see that signal's own doc comment just above its declaration for why),
 * consumed by a separate `useVisibleTask$` that ALSO tracks `activeDate`/`currentView` (see that
 * task's own doc comment). Querying `.mat-calendar-body-active` and calling `.focus()` INLINE,
 * right inside the handler that just wrote `activeDate`/`currentView`, was tried first and found
 * live to be unreliable even behind a `requestAnimationFrame`+`setTimeout(0)` defer (mirroring
 * upstream's own `afterNextRender()`+`setTimeout()` in `_focusActiveCell()`):
 * `start-view-multi-year`'s multi-year→year drill-down sometimes still queried the OLD view's
 * (about to be removed) active cell, confirmed via a live trace — however long the defer, there
 * is no fixed duration guaranteed to land after Qwik's own render for that SPECIFIC write has
 * committed. A `useVisibleTask$` tracking the SAME signals the handler just wrote is Qwik's own
 * correct mechanism for "run once whatever just changed has actually rendered" — no timing
 * guess, no race.
 */
import {
  $,
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {useDateLocale} from '../core/datetime/use-date-adapter';
import {MatCalendarHeader} from './mat-calendar-header';
import {MatMonthView} from './mat-month-view';
import {MatYearView} from './mat-year-view';
import {MatMultiYearView} from './mat-multi-year-view';
import {
  periodDelta,
  type CalendarView,
  type MatCalendarCellClassFunction,
  type SelectionValue,
} from './calendar-math';

/** This component's own focus-move origins — a NARROWER type than qwik-cdk's own `FocusOrigin`
 *  (`'mouse' | 'touch' | 'keyboard' | 'program' | null`): every focus move this component itself
 *  drives (see this file's own doc comment) is always either a click or a key press. */
type CalendarFocusOrigin = 'mouse' | 'keyboard' | null;

export interface MatCalendarProps<D = unknown> {
  id?: string;
  class?: string | ReadonlyArray<string>;
  startAt?: D | null;
  startView?: CalendarView;
  selected?: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  /** Mirrors `[dateClass]` — see `mat-month-view.tsx`'s identical prop doc comment. Forwarded
   *  as-is to whichever of month/year/multi-year view is current. */
  dateClass?: QRL<MatCalendarCellClassFunction<D>>;
  /** Overrides the `MAT_DATE_LOCALE` context — needed because this calendar, when opened from
   *  a popup (`<MatDatepicker>`/`<MatDateRangePicker>`), is rendered inside an OVERLAY whose
   *  Qwik component tree is NOT a descendant of wherever the owning `<input matDatepicker>`'s
   *  own `useMatDateAdapterProvider()` call sits (confirmed live: `MatCalendar`'s own
   *  `useDateLocale()` context read, with no override, resolved the WRONG — app-root-level or
   *  default — locale for a popup opened from a per-subtree provider call). `datepicker-runtime.ts` passes
   *  `picker._locale.value` here (resolved correctly, at `useMatDatepicker()`'s own hook-call
   *  site, which — unlike the popup's eventual overlay content — genuinely IS a descendant of
   *  whatever provider wraps the consumer). Omitted/`undefined` for the `inline-calendar`
   *  scenario's bare `<mat-calendar>` (no picker, no popup): THAT usage is a plain descendant
   *  of the app's own provider tree, so this component's own `useDateLocale()` fallback below
   *  is correct for it. See `datepicker/SYNC.md`. */
  locale?: string;
  isRtl?: boolean;
  /** Range-only — supplied by the range runtime; `null`/omitted for a single-date calendar. */
  previewStart?: number | null;
  previewEnd?: number | null;
  startDateAccessibleName?: string | null;
  endDateAccessibleName?: string | null;
  /** Mirrors `MatDatepickerContent.ngAfterViewInit()`'s `this._calendar.focusActiveCell()` —
   *  `true` only when this calendar is rendered inside the popup's content component (see this
   *  file's own doc comment); omitted/`false` for the `inline-calendar` scenario's bare
   *  `<mat-calendar>`, which never auto-focuses on load. */
  autoFocusActiveCell?: boolean;
  /** Mirrors `selectedChange`/`_userSelection` combined — fires on every real selection (a day
   *  click/Enter in month view) AND an Escape-clear mid-range-preview (`null`). NOT fired for a
   *  year/multi-year drill-down click (navigation only, handled internally). */
  onUserSelect$?: QRL<(date: D | null) => void>;
  /** Range-only — mirrors month-view's hover-preview output. */
  onPreviewChange$?: QRL<(date: D | null) => void>;
}

/**
 * `<div class="mat-calendar-content" cdkMonitorSubtreeFocus>`. Renders its `cdk-*-focused`
 * classes directly from `focusOrigin` — a signal `MatCalendar` owns and writes explicitly,
 * never this component's own `useFocusOrigin()` — see this file's own doc comment for why.
 */
const CalendarContent = component$<{focusOrigin: Signal<CalendarFocusOrigin>}>(props => (
  <div
    class={[
      'mat-calendar-content',
      props.focusOrigin.value && 'cdk-focused',
      props.focusOrigin.value && `cdk-${props.focusOrigin.value}-focused`,
    ]}
    {...{cdkmonitorsubtreefocus: ''}}
    tabIndex={-1}
  >
    <Slot />
  </div>
));

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

export const MatCalendar = component$<MatCalendarProps>(props => {
  // `props.locale` (set by `datepicker-runtime.ts` for the popup case — see this prop's own doc
  // comment for why that case can't rely on THIS component's own `useDateLocale()` call) takes
  // priority; otherwise resolved here directly (render-legal; correct for the standalone
  // `inline-calendar` case, a plain descendant of the app's own provider tree) — app-wide or per
  // subtree (`useMatDateAdapterProvider()`'s `locale` key / `MAT_DATE_LOCALE` context), reactive
  // to a runtime locale switch for THAT case (see `datepicker/SYNC.md`). Only LABEL computation
  // (month/weekday/year names, the header's period text) needs this — arithmetic
  // (today()/addCalendarDays/etc.) stays on the hardcoded `DEFAULT_DATE_ADAPTER` singleton
  // below, since locale never affects it.
  const contextLocale = useDateLocale();
  const locale = props.locale ?? contextLocale.value;
  const activeDate = useSignal<unknown>(() => props.startAt ?? adapter.today());
  const currentView = useSignal<CalendarView>(() => props.startView ?? 'month');
  const calendarRef = useSignal<HTMLElement>();
  // See this file's own doc comment — written explicitly by every handler below (a direct
  // `pendingFocusOrigin.value = ...` write, not a shared helper call — see that signal's own
  // doc comment), read directly by `CalendarContent`, never inferred from a `focusin`/`focusout`
  // event.
  const focusOrigin = useSignal<CalendarFocusOrigin>(null);
  // The origin for a focus move THIS component itself just requested, consumed (and reset to
  // `null`) by the reactive task right below — see the doc comment right above that task for why
  // this is a signal, not a direct DOM query/`.focus()` call made inline.
  const pendingFocusOrigin = useSignal<CalendarFocusOrigin>(null);

  /** Mirrors `focusActiveCell()`/`_moveFocusOnNextTick`'s `focusActiveCell()`/
   *  `_focusActiveCellAfterViewChecked()` — see this file's own doc comment. Every handler below
   *  writes `pendingFocusOrigin.value = <origin>` directly (right after it changes
   *  `activeDate`/`currentView`, or once on mount — see the task right below), rather than
   *  calling a shared local helper: a plain (non-`$()`) arrow function defined in THIS component's
   *  scope, referenced from inside MULTIPLE separate `$()` handlers (`onPeriodClick$`,
   *  `onPrevious$`, `onNext$`, `onActiveDateChange$`, the two drill-down handlers, and the mount
   *  task), is exactly the shape Qwik's optimizer cannot always inline — confirmed live as the
   *  cause of `inline-calendar`'s intermittent SSR crash (`QError_verifySerializable`/"Code(3)",
   *  thrown from `beforeClose` while serializing a QRL's captured scope, with the unserializable
   *  value logging as a bare `[Function]`): the optimizer captured the shared helper itself as a
   *  runtime closure value instead of inlining its one-line body into each chunk, and a plain
   *  function cannot be serialized into the resumability state. Module-level consts (`adapter`)
   *  and signals are fine to share across `$()` boundaries this way — only a component-local
   *  PLAIN FUNCTION shared across more than one `$()` call site hits this.
   *
   *  The write itself does NOT query the DOM or call `.focus()` — it only sets
   *  `pendingFocusOrigin`, which the reactive task below (which also tracks
   *  `activeDate`/`currentView`) picks up once Qwik's OWN render for THIS SAME batch of signal
   *  writes has actually landed. Querying inline, right at the write site, was tried first and
   *  found live to be genuinely too early: even deferring the query via
   *  `requestAnimationFrame`+`setTimeout(0)` (mirroring upstream's own `afterNextRender()`+
   *  `setTimeout()` in `_focusActiveCell()`) still sometimes found the OLD active cell on a
   *  drill-down (`start-view-multi-year`'s multi-year→year step) — confirmed via a live trace,
   *  the deferred callback's query landed BEFORE the new view's own render had committed, not
   *  reliably after it, however long the defer. A `useVisibleTask$` that `track()`s the SAME
   *  signals this handler just wrote is Qwik's own, correct way to say "run once whatever just
   *  changed has actually rendered" — no timing guess required. */

  useVisibleTask$(({track}) => {
    track(() => activeDate.value);
    track(() => currentView.value);
    const origin = track(() => pendingFocusOrigin.value);
    if (!origin) return;
    focusOrigin.value = origin;
    pendingFocusOrigin.value = null;
    calendarRef.value?.querySelector<HTMLElement>('.mat-calendar-body-active')?.focus();
  });

  // Initial open-focus (mirrors `ngAfterViewInit`) — a ONE-TIME mount action: just seeds
  // `pendingFocusOrigin`, which the reactive task above picks up on its own first run (every
  // `useVisibleTask$` on a component always runs once regardless of whether anything it
  // `track()`s has "changed" yet). Only when the caller asked for it (see
  // `autoFocusActiveCell`'s own doc comment) — the `inline-calendar` scenario never does.
  useVisibleTask$(() => {
    if (props.autoFocusActiveCell) pendingFocusOrigin.value = 'mouse';
  });

  const minDate = props.minDate ?? null;
  const maxDate = props.maxDate ?? null;

  // Every one of these (period button / prev / next / drill-down) is reachable ONLY by a mouse
  // click in this port's contract — see this file's own doc comment.
  const onPeriodClick$ = $(() => {
    currentView.value = currentView.value === 'month' ? 'multi-year' : 'month';
    pendingFocusOrigin.value = 'mouse';
  });
  const onPrevious$ = $(() => {
    activeDate.value = periodDelta(adapter, currentView.value, activeDate.value, -1);
    pendingFocusOrigin.value = 'mouse';
  });
  const onNext$ = $(() => {
    activeDate.value = periodDelta(adapter, currentView.value, activeDate.value, 1);
    pendingFocusOrigin.value = 'mouse';
  });
  // Guarded write (not an unconditional assignment): the eventual `.focus()` call this triggers
  // on the active cell fires a REAL focus event, which bubbles to `MatCalendarBody`'s
  // per-cell `onFocus$` and lands right back here with a FRESH `Date` object representing the
  // SAME day, tagged `'mouse'` (see `mat-month-view.tsx`'s doc comment) regardless of what
  // ACTUALLY triggered the real navigation — an unconditional write/refocus would both loop
  // forever AND clobber a `'keyboard'`-origin arrow-key move with this bogus `'mouse'` echo.
  // Comparing by VALUE (not reference) breaks both problems at once, while still accepting a
  // genuinely different day (a real click OR a real arrow-key delta).
  const onActiveDateChange$ = $((date: unknown, origin: 'mouse' | 'keyboard') => {
    if (!adapter.sameDate(date, activeDate.value)) {
      activeDate.value = date;
      pendingFocusOrigin.value = origin;
    }
  });
  const onMonthSelectedInYearView$ = $((date: unknown) => {
    activeDate.value = date;
    currentView.value = 'month';
    pendingFocusOrigin.value = 'mouse';
  });
  const onYearSelectedInMultiYearView$ = $((date: unknown) => {
    activeDate.value = date;
    currentView.value = 'year';
    pendingFocusOrigin.value = 'mouse';
  });
  const onUserSelect$ = $((date: unknown) => {
    props.onUserSelect$?.(date as never);
  });

  return (
    <mat-calendar
      ref={calendarRef}
      id={props.id}
      class={
        [
          'mat-calendar',
          ...(props.class ? (Array.isArray(props.class) ? props.class : [props.class]) : []),
        ] as string[]
      }
    >
      <MatCalendarHeader
        currentView={currentView.value}
        activeDate={activeDate.value}
        minDate={minDate}
        maxDate={maxDate}
        locale={locale}
        onPeriodClick$={onPeriodClick$}
        onPrevious$={onPrevious$}
        onNext$={onNext$}
      />
      <CalendarContent focusOrigin={focusOrigin}>
        {currentView.value === 'month' && (
          <MatMonthView
            activeDate={activeDate.value}
            selected={props.selected ?? null}
            minDate={minDate}
            maxDate={maxDate}
            dateFilter={props.dateFilter}
            dateClass={props.dateClass}
            locale={locale}
            previewStart={props.previewStart ?? null}
            previewEnd={props.previewEnd ?? null}
            startDateAccessibleName={props.startDateAccessibleName}
            endDateAccessibleName={props.endDateAccessibleName}
            isRtl={props.isRtl}
            onActiveDateChange$={onActiveDateChange$}
            onUserSelect$={onUserSelect$}
            onPreviewChange$={props.onPreviewChange$}
          />
        )}
        {currentView.value === 'year' && (
          <MatYearView
            activeDate={activeDate.value}
            selected={props.selected ?? null}
            minDate={minDate}
            maxDate={maxDate}
            dateFilter={props.dateFilter}
            dateClass={props.dateClass}
            locale={locale}
            isRtl={props.isRtl}
            onActiveDateChange$={onActiveDateChange$}
            onMonthSelected$={onMonthSelectedInYearView$}
          />
        )}
        {currentView.value === 'multi-year' && (
          <MatMultiYearView
            activeDate={activeDate.value}
            selected={props.selected ?? null}
            minDate={minDate}
            maxDate={maxDate}
            dateFilter={props.dateFilter}
            dateClass={props.dateClass}
            locale={locale}
            isRtl={props.isRtl}
            onActiveDateChange$={onActiveDateChange$}
            onYearSelected$={onYearSelectedInMultiYearView$}
          />
        )}
      </CalendarContent>
    </mat-calendar>
  );
});
