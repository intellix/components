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
 * `onUserSelect$` to route through its own pending-model/auto-close logic — see
 * `datepicker-runtime.ts`).
 *
 * Drill-down wiring (year-view's `monthSelected` -> `_goToDateInView(date,'month')`,
 * multi-year's `yearSelected` -> `_goToDateInView(date,'year')`) is handled ENTIRELY internally,
 * exactly mirroring `calendar.html`'s own wiring — never forwarded to the consumer, since
 * drilling down is navigation, not a value commit.
 *
 * ## Re-focus on a view switch (`_moveFocusOnNextTick`/`ngAfterViewChecked`)
 *
 * Confirmed LIVE (`start-view-year`/`start-view-multi-year`'s own drill-down steps) that this
 * upstream behavior IS exercised, despite an earlier pass of this file assuming it wasn't: every
 * `currentView` change (a drill-down click OR the period-button click) moves real DOM focus onto
 * the new view's active cell, mirrored below via a `currentView`-tracking task that skips its own
 * first (mount) run. Forced to origin `'mouse'` via `focusVia` (not a plain `.focus()`) — every
 * drill-down this port's contract exercises is a mouse click, matching
 * `MatDatepickerContent`'s own identical reasoning for its initial-open focus call (see that
 * file's doc comment). A plain `.focus()` was tried first and found, via a real two-drill-down
 * repro (`start-view-multi-year`: multi-year→year succeeded, the VERY NEXT year→month did not),
 * to be genuinely timing-fragile: clicking a cell natively focuses that SAME button on
 * `mousedown` — BEFORE the `click` handler that actually switches `currentView` runs — and since
 * every cell's own `onFocus$` forwards into `onActiveDateChange$` (needed for roving-tabindex/
 * keyboard-nav fidelity), that earlier, same-click focus event already consumes this port's
 * per-element `useFocusOrigin()`'s one-shot recorded pointer modality, leaving nothing fresh for
 * THIS task's later `focus()` call to read on the first drill-down — apparently without visible
 * effect, but deterministically wrong on the second, consecutive one. Forcing the origin
 * sidesteps relying on that fragile natural propagation entirely.
 */
import {$, component$, Slot, useSignal, useVisibleTask$, type QRL} from '@builder.io/qwik';
import {focusVia, useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MatCalendarHeader} from './mat-calendar-header';
import {MatMonthView} from './mat-month-view';
import {MatYearView} from './mat-year-view';
import {MatMultiYearView} from './mat-multi-year-view';
import {periodDelta, type CalendarView, type SelectionValue} from './calendar-math';

export interface MatCalendarProps<D = unknown> {
  id?: string;
  class?: string | ReadonlyArray<string>;
  startAt?: D | null;
  startView?: CalendarView;
  selected?: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  isRtl?: boolean;
  /** Range-only — supplied by the range runtime; `null`/omitted for a single-date calendar. */
  previewStart?: number | null;
  previewEnd?: number | null;
  startDateAccessibleName?: string | null;
  endDateAccessibleName?: string | null;
  /** Mirrors `selectedChange`/`_userSelection` combined — fires on every real selection (a day
   *  click/Enter in month view) AND an Escape-clear mid-range-preview (`null`). NOT fired for a
   *  year/multi-year drill-down click (navigation only, handled internally). */
  onUserSelect$?: QRL<(date: D | null) => void>;
  /** Range-only — mirrors month-view's hover-preview output. */
  onPreviewChange$?: QRL<(date: D | null) => void>;
}

/**
 * `<div class="mat-calendar-content" cdkMonitorSubtreeFocus>` — its own component so
 * `useFocusOrigin()` attaches to this div (not `<mat-calendar>`, which also holds the header).
 */
const CalendarContent = component$(() => {
  const focusOrigin = useFocusOrigin();
  return (
    <div
      class={[
        'mat-calendar-content',
        focusOrigin.value && 'cdk-focused',
        focusOrigin.value && `cdk-${focusOrigin.value}-focused`,
      ]}
      {...{cdkmonitorsubtreefocus: ''}}
      tabIndex={-1}
    >
      <Slot />
    </div>
  );
});

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

export const MatCalendar = component$<MatCalendarProps>(props => {
  const activeDate = useSignal<unknown>(() => props.startAt ?? adapter.today());
  const currentView = useSignal<CalendarView>(() => props.startView ?? 'month');
  const calendarRef = useSignal<HTMLElement>();
  const hasMounted = useSignal(false);

  // Mirrors `_moveFocusOnNextTick`/`ngAfterViewChecked` — see this file's own doc comment.
  useVisibleTask$(({track}) => {
    track(() => currentView.value);
    if (!hasMounted.value) {
      hasMounted.value = true;
      return;
    }
    const active = calendarRef.value?.querySelector<HTMLElement>('.mat-calendar-body-active');
    if (active) focusVia(active, 'mouse');
  });

  const minDate = props.minDate ?? null;
  const maxDate = props.maxDate ?? null;

  const onPeriodClick$ = $(() => {
    currentView.value = currentView.value === 'month' ? 'multi-year' : 'month';
  });
  const onPrevious$ = $(() => {
    activeDate.value = periodDelta(adapter, currentView.value, activeDate.value, -1);
  });
  const onNext$ = $(() => {
    activeDate.value = periodDelta(adapter, currentView.value, activeDate.value, 1);
  });
  const onActiveDateChange$ = $((date: unknown) => {
    activeDate.value = date;
  });
  const onMonthSelectedInYearView$ = $((date: unknown) => {
    activeDate.value = date;
    currentView.value = 'month';
  });
  const onYearSelectedInMultiYearView$ = $((date: unknown) => {
    activeDate.value = date;
    currentView.value = 'year';
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
        onPeriodClick$={onPeriodClick$}
        onPrevious$={onPrevious$}
        onNext$={onNext$}
      />
      <CalendarContent>
        {currentView.value === 'month' && (
          <MatMonthView
            activeDate={activeDate.value}
            selected={props.selected ?? null}
            minDate={minDate}
            maxDate={maxDate}
            dateFilter={props.dateFilter}
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
            isRtl={props.isRtl}
            onActiveDateChange$={onActiveDateChange$}
            onYearSelected$={onYearSelectedInMultiYearView$}
          />
        )}
      </CalendarContent>
    </mat-calendar>
  );
});
