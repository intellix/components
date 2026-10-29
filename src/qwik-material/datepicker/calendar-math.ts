/**
 * Pure, adapter-driven calendar math — ported from upstream
 * `src/material/datepicker/{calendar-body,month-view,year-view,multi-year-view}.ts`'s own
 * non-Angular-lifecycle logic (grid building, keyboard deltas, cell predicates). Deliberately
 * framework-free (no Qwik imports) so it's trivially unit-testable and reusable by
 * `mat-month-view.tsx`/`mat-year-view.tsx`/`mat-multi-year-view.tsx`/`mat-calendar-body.tsx`.
 *
 * Scope cuts vs. upstream (documented in SYNC.md): no comparison-range cells/bridges, no
 * drag-to-select, no per-date custom CSS classes (`dateClass`) — none of this port's 13
 * scenarios exercise them.
 */
import type {DateAdapter} from '../core/datetime/date-adapter';
import type {MatDateFormats} from '../core/datetime/date-formats';

const DAYS_PER_WEEK = 7;

/** One renderable calendar cell — mirrors upstream `MatCalendarCell`. */
export interface CalendarCell<D> {
  /** Day-of-month (1-31), month index (0-11), or year number — selection-dispatch value. */
  value: number;
  displayValue: string;
  ariaLabel: string;
  enabled: boolean;
  /** Globally-comparable number (epoch ms for day cells; the bare value for month/year cells) —
   *  mirrors upstream `MatCalendarCell.compareValue`. */
  compareValue: number;
  rawValue: D;
}

/** Mirrors `MatMonthView`'s `_getCellCompareValue` — native epoch ms, independent of `D`'s own
 *  adapter, so range comparisons work across months/years. */
export function getCellCompareValue<D>(adapter: DateAdapter<D>, date: D | null): number | null {
  if (date == null) return null;
  const year = adapter.getYear(date);
  const month = adapter.getMonth(date);
  const day = adapter.getDate(date);
  return new Date(year, month, day).getTime();
}

// ============================================================================================
// Cell predicates — mirrors calendar-body.ts's module-level `isStart`/`isEnd`/`isInRange` plus
// its instance wrappers. All operate on `compareValue`s (plain numbers), not dates.
// ============================================================================================

export function isRangeStart(value: number, start: number | null, end: number | null): boolean {
  return end !== null && start !== end && value < end && value === start;
}
export function isRangeEnd(value: number, start: number | null, end: number | null): boolean {
  return start !== null && start !== end && value >= start && value === end;
}
export function isInRange(
  value: number,
  start: number | null,
  end: number | null,
  rangeEnabled: boolean,
): boolean {
  return (
    rangeEnabled &&
    start !== null &&
    end !== null &&
    start !== end &&
    value >= start &&
    value <= end
  );
}
export function isSelected(value: number, start: number | null, end: number | null): boolean {
  return start === value || end === value;
}

/** Mirrors `_isActiveCell(rowIndex, colIndex)`. */
export function isActiveCell(
  rowIndex: number,
  colIndex: number,
  numCols: number,
  firstRowOffset: number,
  activeCell: number,
): boolean {
  let cellNumber = rowIndex * numCols + colIndex;
  if (rowIndex) cellNumber -= firstRowOffset;
  return cellNumber === activeCell;
}

// ============================================================================================
// Month view
// ============================================================================================

export interface MonthViewData<D> {
  monthLabel: string;
  weeks: CalendarCell<D>[][];
  firstWeekOffset: number;
  weekdays: ReadonlyArray<{long: string; narrow: string}>;
  todayValue: number | null;
}

