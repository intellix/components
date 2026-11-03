/**
 * Qwik port of upstream `NativeDateAdapter`
 * (`src/material/core/datetime/native-date-adapter.ts`) — adapts the native
 * JS `Date` for use with `qwik-material/timepicker` and `qwik-material/datepicker`. A faithful,
 * deterministic port: same `Intl.DateTimeFormat`-based formatting (incl. the UTC-stamping DST
 * workaround), the same lenient `TIME_REGEX` time parser, the same ISO-8601 `deserialize`
 * override.
 *
 * 2026-11-03: now a real, exported ES `class` (`NativeDateAdapter`), not only a factory
 * returning an anonymous object literal — see `datepicker/SYNC.md`'s "DateAdapter /
 * MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section for the full rationale. The task this
 * supports requires apps to be able to SUBCLASS it (`class DotDateAdapter extends
 * NativeDateAdapter { override parse() {...} override format() {...} }`, e.g. to accept
 * `dd.mm.yyyy`), which a plain factory function can't support. This does NOT reintroduce the
 * "class instances with methods can't be serialized" hazard this project's other SYNC.md files
 * warn about: a `NativeDateAdapter`/subclass instance is never put into Qwik signal/store state
 * directly — every consumer either (a) constructs one fresh, synchronously, from a hardcoded
 * module-level factory (render-time label computation — safe regardless of resume, since
 * nothing about the construction depends on serialized state), or (b) for an APP-SUPPLIED
 * (possibly custom) adapter, holds only a `QRL` factory (`(locale) => DateAdapter<D>`) in
 * Qwik state — QRLs are natively resumable — and calls it fresh wherever a live instance is
 * needed (see `use-date-adapter.ts`'s `MAT_DATE_ADAPTER_FACTORY` + `resolveDateAdapter()`).
 * `createNativeDateAdapter()`/`DEFAULT_DATE_ADAPTER` remain as thin wrappers over the class for
 * every existing call site.
 */
import {createSignal, type Signal} from '@qwik.dev/core';
import type {DateAdapter} from './date-adapter';
import {
  clampDateDefault,
  compareDateDefault,
  compareTimeDefault,
  deserializeDefault,
  getValidDateOrNullDefault,
  sameDateDefault,
  sameTimeDefault,
} from './date-adapter';

