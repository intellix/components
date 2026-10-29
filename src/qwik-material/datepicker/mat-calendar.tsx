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
 * Scope cut vs. upstream (SYNC.md): no re-focus-into-the-new-active-cell on a view-switch
 * (`MatCalendar._moveFocusOnNextTick`/`ngAfterViewChecked`) — not exercised by any scenario in
 * this port's contract (every drill-down scenario proceeds by mouse click, and no scenario
 * inspects focus immediately after a drill-down).
 */
import {$, component$, useSignal, type QRL} from '@builder.io/qwik';
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

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

export const MatCalendar = component$<MatCalendarProps>(props => {
  const activeDate = useSignal<unknown>(() => props.startAt ?? adapter.today());
  const currentView = useSignal<CalendarView>(() => props.startView ?? 'month');

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
      <div class="mat-calendar-content" {...{cdkmonitorsubtreefocus: ''}} tabIndex={-1}>
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
      </div>
    </mat-calendar>
  );
});