/** Mirrors `MatMonthView._init()` + `_initWeekdays()` + `_createWeekCells()`. */
export function buildMonthView<D>(
  adapter: DateAdapter<D>,
  formats: MatDateFormats,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): MonthViewData<D> {
  const year = adapter.getYear(activeDate);
  const month = adapter.getMonth(activeDate);

  const monthLabel = (
    formats.display.monthLabel
      ? adapter.format(activeDate, formats.display.monthLabel)
      : adapter.getMonthNames('short')[month]
  ).toLocaleUpperCase();

  const firstOfMonth = adapter.createDate(year, month, 1);
  const firstWeekOffset =
    (DAYS_PER_WEEK + adapter.getDayOfWeek(firstOfMonth) - adapter.getFirstDayOfWeek()) %
    DAYS_PER_WEEK;

  const firstDayOfWeek = adapter.getFirstDayOfWeek();
  const narrowNames = adapter.getDayOfWeekNames('narrow');
  const longNames = adapter.getDayOfWeekNames('long');
  const weekdaysAll = longNames.map((long, i) => ({long, narrow: narrowNames[i]}));
  const weekdays = weekdaysAll.slice(firstDayOfWeek).concat(weekdaysAll.slice(0, firstDayOfWeek));

  const daysInMonth = adapter.getNumDaysInMonth(activeDate);
  const dateNames = adapter.getDateNames();
  const weeks: CalendarCell<D>[][] = [[]];
  for (let i = 0, cell = firstWeekOffset; i < daysInMonth; i++, cell++) {
    if (cell === DAYS_PER_WEEK) {
      weeks.push([]);
      cell = 0;
    }
    const date = adapter.createDate(year, month, i + 1);
    const enabled = shouldEnableDate(adapter, date, minDate, maxDate, dateFilter);
    const ariaLabel = adapter.format(date, formats.display.dateA11yLabel);
    weeks[weeks.length - 1].push({
      value: i + 1,
      displayValue: dateNames[i],
      ariaLabel,
      enabled,
      compareValue: getCellCompareValue(adapter, date)!,
      rawValue: date,
    });
  }

  const today = adapter.today();
  const todayValue = getCellCompareValue(adapter, today);

  return {monthLabel, weeks, firstWeekOffset, weekdays, todayValue};
}

export function shouldEnableDate<D>(
  adapter: DateAdapter<D>,
  date: D,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): boolean {
  return (
    !!date &&
    (!minDate || adapter.compareDate(date, minDate) >= 0) &&
    (!maxDate || adapter.compareDate(date, maxDate) <= 0) &&
    (!dateFilter || dateFilter(date))
  );
}

/** Mirrors `MatMonthView._handleCalendarBodyKeydown`'s switch (the delta-producing half —
 *  excludes ENTER/SPACE/ESCAPE, which are selection, not navigation). Returns `null` for an
 *  unhandled key. */
export function monthActiveDateDelta<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  key: string,
  altKey: boolean,
  isRtl: boolean,
): D | null {
  switch (key) {
    case 'ArrowLeft':
      return adapter.addCalendarDays(activeDate, isRtl ? 1 : -1);
    case 'ArrowRight':
      return adapter.addCalendarDays(activeDate, isRtl ? -1 : 1);
    case 'ArrowUp':
      return adapter.addCalendarDays(activeDate, -7);
    case 'ArrowDown':
      return adapter.addCalendarDays(activeDate, 7);
    case 'Home':
      return adapter.addCalendarDays(activeDate, 1 - adapter.getDate(activeDate));
    case 'End':
      return adapter.addCalendarDays(
        activeDate,
        adapter.getNumDaysInMonth(activeDate) - adapter.getDate(activeDate),
      );
    case 'PageUp':
      return altKey
        ? adapter.addCalendarYears(activeDate, -1)
        : adapter.addCalendarMonths(activeDate, -1);
    case 'PageDown':
      return altKey
        ? adapter.addCalendarYears(activeDate, 1)
        : adapter.addCalendarMonths(activeDate, 1);
    default:
      return null;
  }
}

// ============================================================================================
// Year view (12-month grid for one year)
// ============================================================================================

export interface YearViewData<D> {
  yearLabel: string;
  months: CalendarCell<D>[][];
  todayMonth: number | null;
}

const YEAR_VIEW_ROWS: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
];

/** Mirrors `MatYearView._init()`. */
export function buildYearView<D>(
  adapter: DateAdapter<D>,
  formats: MatDateFormats,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): YearViewData<D> {
  const year = adapter.getYear(activeDate);
  const yearLabel = adapter.getYearName(activeDate);
  const monthNames = adapter.getMonthNames('short');

  const months = YEAR_VIEW_ROWS.map(row =>
    row.map(month => {
      const date = adapter.createDate(year, month, 1);
      const ariaLabel = adapter.format(date, formats.display.monthYearA11yLabel);
      const enabled = shouldEnableMonth(adapter, year, month, minDate, maxDate, dateFilter);
      return {
        value: month,
        displayValue: monthNames[month].toLocaleUpperCase(),
        ariaLabel,
        enabled,
        compareValue: month,
        rawValue: date,
      };
    }),
  );

  const today = adapter.today();
  const todayYear = adapter.getYear(today);
  const todayMonth = todayYear === year ? adapter.getMonth(today) : null;

  return {yearLabel, months, todayMonth};
}