/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (https://tools.ietf.org/html/rfc3339). Note that the string may not actually be a valid date
 * because the regex will match strings with an out of bounds month, date, etc.
 */
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;

/**
 * Matches a time string. Supported formats:
 * - {{hours}}:{{minutes}}
 * - {{hours}}:{{minutes}}:{{seconds}}
 * - {{hours}}:{{minutes}} AM/PM
 * - {{hours}}:{{minutes}}:{{seconds}} AM/PM
 * - {{hours}}.{{minutes}}
 * - {{hours}}.{{minutes}}.{{seconds}}
 * - {{hours}}.{{minutes}} AM/PM
 * - {{hours}}.{{minutes}}.{{seconds}} AM/PM
 */
const TIME_REGEX = /^(\d?\d)[:.](\d?\d)(?:[:.](\d?\d))?\s*(AM|PM)?$/i;

/** Checks whether a number is within a certain range. */
function inRange(value: number, min: number, max: number): boolean {
  return !isNaN(value) && value >= min && value <= max;
}

/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray: T[] = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

/** Pads a number to make it two digits. */
function twoDigit(n: number): string {
  return ('00' + n).slice(-2);
}

/** Creates a date but allows the month and date to overflow (mirrors upstream's
 *  `_createDateWithOverflow` — avoids the `Date` constructor's year<100 special-casing by using
 *  `setFullYear`/`setHours` instead). */
function createDateWithOverflow(year: number, month: number, date: number): Date {
  const d = new Date();
  d.setFullYear(year, month, date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * When converting a `Date` to a string, the browser's `Intl.DateTimeFormat` applies its own
 * internal DST rules, which can produce the wrong string for a date in the past/future whose DST
 * rule differs from today's. Upstream works around this by building a *new* `Date` whose UTC
 * fields hold the local y/m/d/h/m/s/ms of the real date, then formatting THAT with `timeZone:
 * 'utc'` — see `NativeDateAdapter._format`'s own comment for the full rationale.
 */
function formatWithUtcWorkaround(dtf: Intl.DateTimeFormat, date: Date): string {
  const d = new Date();
  d.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  d.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return dtf.format(d);
}

/** Attempts to parse a time string into a `Date` (today's date, with the parsed time of day).
 *  Returns `null` if it cannot be parsed. Mirrors `NativeDateAdapter._parseTimeString`. */
function parseTimeString(value: string): Date | null {
  // Note: we can technically rely on the browser for the time parsing by generating an ISO
  // string and appending the string to the end of it. We don't do it, because browsers aren't
  // consistent in what they support (e.g. Safari doesn't support AM/PM or padded numbers;
  // Firefox produces a valid date for an overflowing time like 12:75 while others don't).
  const parsed = value.toUpperCase().match(TIME_REGEX);

  if (parsed) {
    let hours = parseInt(parsed[1], 10);
    const minutes = parseInt(parsed[2], 10);
    const seconds: number | undefined = parsed[3] == null ? undefined : parseInt(parsed[3], 10);
    const amPm = parsed[4] as 'AM' | 'PM' | undefined;

    if (hours === 12) {
      hours = amPm === 'AM' ? 0 : hours;
    } else if (amPm === 'PM') {
      hours += 12;
    }

    if (
      inRange(hours, 0, 23) &&
      inRange(minutes, 0, 59) &&
      (seconds == null || inRange(seconds, 0, 59))
    ) {
      const clone = new Date();
      clone.setHours(hours, minutes, seconds || 0, 0);
      return clone;
    }
  }

  return null;
}

/**
 * `DateAdapter<Date>` backed by the native JS `Date` — the Qwik port's equivalent of upstream
 * `NativeDateAdapter` (`provideNativeDateAdapter()`'s concrete class). Deterministic: every
 * formatting method is a pure function of its input date + `this.locale`, with no dependency on
 * the current wall-clock time except `today()`/`parseTime()`'s "today" fallback (never exercised
 * by a scenario that cares about the exact date, only the time-of-day — see
 * `timepicker/SYNC.md`).
 *
 * Exported so apps can `extends` it to override `parse()`/`format()` (the task this supports'
 * own worked example: accepting/emitting `dd.mm.yyyy`) while inheriting every other method
 * (arithmetic, comparisons, locale-aware names) for free — see `datepicker/SYNC.md`'s "Choosing
 * a date implementation" section for a full worked subclass and
 * `src/qwik-material-examples/datepicker/datepicker-custom-adapter/` for the ported example.
 */
export class NativeDateAdapter implements DateAdapter<Date> {
  locale: string;
  readonly localeChanges: Signal<number> = createSignal(0);

  constructor(locale = 'en-US') {
    this.locale = locale;
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.localeChanges.value++;
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }
  getMonth(date: Date): number {
    return date.getMonth();
  }
  getDate(date: Date): number {
    return date.getDate();
  }
  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {month: style, timeZone: 'utc'});
    return range(12, i => formatWithUtcWorkaround(dtf, new Date(2017, i, 1)));
  }

  getDateNames(): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {day: 'numeric', timeZone: 'utc'});
    return range(31, i => formatWithUtcWorkaround(dtf, new Date(2017, 0, i + 1)));
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {weekday: style, timeZone: 'utc'});
    return range(7, i => formatWithUtcWorkaround(dtf, new Date(2017, 0, i + 1)));
  }

  getYearName(date: Date): string {
    const dtf = new Intl.DateTimeFormat(this.locale, {year: 'numeric', timeZone: 'utc'});
    return formatWithUtcWorkaround(dtf, date);
  }

  getFirstDayOfWeek(): number {
    // At the time of writing, `Intl.Locale`'s week-info is not universally available.
    const IntlAny = Intl as unknown as {
      Locale?: new (tag: string) => {
        getWeekInfo?: () => {firstDay: number};
        weekInfo?: {firstDay: number};
      };
    };
    if (typeof Intl !== 'undefined' && IntlAny.Locale) {
      const localeInfo = new IntlAny.Locale(this.locale);
      const firstDay = (localeInfo.getWeekInfo?.() ?? localeInfo.weekInfo)?.firstDay ?? 0;
      // `weekInfo.firstDay` is 1-7 starting from Monday; this project's representation is
      // 0-6 starting from Sunday.
      return firstDay === 7 ? 0 : firstDay;
    }
    return 0;
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(createDateWithOverflow(this.getYear(date), this.getMonth(date) + 1, 0));
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  createDate(year: number, month: number, date: number): Date {
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }
    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }
    const result = createDateWithOverflow(year, month, date);
    if (result.getMonth() !== month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }
    return result;
  }

  today(): Date {
    return new Date();
  }

  parse(value: unknown, _parseFormat: unknown): Date | null {
    // The native `Date` has no way to set the parse format or locale, so these are ignored —
    // matches upstream exactly. Override this method (see the class doc comment) to support a
    // custom textual format such as `dd.mm.yyyy`.
    if (typeof value === 'number') {
      return new Date(value);
    }
    return value ? new Date(Date.parse(value as string)) : null;
  }

  format(date: Date, displayFormat: unknown): string {
    if (!this.isValid(date)) {
      throw Error('NativeDateAdapter: Cannot format invalid date.');
    }
    const dtf = new Intl.DateTimeFormat(this.locale, {
      ...(displayFormat as Intl.DateTimeFormatOptions),
      timeZone: 'utc',
    });
    return formatWithUtcWorkaround(dtf, date);
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date) + months,
      this.getDate(date),
    );
    // It's possible to wind up in the wrong month if the original month has more days than
    // the new month — go to the last day of the desired month instead. The `+ 12) % 12`
    // ensures a positive remainder, since JS `%` doesn't guarantee that.
    if (this.getMonth(newDate) !== (((this.getMonth(date) + months) % 12) + 12) % 12) {
      newDate = createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
    }
    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return createDateWithOverflow(this.getYear(date), this.getMonth(date), this.getDate(date) + days);
  }

  toIso8601(date: Date): string {
    return [date.getUTCFullYear(), twoDigit(date.getUTCMonth() + 1), twoDigit(date.getUTCDate())].join(
      '-',
    );
  }

  isDateInstance(obj: unknown): boolean {
    return obj instanceof Date;
  }
  isValid(date: Date): boolean {
    return !isNaN(date.getTime());
  }
  invalid(): Date {
    return new Date(NaN);
  }

  /**
   * Deserializes valid ISO 8601 strings into valid Dates and the empty string into `null`,
   * falling back to the base behavior (only an already-valid `Date` or `null` survives)
   * otherwise. Mirrors `NativeDateAdapter.deserialize`'s override.
   */
  deserialize(value: unknown): Date | null {
    if (typeof value === 'string') {
      if (!value) return null;
      // The `Date` constructor accepts formats other than ISO 8601, so the string's shape is
      // checked first.
      if (ISO_8601_REGEX.test(value)) {
        const date = new Date(value);
        if (this.isValid(date)) return date;
      }
    }
    return deserializeDefault(this, value);
  }

  setTime(target: Date, hours: number, minutes: number, seconds: number): Date {
    if (!inRange(hours, 0, 23)) {
      throw Error(`Invalid hours "${hours}". Hours value must be between 0 and 23.`);
    }
    if (!inRange(minutes, 0, 59)) {
      throw Error(`Invalid minutes "${minutes}". Minutes value must be between 0 and 59.`);
    }
    if (!inRange(seconds, 0, 59)) {
      throw Error(`Invalid seconds "${seconds}". Seconds value must be between 0 and 59.`);
    }
    const clone = this.clone(target);
    clone.setHours(hours, minutes, seconds, 0);
    return clone;
  }

  getHours(date: Date): number {
    return date.getHours();
  }
  getMinutes(date: Date): number {
    return date.getMinutes();
  }
  getSeconds(date: Date): number {
    return date.getSeconds();
  }

  parseTime(userValue: unknown, _parseFormat?: unknown): Date | null {
    // Override this method (see the class doc comment) for a custom textual time format.
    if (typeof userValue !== 'string') {
      return userValue instanceof Date ? new Date(userValue.getTime()) : null;
    }

    const value = userValue.trim();
    if (value.length === 0) return null;

    // Attempt to parse the value directly.
    let result = parseTimeString(value);

    // Some locales add extra characters around the time, but are otherwise parseable (e.g.
    // `00:05 ч.` in bg-BG). Try replacing all non-number and non-colon characters.
    if (result === null) {
      const withoutExtras = value.replace(/[^0-9:(AM|PM)]/gi, '').trim();
      if (withoutExtras.length > 0) {
        result = parseTimeString(withoutExtras);
      }
    }

    return result || this.invalid();
  }

  addSeconds(date: Date, amount: number): Date {
    return new Date(date.getTime() + amount * 1000);
  }

  getValidDateOrNull(obj: unknown): Date | null {
    return getValidDateOrNullDefault(this, obj);
  }
  compareDate(first: Date, second: Date): number {
    return compareDateDefault(this, first, second);
  }
  compareTime(first: Date, second: Date): number {
    return compareTimeDefault(this, first, second);
  }
  sameDate(first: Date | null, second: Date | null): boolean {
    return sameDateDefault(this, first, second);
  }
  sameTime(first: Date | null, second: Date | null): boolean {
    return sameTimeDefault(this, first, second);
  }
  clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
    return clampDateDefault(this, date, min, max);
  }
}

