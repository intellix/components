import {describe, expect, it} from 'vitest';
import {createNativeDateAdapter} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {
  buildMonthView,
  buildMultiYearView,
  buildYearView,
  dateFromMonth,
  dateFromYear,
  getActiveYearOffset,
  getStartingYear,
  isActiveCell,
  isInRange,
  isRangeEnd,
  isRangeStart,
  isSameMultiYearPage,
  isSelected,
  monthActiveDateDelta,
  multiYearActiveDateDelta,
  shouldEnableDate,
  shouldEnableMonth,
  shouldEnableYear,
  yearActiveDateDelta,
} from './calendar-math';

const adapter = createNativeDateAdapter('en-US');
const formats = MAT_NATIVE_DATE_FORMATS;
const d = (y: number, m: number, day: number) => new Date(y, m, day);

describe('buildMonthView', () => {
  it('Jan 2024 starts on a Monday -> firstWeekOffset 1, 31 days, last row ragged', () => {
    const view = buildMonthView(adapter, formats, d(2024, 0, 15), null, null, undefined);
    expect(view.firstWeekOffset).toBe(1);
    expect(view.weeks[0]).toHaveLength(6); // Mon..Sat (offset 1 => 6 cells in row 0)
    expect(view.weeks[0][0].value).toBe(1);
    const lastWeek = view.weeks[view.weeks.length - 1];
    expect(lastWeek[lastWeek.length - 1].value).toBe(31);
    // mirrors MatMonthView's own INTERNAL `_monthLabel` (the table's inline label cell, distinct
    // from MatCalendarHeader's period-button text) — no `monthLabel` format in
    // MAT_NATIVE_DATE_FORMATS, so this falls back to `getMonthNames('short')[month]` only.
    expect(view.monthLabel).toBe('JAN');
  });

  it('weekdays rotate to start on Sunday (en-US firstDayOfWeek=0)', () => {
    const view = buildMonthView(adapter, formats, d(2024, 0, 15), null, null, undefined);
    expect(view.weekdays[0].long).toBe('Sunday');
  });

  it('aria label uses long month/day/year format', () => {
    const view = buildMonthView(adapter, formats, d(2024, 0, 15), null, null, undefined);
    const cell15 = view.weeks.flat().find(c => c.value === 15)!;
    expect(cell15.ariaLabel).toBe('January 15, 2024');
  });

  it('min/max/filter combine to disable the documented min-max-filter map', () => {
    const min = d(2024, 0, 10);
    const max = d(2024, 0, 20);
    const noWeekends = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;
    const view = buildMonthView(adapter, formats, d(2024, 0, 15), min, max, noWeekends);
    const byDay = new Map(view.weeks.flat().map(c => [c.value, c.enabled]));
    for (let day = 1; day <= 9; day++) expect(byDay.get(day)).toBe(false); // before min
    expect(byDay.get(10)).toBe(true); // Wed
    expect(byDay.get(11)).toBe(true); // Thu
    expect(byDay.get(12)).toBe(true); // Fri
    expect(byDay.get(13)).toBe(false); // Sat (weekend)
    expect(byDay.get(14)).toBe(false); // Sun (weekend)
    expect(byDay.get(15)).toBe(true); // Mon
    expect(byDay.get(19)).toBe(true); // Fri
    expect(byDay.get(20)).toBe(false); // Sat AND max boundary
    expect(byDay.get(21)).toBe(false); // past max
  });
});

