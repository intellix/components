/**
 * Pure range-selection logic — ported from upstream `date-selection-model.ts`'s
 * `MatRangeDateSelectionModel.add()` and `date-range-selection-strategy.ts`'s
 * `DefaultMatCalendarRangeStrategy.selectionFinished()`/`createPreview()`. Framework-free; see
 * `calendar-math.ts`'s own doc comment for why.
 *
 * `DateRange<D>` is a plain object here (`{start, end}`), not upstream's class — no scenario in
 * this port needs the nominal-typing guard upstream's `_disableStructuralEquivalency` field adds.
 */
import type {DateAdapter} from '../core/datetime/date-adapter';

export interface DateRange<D> {
  start: D | null;
  end: D | null;
}

export function isRangeComplete<D>(range: DateRange<D>): boolean {
  return range.start != null && range.end != null;
}

/**
 * Mirrors `MatRangeDateSelectionModel.add(date)` — the model-level fill-order state machine
 * (used when no `MAT_DATE_RANGE_SELECTION_STRATEGY`-equivalent is in play, i.e. never in this
 * port, which always goes through {@link rangeSelectionFinished} like upstream's month-view
 * does — kept here anyway for completeness/fidelity, mirroring upstream's two near-identical
 * mechanisms).
 */
export function rangeModelAdd<D>(range: DateRange<D>, date: D | null): DateRange<D> {
  let {start, end} = range;
  if (start == null) {
    start = date;
  } else if (end == null) {
    end = date;
  } else {
    start = date;
    end = null;
  }
  return {start, end};
}

/**
 * Mirrors `DefaultMatCalendarRangeStrategy.selectionFinished(date, currentRange)` — what a real
 * CLICK (not hover) does. See that method's own doc comment (reproduced from upstream):
 * completing the range requires the second click's date to be >= the first (no auto-swap);
 * clicking an earlier date instead restarts the range at that earlier date.
 */
export function rangeSelectionFinished<D>(
  adapter: DateAdapter<D>,
  date: D,
  currentRange: DateRange<D>,
): DateRange<D> {
  let {start, end} = currentRange;
  if (start == null) {
    start = date;
  } else if (end == null && date && adapter.compareDate(date, start) >= 0) {
    end = date;
  } else {
    start = date;
    end = null;
  }
  return {start, end};
}

/**
 * Mirrors `DefaultMatCalendarRangeStrategy.createPreview(activeDate, currentRange)` — only
 * non-empty while a start is pending (no end yet) and something is hovered/focused; does NOT
 * reorder if the hovered date is before the pending start (see upstream doc comment: the
 * resulting "backward" range then simply fails every `isInRange`-style check, i.e. renders no
 * highlight at all — not a swapped highlight).
 */
export function rangeCreatePreview<D>(
  activeDate: D | null,
  currentRange: DateRange<D>,
): DateRange<D> {
  if (currentRange.start && !currentRange.end && activeDate) {
    return {start: currentRange.start, end: activeDate};
  }
  return {start: null, end: null};
}
