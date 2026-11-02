/**
 * Qwik port of upstream `NativeDateAdapter`
 * (`src/material/core/datetime/native-date-adapter.ts`) — adapts the native
 * JS `Date` for use with `qwik-material/timepicker` (and, later, a date
 * picker). A faithful, deterministic port: same `Intl.DateTimeFormat`-based
 * formatting (incl. the UTC-stamping DST workaround), the same lenient
 * `TIME_REGEX` time parser, the same ISO-8601 `deserialize` override. See
 * `date-adapter.ts`'s module doc comment for why this is a factory function
 * returning a plain object instead of a subclass.
 */
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
 * Creates a `DateAdapter<Date>` backed by the native JS `Date` — the Qwik port's equivalent of
 * upstream `provideNativeDateAdapter()`'s `NativeDateAdapter`. Deterministic: every formatting
 * method is a pure function of its input date + the fixed `locale` (default `'en-US'`), with no
 * dependency on the current wall-clock time except `today()`/`parseTime()`'s "today" fallback
 * (never exercised by a scenario that cares about the exact date, only the time-of-day — see
 * `timepicker/SYNC.md`).
 */
export function createNativeDateAdapter(locale = 'en-US'): DateAdapter<Date> {
  // Declared as a mutable local so methods can reference sibling methods through the FINISHED
  // object (`adapter.xyz(...)`), same self-referential object-literal pattern used throughout
  // this project's other factory functions (e.g. `qwik-cdk/overlay`'s `createOverlayRef`).
  const adapter: DateAdapter<Date> = {
    locale,

    getYear: date => date.getFullYear(),
    getMonth: date => date.getMonth(),
    getDate: date => date.getDate(),
    getDayOfWeek: date => date.getDay(),

    getMonthNames: style => {
      const dtf = new Intl.DateTimeFormat(locale, {month: style, timeZone: 'utc'});
      return range(12, i => formatWithUtcWorkaround(dtf, new Date(2017, i, 1)));
    },

    getDateNames: () => {
      const dtf = new Intl.DateTimeFormat(locale, {day: 'numeric', timeZone: 'utc'});
      return range(31, i => formatWithUtcWorkaround(dtf, new Date(2017, 0, i + 1)));
    },

    getDayOfWeekNames: style => {
      const dtf = new Intl.DateTimeFormat(locale, {weekday: style, timeZone: 'utc'});
      return range(7, i => formatWithUtcWorkaround(dtf, new Date(2017, 0, i + 1)));
    },

    getYearName: date => {
      const dtf = new Intl.DateTimeFormat(locale, {year: 'numeric', timeZone: 'utc'});
      return formatWithUtcWorkaround(dtf, date);
    },

    getFirstDayOfWeek: () => {
      // At the time of writing, `Intl.Locale`'s week-info is not universally available.
      const IntlAny = Intl as unknown as {
        Locale?: new (tag: string) => {
          getWeekInfo?: () => {firstDay: number};
          weekInfo?: {firstDay: number};
        };
      };
      if (typeof Intl !== 'undefined' && IntlAny.Locale) {
        const localeInfo = new IntlAny.Locale(locale);
        const firstDay = (localeInfo.getWeekInfo?.() ?? localeInfo.weekInfo)?.firstDay ?? 0;
        // `weekInfo.firstDay` is 1-7 starting from Monday; this project's representation is
        // 0-6 starting from Sunday.
        return firstDay === 7 ? 0 : firstDay;
      }
      return 0;
    },

    getNumDaysInMonth: date =>
      adapter.getDate(createDateWithOverflow(adapter.getYear(date), adapter.getMonth(date) + 1, 0)),

    clone: date => new Date(date.getTime()),

    createDate: (year, month, date) => {
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
    },

    today: () => new Date(),

    parse: (value, _parseFormat) => {
      // The native `Date` has no way to set the parse format or locale, so these are ignored —
      // matches upstream exactly.
      if (typeof value === 'number') {
        return new Date(value);
      }
      return value ? new Date(Date.parse(value as string)) : null;
    },

    format: (date, displayFormat) => {
      if (!adapter.isValid(date)) {
        throw Error('createNativeDateAdapter: Cannot format invalid date.');
      }
      const dtf = new Intl.DateTimeFormat(locale, {
        ...(displayFormat as Intl.DateTimeFormatOptions),
        timeZone: 'utc',
      });
      return formatWithUtcWorkaround(dtf, date);
    },

    addCalendarYears: (date, years) => adapter.addCalendarMonths(date, years * 12),

    addCalendarMonths: (date, months) => {
      let newDate = createDateWithOverflow(
        adapter.getYear(date),
        adapter.getMonth(date) + months,
        adapter.getDate(date),
      );
      // It's possible to wind up in the wrong month if the original month has more days than
      // the new month — go to the last day of the desired month instead. The `+ 12) % 12`
      // ensures a positive remainder, since JS `%` doesn't guarantee that.
      if (adapter.getMonth(newDate) !== (((adapter.getMonth(date) + months) % 12) + 12) % 12) {
        newDate = createDateWithOverflow(adapter.getYear(newDate), adapter.getMonth(newDate), 0);
      }
      return newDate;
    },

    addCalendarDays: (date, days) =>
      createDateWithOverflow(adapter.getYear(date), adapter.getMonth(date), adapter.getDate(date) + days),

    toIso8601: date =>
      [date.getUTCFullYear(), twoDigit(date.getUTCMonth() + 1), twoDigit(date.getUTCDate())].join(
        '-',
      ),

    isDateInstance: obj => obj instanceof Date,
    isValid: date => !isNaN(date.getTime()),
    invalid: () => new Date(NaN),

    /**
     * Deserializes valid ISO 8601 strings into valid Dates and the empty string into `null`,
     * falling back to the base behavior (only an already-valid `Date` or `null` survives)
     * otherwise. Mirrors `NativeDateAdapter.deserialize`'s override.
     */
    deserialize: value => {
      if (typeof value === 'string') {
        if (!value) return null;
        // The `Date` constructor accepts formats other than ISO 8601, so the string's shape is
        // checked first.
        if (ISO_8601_REGEX.test(value)) {
          const date = new Date(value);
          if (adapter.isValid(date)) return date;
        }
      }
      return deserializeDefault(adapter, value);
    },

    setTime: (target, hours, minutes, seconds) => {
      if (!inRange(hours, 0, 23)) {
        throw Error(`Invalid hours "${hours}". Hours value must be between 0 and 23.`);
      }
      if (!inRange(minutes, 0, 59)) {
        throw Error(`Invalid minutes "${minutes}". Minutes value must be between 0 and 59.`);
      }
      if (!inRange(seconds, 0, 59)) {
        throw Error(`Invalid seconds "${seconds}". Seconds value must be between 0 and 59.`);
      }
      const clone = adapter.clone(target);
      clone.setHours(hours, minutes, seconds, 0);
      return clone;
    },

    getHours: date => date.getHours(),
    getMinutes: date => date.getMinutes(),
    getSeconds: date => date.getSeconds(),

    parseTime: userValue => {
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

      return result || adapter.invalid();
    },

    addSeconds: (date, amount) => new Date(date.getTime() + amount * 1000),

    getValidDateOrNull: obj => getValidDateOrNullDefault(adapter, obj),
    compareDate: (first, second) => compareDateDefault(adapter, first, second),
    compareTime: (first, second) => compareTimeDefault(adapter, first, second),
    sameDate: (first, second) => sameDateDefault(adapter, first, second),
    sameTime: (first, second) => sameTimeDefault(adapter, first, second),
    clampDate: (date, min, max) => clampDateDefault(adapter, date, min, max),
  };

  return adapter;
}

/**
 * Process-wide default `DateAdapter<Date>` (`en-US`) — used by every
 * `qwik-material/timepicker` runtime code path (see `timepicker/SYNC.md`
 * for why interactive/runtime logic always uses this singleton rather than
 * going through `useDateAdapter()`'s context, which exists for render-time/
 * future use only). Safe to import and call directly from inside a `$()`
 * handler: it is a plain module-level object of pure functions, never
 * placed into Qwik state, so there is nothing to serialize.
 */
export const DEFAULT_DATE_ADAPTER: DateAdapter<Date> = createNativeDateAdapter('en-US');
