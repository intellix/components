/**
 * `<mat-month-view>` — ported from upstream `month-view.ts`/`.html`. Unlike upstream's
 * imperative, signal-cached grid (`_init()` only re-running when month+year change), this port
 * just recomputes the grid fresh whenever its inputs change via `calendar-math.ts`'s pure
 * `buildMonthView()` — Qwik's own render model already skips unnecessary work. `activeDate` is a
 * prop (owned by `MatCalendar`), not local state.
 *
 * Uses the plain `DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` module singletons directly
 * (never `useDateAdapter()`/`useDateFormats()`'s context hooks) — same reasoning
 * `qwik-material/timepicker`'s own interactive runtime code already establishes (see
 * `core/datetime/use-date-adapter.ts`'s doc comment): a `DateAdapter` is a plain object of
 * closures, unsafe to capture inside a `$()`/task QRL boundary, and no scenario in this port
 * needs a non-default locale anyway. This port uses the singleton uniformly (render AND
 * interactive code), a simplification over timepicker's own split — documented in SYNC.md.
 *
 * `dateFilter` is a `QRL` (required for cross-resume serialization — see `select/SYNC.md`'s
 * "options" lesson, the same reasoning this port's own SYNC.md documents for
 * `matDatepickerFilter`), but `calendar-math.ts`'s cell-building functions need a plain
 * SYNCHRONOUS predicate to run during render, and `component$`'s `OnRenderFn` cannot return a
 * `Promise` (no async component bodies in this Qwik version). The grid is therefore computed
 * inside a `useTask$` (NOT `useVisibleTask$` — this one runs on the SERVER during SSR too, and
 * Qwik's render pipeline awaits it before finalizing output, so `[min]`/`[max]`/`
 * matDatepickerFilter`'s disabled-cell classes are still correct on the very first SSR paint —
 * design-doc rule 3) into a signal holding plain, serializable DATA (the built grid — numbers/
 * strings/booleans/`Date`s, never a function), sidestepping the "a resolved function stored in a
 * signal needs `noSerialize()` and is `undefined` until a later client task repopulates it"
 * hazard entirely (see `QWIK_CDK`'s `keyboardDispatcher` for where THAT pattern is accepted
 * instead, because its values are truly client-only). The `$()` keydown/keyup handlers call
 * `props.dateFilter` directly instead (a `QRL` is itself callable, resolving+invoking in one
 * step) — handlers have no such sync-render constraint.
 */
import {$, component$, useSignal, useTask$, type QRL} from '@builder.io/qwik';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {MatCalendarBody} from './mat-calendar-body';
import {
  buildMonthView,
  monthActiveDateDelta,
  toStartEndCompareValues,
  type CalendarCell,
  type MonthViewData,
  type SelectionValue,
} from './calendar-math';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;
const formats = MAT_NATIVE_DATE_FORMATS;

export interface MatMonthViewProps<D = unknown> {
  activeDate: D;
  selected: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  previewStart?: number | null;
  previewEnd?: number | null;
  startDateAccessibleName?: string | null;
  endDateAccessibleName?: string | null;
  isRtl?: boolean;
  /** Mirrors `activeDateChange` — fires whenever keyboard nav/focus moves the active cell. */
  onActiveDateChange$: QRL<(date: D) => void>;
  /** Mirrors `_userSelection` — fires on a real click/Enter selection AND on an Escape-clear
   *  mid-range-preview (value `null` in that case). */
  onUserSelect$: QRL<(date: D | null) => void>;
  /** Mirrors calendar-body's `previewChange` -> month-view's `_previewChanged`, only meaningful
   *  when a range is being selected. */
  onPreviewChange$?: QRL<(date: D | null) => void>;
}

export const MatMonthView = component$<MatMonthViewProps>(props => {
  // Persists the keydown-armed flag across the separate keyup QRL invocation — see
  // `calendar-body.ts`'s own `_selectionKeyPressed` field, which this mirrors.
  const armed = useSignal(false);

  const minDate = (props.minDate ?? null) as unknown;
  const maxDate = (props.maxDate ?? null) as unknown;

  const view = useSignal<MonthViewData<unknown>>(() =>
    buildMonthView(adapter, formats, props.activeDate, minDate, maxDate, undefined),
  );
  useTask$(async ({track}) => {
    track(() => props.activeDate);
    track(() => props.minDate);
    track(() => props.maxDate);
    const filterQrl = props.dateFilter as QRL<(date: unknown) => boolean> | undefined;
    const filterFn = filterQrl ? await filterQrl.resolve() : undefined;
    view.value = buildMonthView(adapter, formats, props.activeDate, minDate, maxDate, filterFn);
  });

  const {startValue, endValue, isRange} = toStartEndCompareValues(adapter, props.selected);
  const activeCell = adapter.getDate(props.activeDate) - 1;

  const onKeyDown$ = $(async (event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      armed.value = true;
      if (!props.dateFilter || (await props.dateFilter(props.activeDate))) event.preventDefault();
      return;
    }
    if (key === 'Escape') {
      if (props.previewEnd != null && !hasModifierKey(event)) {
        props.onPreviewChange$?.(null);
        props.onUserSelect$(null);
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    const delta = monthActiveDateDelta(
      adapter,
      props.activeDate,
      key,
      event.altKey,
      props.isRtl ?? false,
    );
    if (delta != null) {
      props.onActiveDateChange$(delta);
      event.preventDefault();
    }
  });

  const onKeyUp$ = $(async (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const canSelect = !props.dateFilter || (await props.dateFilter(props.activeDate));
      if (armed.value && canSelect) {
        props.onUserSelect$(props.activeDate);
      }
      armed.value = false;
    }
  });

  const onCellClick$ = $((cell: CalendarCell<unknown>) => {
    props.onUserSelect$(cell.rawValue);
  });

  const onCellFocus$ = $((cell: CalendarCell<unknown>) => {
    props.onActiveDateChange$(cell.rawValue as never);
  });

  const onCellMouseEnter$ = $((cell: CalendarCell<unknown> | null) => {
    props.onPreviewChange$?.(cell ? (cell.rawValue as never) : null);
  });

  const onGridMouseLeave$ = $(() => {
    props.onPreviewChange$?.(null);
  });

  return (
    <mat-month-view>
      <table class="mat-calendar-table" role="grid">
        <thead class="mat-calendar-table-header">
          <tr>
            {view.value.weekdays.map((day, i) => (
              <th scope="col" key={i}>
                <span class="cdk-visually-hidden">{day.long}</span>
                <span aria-hidden="true">{day.narrow}</span>
              </th>
            ))}
          </tr>
          <tr aria-hidden="true">
            <th class="mat-calendar-table-header-divider" colSpan={7} />
          </tr>
        </thead>
        <MatCalendarBody
          label={view.value.monthLabel}
          rows={view.value.weeks}
          todayValue={view.value.todayValue}
          startValue={startValue}
          endValue={endValue}
          previewStart={props.previewStart ?? null}
          previewEnd={props.previewEnd ?? null}
          isRange={isRange}
          labelMinRequiredCells={3}
          activeCell={activeCell}
          startDateAccessibleName={props.startDateAccessibleName}
          endDateAccessibleName={props.endDateAccessibleName}
          onCellClick$={onCellClick$}
          onCellFocus$={onCellFocus$}
          onCellMouseEnter$={onCellMouseEnter$}
          onGridMouseLeave$={onGridMouseLeave$}
          onKeyDown$={onKeyDown$}
          onKeyUp$={onKeyUp$}
        />
      </table>
    </mat-month-view>
  );
});