function isYearMonthAfterMax<D>(
  adapter: DateAdapter<D>,
  year: number,
  month: number,
  maxDate: D | null,
): boolean {
  if (!maxDate) return false;
  const maxYear = adapter.getYear(maxDate);
  const maxMonth = adapter.getMonth(maxDate);
  return year > maxYear || (year === maxYear && month > maxMonth);
}
function isYearMonthBeforeMin<D>(
  adapter: DateAdapter<D>,
  year: number,
  month: number,
  minDate: D | null,
): boolean {
  if (!minDate) return false;
  const minYear = adapter.getYear(minDate);
  const minMonth = adapter.getMonth(minDate);
  return year < minYear || (year === minYear && month < minMonth);
}

export function shouldEnableMonth<D>(
  adapter: DateAdapter<D>,
  year: number,
  month: number,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): boolean {
  if (
    isYearMonthAfterMax(adapter, year, month, maxDate) ||
    isYearMonthBeforeMin(adapter, year, month, minDate)
  ) {
    return false;
  }
  if (!dateFilter) return true;
  let date = adapter.createDate(year, month, 1);
  while (adapter.getMonth(date) === month) {
    if (dateFilter(date)) return true;
    date = adapter.addCalendarDays(date, 1);
  }
  return false;
}

/** Mirrors `MatYearView._handleCalendarBodyKeydown`'s delta half. */
export function yearActiveDateDelta<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  key: string,
  altKey: boolean,
  isRtl: boolean,
): D | null {
  switch (key) {
    case 'ArrowLeft':
      return adapter.addCalendarMonths(activeDate, isRtl ? 1 : -1);
    case 'ArrowRight':
      return adapter.addCalendarMonths(activeDate, isRtl ? -1 : 1);
    case 'ArrowUp':
      return adapter.addCalendarMonths(activeDate, -4);
    case 'ArrowDown':
      return adapter.addCalendarMonths(activeDate, 4);
    case 'Home':
      return adapter.addCalendarMonths(activeDate, -adapter.getMonth(activeDate));
    case 'End':
      return adapter.addCalendarMonths(activeDate, 11 - adapter.getMonth(activeDate));
    case 'PageUp':
      return adapter.addCalendarYears(activeDate, altKey ? -10 : -1);
    case 'PageDown':
      return adapter.addCalendarYears(activeDate, altKey ? 10 : 1);
    default:
      return null;
  }
}

/** Mirrors `MatYearView._getDateFromMonth` — clamps the day-of-month to fit the target month. */
export function dateFromMonth<D>(adapter: DateAdapter<D>, activeDate: D, month: number): D {
  const year = adapter.getYear(activeDate);
  const normalized = adapter.createDate(year, month, 1);
  const daysInMonth = adapter.getNumDaysInMonth(normalized);
  return adapter.createDate(year, month, Math.min(adapter.getDate(activeDate), daysInMonth));
}

// ============================================================================================
// Multi-year view (24-year window)
// ============================================================================================

export const YEARS_PER_PAGE = 24;
export const YEARS_PER_ROW = 4;

function euclideanModulo(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/** Mirrors `getStartingYear` — the page-anchor year. */
export function getStartingYear<D>(
  adapter: DateAdapter<D>,
  minDate: D | null,
  maxDate: D | null,
): number {
  if (maxDate) return adapter.getYear(maxDate) - YEARS_PER_PAGE + 1;
  if (minDate) return adapter.getYear(minDate);
  return 0;
}

/** Mirrors `getActiveOffset` — 0-23 position of `activeDate`'s year within its 24-year page. */
export function getActiveYearOffset<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
): number {
  const activeYear = adapter.getYear(activeDate);
  return euclideanModulo(activeYear - getStartingYear(adapter, minDate, maxDate), YEARS_PER_PAGE);
}

/** Mirrors `isSameMultiYearView`. */
export function isSameMultiYearPage<D>(
  adapter: DateAdapter<D>,
  date1: D,
  date2: D,
  minDate: D | null,
  maxDate: D | null,
): boolean {
  const year1 = adapter.getYear(date1);
  const year2 = adapter.getYear(date2);
  const startingYear = getStartingYear(adapter, minDate, maxDate);
  return (
    Math.floor((year1 - startingYear) / YEARS_PER_PAGE) ===
    Math.floor((year2 - startingYear) / YEARS_PER_PAGE)
  );
}

