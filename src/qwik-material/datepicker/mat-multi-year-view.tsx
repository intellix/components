/**
 * `<mat-multi-year-view>` — ported from upstream `multi-year-view.ts`/`.html` (the 24-year
 * window grid). See `mat-month-view.tsx`'s doc comment for the shared `useTask$`-based grid
 * computation / plain-singleton-adapter rationale, and `calendar-math.ts` for the window-
 * anchoring math (the `start-view-multi-year` scenario's 1968-1991 window for `startAt=1990`
 * lives there, unit-tested).
 */
import {$, component$, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER, NativeDateAdapter} from '../core/datetime/native-date-adapter';
import {MatCalendarBody} from './mat-calendar-body';
import {
  buildMultiYearView,
  dateFromYear,
  multiYearActiveDateDelta,
  toStartEndCompareValues,
  type CalendarCell,
  type MatCalendarCellClassFunction,
  type MultiYearViewData,
  type SelectionValue,
} from './calendar-math';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

/** See `mat-month-view.tsx`'s identical helper doc comment. */
function resolveLabelAdapter(locale: string | undefined): DateAdapter<unknown> {
  return locale && locale !== adapter.locale
    ? (new NativeDateAdapter(locale) as unknown as DateAdapter<unknown>)
    : adapter;
}

export interface MatMultiYearViewProps<D = unknown> {
  activeDate: D;
  selected: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  /** See `mat-month-view.tsx`'s identical `dateClass` doc comment. */
  dateClass?: QRL<MatCalendarCellClassFunction<D>>;
  /** See `mat-calendar.tsx`'s own `locale` doc comment. */
  locale?: string;
  isRtl?: boolean;
  /** See `mat-month-view.tsx`'s identical prop doc comment for the `origin` param. */
  onActiveDateChange$: QRL<(date: D, origin: 'mouse' | 'keyboard') => void>;
  /** Mirrors `yearSelected` — "the user drilled into this year", NOT a value commit. */
  onYearSelected$: QRL<(date: D) => void>;
}

export const MatMultiYearView = component$<MatMultiYearViewProps>(props => {
  const armed = useSignal(false);
  const minDate = (props.minDate ?? null) as unknown;
  const maxDate = (props.maxDate ?? null) as unknown;

  const view = useSignal<MultiYearViewData<unknown>>(() =>
    buildMultiYearView(resolveLabelAdapter(props.locale), props.activeDate, minDate, maxDate, undefined),
  );
  // See mat-month-view.tsx's identical doc comment for why this stays synchronous whenever
  // there's no filter to resolve.
  useTask$(({track}) => {
    track(() => props.activeDate);
    track(() => props.minDate);
    track(() => props.maxDate);
    const localeAdapter = resolveLabelAdapter(track(() => props.locale));
    const filterQrl = props.dateFilter as QRL<(date: unknown) => boolean> | undefined;
    const classQrl = props.dateClass as
      | QRL<MatCalendarCellClassFunction<unknown>>
      | undefined;
    if (!filterQrl && !classQrl) {
      view.value = buildMultiYearView(localeAdapter, props.activeDate, minDate, maxDate, undefined);
      return;
    }
    return Promise.all([
      filterQrl ? filterQrl.resolve() : Promise.resolve(undefined),
      classQrl ? classQrl.resolve() : Promise.resolve(undefined),
    ]).then(([filterFn, classFn]) => {
      view.value = buildMultiYearView(localeAdapter, props.activeDate, minDate, maxDate, filterFn, classFn);
    });
  });

  const {startValue, endValue} = toStartEndCompareValues(adapter, props.selected);

  const selectYear = (year: number) => {
    props.onYearSelected$(dateFromYear(adapter, props.activeDate, year));
  };

  const onKeyDown$ = $((event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      armed.value = true;
      event.preventDefault();
      return;
    }
    const delta = multiYearActiveDateDelta(
      adapter,
      props.activeDate,
      minDate,
      maxDate,
      key,
      event.altKey,
      props.isRtl ?? false,
    );
    if (delta != null) {
      props.onActiveDateChange$(delta, 'keyboard');
      event.preventDefault();
    }
  });

  const onKeyUp$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (armed.value) selectYear(adapter.getYear(props.activeDate));
      armed.value = false;
    }
  });

  const onCellClick$ = $((cell: CalendarCell<unknown>) => {
    selectYear(cell.value);
  });

  const onCellFocus$ = $((cell: CalendarCell<unknown>) => {
    props.onActiveDateChange$(cell.rawValue as never, 'mouse');
  });

  return (
    <mat-multi-year-view>
      <table class="mat-calendar-table" role="grid">
        <thead aria-hidden="true" class="mat-calendar-table-header">
          <tr>
            <th class="mat-calendar-table-header-divider" colSpan={4} />
          </tr>
        </thead>
        <MatCalendarBody
          label=""
          rows={view.value.years}
          todayValue={view.value.todayYear}
          startValue={startValue}
          endValue={endValue}
          previewStart={null}
          previewEnd={null}
          isRange={false}
          numCols={4}
          cellAspectRatio={4 / 7}
          activeCell={view.value.activeCell}
          onCellClick$={onCellClick$}
          onCellFocus$={onCellFocus$}
          onKeyDown$={onKeyDown$}
          onKeyUp$={onKeyUp$}
        />
      </table>
    </mat-multi-year-view>
  );
});