describe('monthActiveDateDelta — keyboard-nav scenario, anchored Jan 15 2024', () => {
  const start = d(2024, 0, 15);
  const step = (date: Date, key: string, alt = false) =>
    monthActiveDateDelta(adapter, date, key, alt, false);

  it('walks the exact documented sequence', () => {
    let active = start;
    active = step(active, 'ArrowRight')!;
    expect(adapter.getDate(active)).toBe(16);
    active = step(active, 'ArrowDown')!;
    expect(adapter.getDate(active)).toBe(23);
    active = step(active, 'ArrowLeft')!;
    expect(adapter.getDate(active)).toBe(22);
    active = step(active, 'ArrowUp')!;
    expect(adapter.getDate(active)).toBe(15);
    active = step(active, 'Home')!;
    expect(adapter.getDate(active)).toBe(1);
    active = step(active, 'End')!;
    expect(adapter.getDate(active)).toBe(31);
    active = step(active, 'PageUp')!;
    expect([adapter.getYear(active), adapter.getMonth(active), adapter.getDate(active)]).toEqual([
      2023, 11, 31,
    ]);
    active = step(active, 'PageUp', true)!;
    expect([adapter.getYear(active), adapter.getMonth(active), adapter.getDate(active)]).toEqual([
      2022, 11, 31,
    ]);
    active = step(active, 'PageDown')!;
    expect([adapter.getYear(active), adapter.getMonth(active), adapter.getDate(active)]).toEqual([
      2023, 0, 31,
    ]);
    active = step(active, 'PageDown', true)!;
    expect([adapter.getYear(active), adapter.getMonth(active), adapter.getDate(active)]).toEqual([
      2024, 0, 31,
    ]);
  });

  it('returns null for an unhandled key', () => {
    expect(step(start, 'Tab')).toBeNull();
  });
});

describe('buildYearView', () => {
  it('June 2024 month cell carries long-month aria label', () => {
    const view = buildYearView(adapter, formats, d(2024, 0, 1), null, null, undefined);
    const june = view.months.flat().find(c => c.value === 5)!;
    expect(june.displayValue).toBe('JUN');
    expect(june.ariaLabel).toBe('June 2024');
  });

  it('yearActiveDateDelta moves by month/row-of-4/decade', () => {
    const active = d(2024, 0, 1);
    expect(
      adapter.getMonth(yearActiveDateDelta(adapter, active, 'ArrowRight', false, false)!),
    ).toBe(1);
    expect(adapter.getMonth(yearActiveDateDelta(adapter, active, 'ArrowDown', false, false)!)).toBe(
      4,
    );
    expect(adapter.getYear(yearActiveDateDelta(adapter, active, 'PageUp', true, false)!)).toBe(
      2014,
    );
  });

  it('shouldEnableMonth: a month with no enabled day is disabled', () => {
    const allDisabled = () => false;
    expect(shouldEnableMonth(adapter, 2024, 5, null, null, allDisabled)).toBe(false);
    expect(shouldEnableMonth(adapter, 2024, 5, null, null, undefined)).toBe(true);
  });

  it('dateFromMonth clamps day to fit (Jan 31 -> Feb -> Feb 29, 2024 is a leap year)', () => {
    const jan31 = d(2024, 0, 31);
    const result = dateFromMonth(adapter, jan31, 1);
    expect(adapter.getMonth(result)).toBe(1);
    expect(adapter.getDate(result)).toBe(29);
  });
});