export interface MultiYearViewData<D> {
  years: CalendarCell<D>[][];
  todayYear: number;
  activeCell: number;
}

/** Mirrors `MatMultiYearView._init()`. */
export function buildMultiYearView<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): MultiYearViewData<D> {
  const activeYear = adapter.getYear(activeDate);
  const offset = getActiveYearOffset(adapter, activeDate, minDate, maxDate);
  const minYearOfPage = activeYear - offset;

  const years: CalendarCell<D>[][] = [];
  let row: number[] = [];
  for (let i = 0; i < YEARS_PER_PAGE; i++) {
    row.push(minYearOfPage + i);
    if (row.length === YEARS_PER_ROW) {
      years.push(row.map(year => createCellForYear(adapter, year, minDate, maxDate, dateFilter)));
      row = [];
    }
  }

  const todayYear = adapter.getYear(adapter.today());

  return {years, todayYear, activeCell: offset};
}

function createCellForYear<D>(
  adapter: DateAdapter<D>,
  year: number,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): CalendarCell<D> {
  const date = adapter.createDate(year, 0, 1);
  const yearName = adapter.getYearName(date);
  const enabled = shouldEnableYear(adapter, year, minDate, maxDate, dateFilter);
  return {
    value: year,
    displayValue: yearName,
    ariaLabel: yearName,
    enabled,
    compareValue: year,
    rawValue: date,
  };
}

export function shouldEnableYear<D>(
  adapter: DateAdapter<D>,
  year: number,
  minDate: D | null,
  maxDate: D | null,
  dateFilter: ((date: D) => boolean) | null | undefined,
): boolean {
  if (
    (maxDate && year > adapter.getYear(maxDate)) ||
    (minDate && year < adapter.getYear(minDate))
  ) {
    return false;
  }
  if (!dateFilter) return true;
  let date = adapter.createDate(year, 0, 1);
  while (adapter.getYear(date) === year) {
    if (dateFilter(date)) return true;
    date = adapter.addCalendarDays(date, 1);
  }
  return false;
}

/** Mirrors `MatMultiYearView._handleCalendarBodyKeydown`'s delta half. */
export function multiYearActiveDateDelta<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
  key: string,
  altKey: boolean,
  isRtl: boolean,
): D | null {
  switch (key) {
    case 'ArrowLeft':
      return adapter.addCalendarYears(activeDate, isRtl ? 1 : -1);
    case 'ArrowRight':
      return adapter.addCalendarYears(activeDate, isRtl ? -1 : 1);
    case 'ArrowUp':
      return adapter.addCalendarYears(activeDate, -YEARS_PER_ROW);
    case 'ArrowDown':
      return adapter.addCalendarYears(activeDate, YEARS_PER_ROW);
    case 'Home':
      return adapter.addCalendarYears(
        activeDate,
        -getActiveYearOffset(adapter, activeDate, minDate, maxDate),
      );
    case 'End':
      return adapter.addCalendarYears(
        activeDate,
        YEARS_PER_PAGE - getActiveYearOffset(adapter, activeDate, minDate, maxDate) - 1,
      );
    case 'PageUp':
      return adapter.addCalendarYears(activeDate, altKey ? -YEARS_PER_PAGE * 10 : -YEARS_PER_PAGE);
    case 'PageDown':
      return adapter.addCalendarYears(activeDate, altKey ? YEARS_PER_PAGE * 10 : YEARS_PER_PAGE);
    default:
      return null;
  }
}

/** Mirrors `MatMultiYearView._getDateFromYear` — clamps month/day to fit the target year. */
export function dateFromYear<D>(adapter: DateAdapter<D>, activeDate: D, year: number): D {
  const month = adapter.getMonth(activeDate);
  const daysInMonth = adapter.getNumDaysInMonth(adapter.createDate(year, month, 1));
  return adapter.createDate(year, month, Math.min(adapter.getDate(activeDate), daysInMonth));
}

// ============================================================================================
// Grid geometry shared with calendar-body — mirrors `MatCalendarBody.ngOnChanges`.
// ============================================================================================

export function firstRowOffset(rows: unknown[][], numCols: number): number {
  return rows.length && rows[0].length ? numCols - rows[0].length : 0;
}
export function cellPaddingPercent(cellAspectRatio: number, numCols: number): string {
  return `${(50 * cellAspectRatio) / numCols}%`;
}
export function cellWidthPercent(numCols: number): string {
  return `${100 / numCols}%`;
}
