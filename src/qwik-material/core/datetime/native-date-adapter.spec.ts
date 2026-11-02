import {describe, expect, it} from 'vitest';
import {createNativeDateAdapter, DEFAULT_DATE_ADAPTER} from './native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from './native-date-formats';

// Deterministic subset of upstream's native-date-adapter.spec.ts, focused on the
// methods `qwik-material/timepicker` actually exercises (time-of-day + the
// date-component/calendar-math methods a future date picker will need). Every
// assertion below is pinned against a fixed `Date`, never `new Date()`'s
// current wall-clock time.

describe('createNativeDateAdapter', () => {
  const adapter = createNativeDateAdapter('en-US');

  it('DEFAULT_DATE_ADAPTER is the same shape, locked to en-US', () => {
    expect(DEFAULT_DATE_ADAPTER.locale).toBe('en-US');
  });

  it('gets year/month/date/day-of-week', () => {
    const date = new Date(2024, 0, 15); // Monday, Jan 15 2024
    expect(adapter.getYear(date)).toBe(2024);
    expect(adapter.getMonth(date)).toBe(0);
    expect(adapter.getDate(date)).toBe(15);
    expect(adapter.getDayOfWeek(date)).toBe(1);
  });

  it('gets long/short/narrow month names', () => {
    expect(adapter.getMonthNames('long')[0]).toBe('January');
    expect(adapter.getMonthNames('short')[0]).toBe('Jan');
    expect(adapter.getMonthNames('narrow')[0]).toBe('J');
    expect(adapter.getMonthNames('long')).toHaveLength(12);
  });

  it('gets date names 1-31', () => {
    const names = adapter.getDateNames();
    expect(names).toHaveLength(31);
    expect(names[0]).toBe('1');
    expect(names[30]).toBe('31');
  });

  it('gets day-of-week names starting with Sunday', () => {
    const names = adapter.getDayOfWeekNames('long');
    expect(names).toHaveLength(7);
    expect(names[0]).toBe('Sunday');
  });

  it('gets the year name', () => {
    expect(adapter.getYearName(new Date(2024, 0, 15))).toBe('2024');
  });

  it('gets the number of days in the month', () => {
    expect(adapter.getNumDaysInMonth(new Date(2024, 1, 1))).toBe(29); // leap year Feb
    expect(adapter.getNumDaysInMonth(new Date(2023, 1, 1))).toBe(28);
    expect(adapter.getNumDaysInMonth(new Date(2024, 0, 1))).toBe(31);
  });

  it('clones a date', () => {
    const date = new Date(2024, 0, 15, 10, 30);
    const clone = adapter.clone(date);
    expect(clone).not.toBe(date);
    expect(clone.getTime()).toBe(date.getTime());
  });

  it('creates a date from year/month/date', () => {
    const date = adapter.createDate(2024, 0, 15);
    expect(adapter.getYear(date)).toBe(2024);
    expect(adapter.getMonth(date)).toBe(0);
    expect(adapter.getDate(date)).toBe(15);
  });

  it('throws for an out-of-range month or date', () => {
    expect(() => adapter.createDate(2024, -1, 1)).toThrow();
    expect(() => adapter.createDate(2024, 12, 1)).toThrow();
    expect(() => adapter.createDate(2024, 0, 0)).toThrow();
    expect(() => adapter.createDate(2024, 1, 30)).toThrow(); // Feb 30 overflows to March
  });

  it('adds calendar years/months/days, clamping to the last day of a shorter month', () => {
    expect(adapter.getMonth(adapter.addCalendarMonths(new Date(2024, 0, 31), 1))).toBe(1); // Feb
    expect(adapter.getDate(adapter.addCalendarMonths(new Date(2024, 0, 31), 1))).toBe(29);
    expect(adapter.getYear(adapter.addCalendarYears(new Date(2024, 0, 15), 1))).toBe(2025);
    expect(adapter.getDate(adapter.addCalendarDays(new Date(2024, 0, 15), 10))).toBe(25);
  });

  it('formats toIso8601', () => {
    expect(adapter.toIso8601(new Date(Date.UTC(2024, 0, 15)))).toBe('2024-01-15');
  });

  it('isDateInstance / isValid / invalid', () => {
    expect(adapter.isDateInstance(new Date())).toBe(true);
    expect(adapter.isDateInstance('2024-01-15')).toBe(false);
    expect(adapter.isValid(new Date(2024, 0, 15))).toBe(true);
    expect(adapter.isValid(adapter.invalid())).toBe(false);
  });

  it('deserializes ISO 8601 strings, empty string to null, and passes through valid dates', () => {
    const date = adapter.deserialize('2024-01-15T10:00:00.000Z');
    expect(date).not.toBeNull();
    expect(adapter.isValid(date!)).toBe(true);
    expect(adapter.deserialize('')).toBeNull();
    expect(adapter.deserialize(null)).toBeNull();
    const passthrough = new Date(2024, 0, 15);
    expect(adapter.deserialize(passthrough)).toBe(passthrough);
    expect(adapter.isValid(adapter.deserialize('not a date')!)).toBe(false);
  });

  it('getValidDateOrNull', () => {
    const valid = new Date(2024, 0, 15);
    expect(adapter.getValidDateOrNull(valid)).toBe(valid);
    expect(adapter.getValidDateOrNull(adapter.invalid())).toBeNull();
    expect(adapter.getValidDateOrNull('2024-01-15')).toBeNull();
  });

  // ── time-of-day — the subset `qwik-material/timepicker` directly depends on ──

  it('setTime / getHours / getMinutes / getSeconds', () => {
    const date = adapter.setTime(new Date(2024, 0, 15), 14, 30, 15);
    expect(adapter.getHours(date)).toBe(14);
    expect(adapter.getMinutes(date)).toBe(30);
    expect(adapter.getSeconds(date)).toBe(15);
    // Date components are untouched.
    expect(adapter.getYear(date)).toBe(2024);
    expect(adapter.getMonth(date)).toBe(0);
    expect(adapter.getDate(date)).toBe(15);
  });

  it('setTime validates its inputs', () => {
    const date = new Date(2024, 0, 15);
    expect(() => adapter.setTime(date, 24, 0, 0)).toThrow();
    expect(() => adapter.setTime(date, 0, 60, 0)).toThrow();
    expect(() => adapter.setTime(date, 0, 0, 60)).toThrow();
    expect(() => adapter.setTime(date, -1, 0, 0)).toThrow();
  });

  it('addSeconds', () => {
    const date = adapter.setTime(new Date(2024, 0, 15), 10, 0, 0);
    const later = adapter.addSeconds(date, 90);
    expect(adapter.getHours(later)).toBe(10);
    expect(adapter.getMinutes(later)).toBe(1);
    expect(adapter.getSeconds(later)).toBe(30);
  });

  it('formats a time with MAT_NATIVE_DATE_FORMATS.display.timeInput — no leading zero, space before AM/PM', () => {
    const timeInput = MAT_NATIVE_DATE_FORMATS.display.timeInput;
    expect(adapter.format(adapter.setTime(adapter.today(), 0, 0, 0), timeInput)).toBe('12:00 AM');
    expect(adapter.format(adapter.setTime(adapter.today(), 12, 30, 0), timeInput)).toBe(
      '12:30 PM',
    );
    expect(adapter.format(adapter.setTime(adapter.today(), 1, 0, 0), timeInput)).toBe('1:00 AM');
    expect(adapter.format(adapter.setTime(adapter.today(), 1, 30, 0), timeInput)).toBe('1:30 AM');
    expect(adapter.format(adapter.setTime(adapter.today(), 9, 0, 0), timeInput)).toBe('9:00 AM');
    expect(adapter.format(adapter.setTime(adapter.today(), 17, 0, 0), timeInput)).toBe('5:00 PM');
  });

  it('format throws for an invalid date', () => {
    expect(() => adapter.format(adapter.invalid(), MAT_NATIVE_DATE_FORMATS.display.timeInput)).toThrow();
  });

  it('parseTime accepts "h:mm AM/PM" case-insensitively, with/without seconds, with a "." separator', () => {
    const cases: [string, number, number][] = [
      ['1:15 PM', 13, 15],
      ['1:15pm', 13, 15],
      ['13:15', 13, 15],
      ['1.15 PM', 13, 15],
      ['12:00 AM', 0, 0],
      ['12:00 PM', 12, 0],
      ['9:05:30 am', 9, 5],
    ];
    for (const [input, hours, minutes] of cases) {
      const parsed = adapter.parseTime(input);
      expect(parsed, `parsing "${input}"`).not.toBeNull();
      expect(adapter.isValid(parsed!), `"${input}" should be valid`).toBe(true);
      expect(adapter.getHours(parsed!)).toBe(hours);
      expect(adapter.getMinutes(parsed!)).toBe(minutes);
    }
  });

  it('parseTime returns an invalid date for unparseable text, null for empty, and passes through Dates', () => {
    const date = new Date(2024, 0, 15, 10, 0);
    expect(adapter.parseTime(date)).toEqual(date);
    expect(adapter.parseTime('')).toBeNull();
    expect(adapter.parseTime('   ')).toBeNull();
    expect(adapter.isValid(adapter.parseTime('not a time')!)).toBe(false);
    expect(adapter.isValid(adapter.parseTime('25:99')!)).toBe(false);
  });

  it('parseTime strips locale cruft around an otherwise-parseable time', () => {
    const parsed = adapter.parseTime('00:05 ч.');
    expect(parsed).not.toBeNull();
    expect(adapter.isValid(parsed!)).toBe(true);
    expect(adapter.getHours(parsed!)).toBe(0);
    expect(adapter.getMinutes(parsed!)).toBe(5);
  });

  it('round-trips format -> parseTime for every half-hour of the day', () => {
    let time = adapter.setTime(adapter.today(), 0, 0, 0);
    for (let i = 0; i < 48; i++) {
      const label = adapter.format(time, MAT_NATIVE_DATE_FORMATS.display.timeInput);
      const parsed = adapter.parseTime(label, MAT_NATIVE_DATE_FORMATS.parse.timeInput);
      expect(parsed, `round-tripping ${label}`).not.toBeNull();
      expect(adapter.sameTime(parsed, time), `round-tripping ${label}`).toBe(true);
      time = adapter.addSeconds(time, 30 * 60);
    }
  });

  // ── shared default-method ports (compareDate/sameDate/sameTime/clampDate/…) ──

  it('compareDate / sameDate', () => {
    const a = new Date(2024, 0, 15);
    const b = new Date(2024, 0, 16);
    const c = new Date(2024, 0, 15, 23, 0);
    expect(adapter.compareDate(a, b)).toBeLessThan(0);
    expect(adapter.compareDate(b, a)).toBeGreaterThan(0);
    expect(adapter.sameDate(a, c)).toBe(true);
    expect(adapter.sameDate(a, b)).toBe(false);
    expect(adapter.sameDate(null, null)).toBe(true);
    expect(adapter.sameDate(a, null)).toBe(false);
  });

  it('compareTime / sameTime', () => {
    const a = adapter.setTime(new Date(2024, 0, 1), 9, 0, 0);
    const b = adapter.setTime(new Date(2024, 5, 20), 9, 0, 0);
    const c = adapter.setTime(new Date(2024, 0, 1), 17, 0, 0);
    expect(adapter.sameTime(a, b)).toBe(true); // different date, same time of day
    expect(adapter.sameTime(a, c)).toBe(false);
    expect(adapter.compareTime(a, c)).toBeLessThan(0);
    expect(adapter.sameTime(null, null)).toBe(true);
  });

  it('clampDate', () => {
    const min = new Date(2024, 0, 10);
    const max = new Date(2024, 0, 20);
    expect(adapter.clampDate(new Date(2024, 0, 1), min, max)).toBe(min);
    expect(adapter.clampDate(new Date(2024, 0, 31), min, max)).toBe(max);
    const inRangeDate = new Date(2024, 0, 15);
    expect(adapter.clampDate(inRangeDate, min, max)).toBe(inRangeDate);
  });

  it('a non-en-US locale formats month names differently', () => {
    const ja = createNativeDateAdapter('ja-JP');
    expect(ja.getMonthNames('long')[0]).toBe('1月');
  });
});