describe('multi-year window math', () => {
  it('startAt=1990, no min/max -> window 1968-1991 (documented determinism pitfall)', () => {
    const active = d(1990, 0, 1);
    const view = buildMultiYearView(adapter, active, null, null, undefined);
    const flat = view.years.flat();
    expect(flat[0].value).toBe(1968);
    expect(flat[flat.length - 1].value).toBe(1991);
    expect(view.activeCell).toBe(22); // 1990 is the 23rd cell (index 22) of the page
  });

  it('getStartingYear: no min/max -> 0; minDate -> minDate year; maxDate wins over minDate', () => {
    expect(getStartingYear(adapter, null, null)).toBe(0);
    expect(getStartingYear(adapter, d(2000, 0, 1), null)).toBe(2000);
    expect(getStartingYear(adapter, d(2000, 0, 1), d(2050, 0, 1))).toBe(2050 - 24 + 1);
  });

  it('isSameMultiYearPage: 1968 and 1991 share a page; 1967 and 1992 do not', () => {
    expect(isSameMultiYearPage(adapter, d(1968, 0, 1), d(1991, 0, 1), null, null)).toBe(true);
    expect(isSameMultiYearPage(adapter, d(1967, 0, 1), d(1968, 0, 1), null, null)).toBe(false);
    expect(isSameMultiYearPage(adapter, d(1991, 0, 1), d(1992, 0, 1), null, null)).toBe(false);
  });

  it('multiYearActiveDateDelta: Home/End jump to page bounds, Alt+PageUp/Down jump 240 years', () => {
    const active = d(1990, 0, 1);
    expect(
      adapter.getYear(multiYearActiveDateDelta(adapter, active, null, null, 'Home', false, false)!),
    ).toBe(1968);
    expect(
      adapter.getYear(multiYearActiveDateDelta(adapter, active, null, null, 'End', false, false)!),
    ).toBe(1991);
    expect(
      adapter.getYear(
        multiYearActiveDateDelta(adapter, active, null, null, 'PageDown', true, false)!,
      ),
    ).toBe(2230);
  });

  it('dateFromYear clamps day (Feb 29 2024 -> 2025 -> Feb 28)', () => {
    const feb29 = d(2024, 1, 29);
    const result = dateFromYear(adapter, feb29, 2025);
    expect(adapter.getYear(result)).toBe(2025);
    expect(adapter.getDate(result)).toBe(28);
  });
});

describe('cell predicates', () => {
  it('isRangeStart/isRangeEnd/isInRange/isSelected', () => {
    expect(isRangeStart(10, 10, 20)).toBe(true);
    expect(isRangeStart(20, 10, 20)).toBe(false);
    expect(isRangeEnd(20, 10, 20)).toBe(true);
    expect(isRangeEnd(10, 10, 20)).toBe(false);
    expect(isInRange(15, 10, 20, true)).toBe(true);
    expect(isInRange(15, 10, 20, false)).toBe(false);
    expect(isSelected(10, 10, 10)).toBe(true);
    expect(isSelected(11, 10, 10)).toBe(false);
  });

  it('isActiveCell accounts for a ragged first row', () => {
    // numCols=7, firstRowOffset=1 (Jan 2024): day 1 is row0/col0 -> cellNumber 0.
    expect(isActiveCell(0, 0, 7, 1, 0)).toBe(true);
    // day 8 is row1/col0 -> raw 7, minus offset 1 = 6? Let's check day 2 (row0,col1 -> cellNumber1)
    expect(isActiveCell(0, 1, 7, 1, 1)).toBe(true);
    // row1 col0 is the 7th cell overall counting the row0 offset: 1*7+0=7, minus offset(1)=6,
    // i.e. activeCell 6 -> that's day 7 (0-indexed 6 -> day 7, since day1 is index0).
    expect(isActiveCell(1, 0, 7, 1, 6)).toBe(true);
  });
});

describe('shouldEnableDate', () => {
  it('enabled by default, disabled outside min/max or failing the filter', () => {
    const date = d(2024, 0, 15);
    expect(shouldEnableDate(adapter, date, null, null, undefined)).toBe(true);
    expect(shouldEnableDate(adapter, date, d(2024, 0, 16), null, undefined)).toBe(false);
    expect(shouldEnableDate(adapter, date, null, d(2024, 0, 14), undefined)).toBe(false);
    expect(shouldEnableDate(adapter, date, null, null, () => false)).toBe(false);
  });
});

describe('shouldEnableYear', () => {
  it('disabled outside min/max year, or when no day in the year passes the filter', () => {
    expect(shouldEnableYear(adapter, 2024, d(2025, 0, 1), null, undefined)).toBe(false);
    expect(shouldEnableYear(adapter, 2024, null, d(2023, 0, 1), undefined)).toBe(false);
    expect(shouldEnableYear(adapter, 2024, null, null, () => false)).toBe(false);
    expect(shouldEnableYear(adapter, 2024, null, null, undefined)).toBe(true);
  });
});
