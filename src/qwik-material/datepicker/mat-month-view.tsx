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
import {$, component$, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER, NativeDateAdapter} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {MatCalendarBody} from './mat-calendar-body';
import {
  buildMonthView,
  monthActiveDateDelta,
  toStartEndCompareValues,
  type CalendarCell,
  type MatCalendarCellClassFunction,
  type MonthViewData,
  type SelectionValue,
} from './calendar-math';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;
const formats = MAT_NATIVE_DATE_FORMATS;

/** LABEL text only (weekday/date names) — see `mat-calendar.tsx`'s own `locale` doc comment for
 *  why a fresh, hardcoded `NativeDateAdapter` construction is always resume-safe here. Falls
 *  back to the plain module `adapter` on the (overwhelmingly common) default-locale path. */
function resolveLabelAdapter(locale: string | undefined): DateAdapter<unknown> {
  return locale && locale !== adapter.locale
    ? (new NativeDateAdapter(locale) as unknown as DateAdapter<unknown>)
    : adapter;
}

export interface MatMonthViewProps<D = unknown> {
  activeDate: D;
  selected: SelectionValue<D>;
  minDate?: D | null;
  maxDate?: D | null;
  dateFilter?: QRL<(date: D) => boolean>;
  /** Mirrors `[dateClass]` — a QRL (see `dateFilter`'s own doc comment for why), resolved the
   *  same way, in the same `useTask$` below. */
  dateClass?: QRL<MatCalendarCellClassFunction<D>>;
  /** See `mat-calendar.tsx`'s own `locale` doc comment — only locale-sensitive LABEL text
   *  (weekday/month names, date a11y labels) is affected; the grid's day-of-month arithmetic is
   *  identical regardless of locale. */
  locale?: string;
  previewStart?: number | null;
  previewEnd?: number | null;
  startDateAccessibleName?: string | null;
  endDateAccessibleName?: string | null;
  isRtl?: boolean;
  /** Mirrors `activeDateChange` — fires whenever keyboard nav/focus moves the active cell. The
   *  `origin` tells `MatCalendar`'s own re-focus task (see that file's doc comment) which
   *  `focusVia()` origin to force: `'keyboard'` for an arrow-key delta, `'mouse'` for a cell
   *  natively gaining focus via a real click's `mousedown` (the only other way this fires —
   *  confirmed live, needed so a plain SELECTION click on a not-yet-active cell, e.g.
   *  `range-basic`'s first click, doesn't get mis-classified `'keyboard'` by this port's own
   *  re-focus task). */
  onActiveDateChange$: QRL<(date: D, origin: 'mouse' | 'keyboard') => void>;
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
    buildMonthView(resolveLabelAdapter(props.locale), formats, props.activeDate, minDate, maxDate, undefined),
  );
  // Synchronous (no `await`) whenever there's no filter to resolve — the overwhelmingly common
  // case (no scenario outside `min-max-filter` passes one) — rather than unconditionally async,
  // to minimize the window where this task's own re-run could overlap with another synchronous
  // re-render triggered by a near-simultaneous event (e.g. a click firing both `focus` and
  // `click` handlers, each writing a different signal).
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
      view.value = buildMonthView(localeAdapter, formats, props.activeDate, minDate, maxDate, undefined);
      return;
    }
    return Promise.all([
      filterQrl ? filterQrl.resolve() : Promise.resolve(undefined),
      classQrl ? classQrl.resolve() : Promise.resolve(undefined),
    ]).then(([filterFn, classFn]) => {
      view.value = buildMonthView(
        localeAdapter,
        formats,
        props.activeDate,
        minDate,
        maxDate,
        filterFn,
        classFn,
      );
    });
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
      props.onActiveDateChange$(delta, 'keyboard');
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

  // The only other way a cell's `onFocus$` fires (besides this port's OWN explicit
  // `focusVia()` re-focus calls, which this component's `onActiveDateChange$` guard — see
  // `mat-calendar.tsx` — no-ops as a redundant same-date write) is a REAL click's native
  // `mousedown`-triggered focus — always `'mouse'`.
  const onCellFocus$ = $((cell: CalendarCell<unknown>) => {
    props.onActiveDateChange$(cell.rawValue as never, 'mouse');
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