/**
 * Creates a `DateAdapter<Date>` backed by the native JS `Date` — a thin factory wrapper over
 * {@link NativeDateAdapter} kept for every existing call site/the familiar upstream-like
 * `provideNativeDateAdapter()`-style naming. Prefer `new NativeDateAdapter(locale)` (or a
 * subclass) when you need `instanceof`/subclassing.
 */
export function createNativeDateAdapter(locale = 'en-US'): DateAdapter<Date> {
  return new NativeDateAdapter(locale);
}

/**
 * Process-wide default `DateAdapter<Date>` (`en-US`) — used by every `qwik-material/timepicker`/
 * `qwik-material/datepicker` runtime code path that has no app-supplied `MAT_DATE_ADAPTER_FACTORY`
 * in scope (see `use-date-adapter.ts`), and by every PURE ARITHMETIC calendar computation
 * (month/day/year arithmetic never depends on locale or a custom `parse`/`format` override — only
 * the TEXT a label/input renders does; see `datepicker/SYNC.md`). Safe to import and call
 * directly from inside a `$()` handler: it is a plain module-level singleton whose methods never
 * touch Qwik state, so there is nothing to serialize. Do NOT call `.setLocale()` on this shared
 * singleton — it is process-wide (shared across concurrent SSR requests); use the
 * `MAT_DATE_LOCALE` context / `useDateLocale()` signal instead for anything reactive or
 * request-scoped.
 */
export const DEFAULT_DATE_ADAPTER: DateAdapter<Date> = createNativeDateAdapter('en-US');
