/**
 * `<mat-year-view>` — ported from upstream `year-view.ts`/`.html` (the 12-month grid for one
 * year). No range/comparison/drag support upstream either — see `mat-month-view.tsx`'s doc
 * comment for the shared `useTask$`-based grid computation / plain-singleton-adapter rationale
 * this mirrors.
 */
import {$, component$, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {MatCalendarBody} from './mat-calendar-body';
import {
  buildYearView,
  dateFromMonth,
  toStartEndCompareValues,
  yearActiveDateDelta,
  type CalendarCell,
  type SelectionValue,
  type YearViewData,
} from './calendar-math';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;
const formats = MAT_NATIVE_DATE_FORMATS;

export interface MatYearViewProps<D = unknown> {
  activeDate: D;
  selected: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  isRtl?: boolean;
  /** See `mat-month-view.tsx`'s identical prop doc comment for the `origin` param. */
  onActiveDateChange$: QRL<(date: D, origin: 'mouse' | 'keyboard') => void>;
  /** Mirrors `monthSelected` — "the user drilled into this month", NOT a value commit. */
  onMonthSelected$: QRL<(date: D) => void>;
}

export const MatYearView = component$<MatYearViewProps>(props => {
  const armed = useSignal(false);
  const minDate = (props.minDate ?? null) as unknown;
  const maxDate = (props.maxDate ?? null) as unknown;

  const view = useSignal<YearViewData<unknown>>(() =>
    buildYearView(adapter, formats, props.activeDate, minDate, maxDate, undefined),
  );
  // See mat-month-view.tsx's identical doc comment for why this stays synchronous whenever
  // there's no filter to resolve.
  useTask$(({track}) => {
    track(() => props.activeDate);
    track(() => props.minDate);
    track(() => props.maxDate);
    const filterQrl = props.dateFilter as QRL<(date: unknown) => boolean> | undefined;
    if (!filterQrl) {
      view.value = buildYearView(adapter, formats, props.activeDate, minDate, maxDate, undefined);
      return;
    }
    return filterQrl.resolve().then(filterFn => {
      view.value = buildYearView(adapter, formats, props.activeDate, minDate, maxDate, filterFn);
    });
  });

  const {startValue, endValue} = toStartEndCompareValues(adapter, props.selected);
  const activeCell = adapter.getMonth(props.activeDate);

  const selectMonth = (month: number) => {
    props.onMonthSelected$(dateFromMonth(adapter, props.activeDate, month));
  };

  const onKeyDown$ = $((event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      armed.value = true;
      event.preventDefault();
      return;
    }
    const delta = yearActiveDateDelta(
      adapter,
      props.activeDate,
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
      if (armed.value) selectMonth(adapter.getMonth(props.activeDate));
      armed.value = false;
    }
  });

  const onCellClick$ = $((cell: CalendarCell<unknown>) => {
    selectMonth(cell.value);
  });

  const onCellFocus$ = $((cell: CalendarCell<unknown>) => {
    props.onActiveDateChange$(cell.rawValue as never, 'mouse');
  });

  return (
    <mat-year-view>
      <table class="mat-calendar-table" role="grid">
        <thead aria-hidden="true" class="mat-calendar-table-header">
          <tr>
            <th class="mat-calendar-table-header-divider" colSpan={4} />
          </tr>
        </thead>
        <MatCalendarBody
          label={view.value.yearLabel}
          rows={view.value.months}
          todayValue={view.value.todayMonth}
          startValue={startValue}
          endValue={endValue}
          previewStart={null}
          previewEnd={null}
          isRange={false}
          numCols={4}
          cellAspectRatio={4 / 7}
          labelMinRequiredCells={2}
          activeCell={activeCell}
          onCellClick$={onCellClick$}
          onCellFocus$={onCellFocus$}
          onKeyDown$={onKeyDown$}
          onKeyUp$={onKeyUp$}
        />
      </table>
    </mat-year-view>
  );
});
