/**
 * Qwik port of upstream `DateAdapter` (`src/material/core/datetime/date-adapter.ts`).
 *
 * Upstream is an abstract CLASS: some methods are genuinely abstract (per-
 * implementation, e.g. `getYear`), others have a concrete default
 * implementation in the base class that every concrete adapter inherits for
 * free (`compareDate`/`sameDate`/`clampDate`/`getValidDateOrNull`/
 * `deserialize`, …) unless it overrides them (`NativeDateAdapter` overrides
 * `deserialize` to also accept ISO 8601 strings).
 *
 * This port has no class hierarchy — `DateAdapter<D>` is a plain interface,
 * and {@link createNativeDateAdapter} (`native-date-adapter.ts`) is the one
 * concrete implementation this project ships. The upstream base class's
 * CONCRETE default methods are ported here as plain, exported, adapter-
 * agnostic functions (`compareDateDefault`, `sameDateDefault`, …) that any
 * future adapter implementation (date-fns/luxon/moment, none shipped yet)
 * can reuse the same way `NativeDateAdapter extends DateAdapter` reused them
 * upstream — just call them from your own object's methods instead of
 * inheriting them. `createNativeDateAdapter` does exactly that.
 *
 * `setLocale`/`localeChanges` ARE now ported (2026-11-03, for the pluggable-DateAdapter /
 * locale / `dateClass` task — see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS /
 * MAT_DATE_LOCALE / dateClass" section). `localeChanges` is a `Signal<number>` (a version
 * counter bumped by `setLocale`), the Qwik-native equivalent of upstream's RxJS
 * `Subject<void>` — render code that displays locale-sensitive text reads `.value` (even just
 * to subscribe) before calling any locale-sensitive method, so a `setLocale()` call triggers a
 * re-render, the same way subscribing to upstream's `localeChanges` does. `MAT_DATE_LOCALE`
 * itself is ported as a Qwik context carrying a `Signal<string>` (`use-date-adapter.ts`'s
 * `MAT_DATE_LOCALE`), not a one-shot DI value, so a provider's locale can also be changed
 * reactively without calling `setLocale` on every live adapter instance directly — see that
 * file's doc comment.
 */
import type {Signal} from '@qwik.dev/core';

/** Adapts type `D` to be usable as a date by qwik-cdk/qwik-material components that work with
 * dates (today: `qwik-material/timepicker`; later: a date picker). Mirrors upstream's
 * `DateAdapter<D>` abstract class surface — see the module doc comment for why this is a plain
 * interface instead. */
export interface DateAdapter<D> {
  /** The locale currently used for all `Intl`-backed formatting on this adapter instance.
   *  Mutable via {@link DateAdapter.setLocale} — see the module doc comment. */
  locale: string;
  /** Bumped every time {@link DateAdapter.setLocale} runs — the Qwik-signal equivalent of
   *  upstream's `localeChanges: Subject<void>`. Read `.value` from render code that displays
   *  locale-sensitive text (even just to subscribe) so a locale change re-renders it. */
  readonly localeChanges: Signal<number>;
  /** Sets the locale used for all subsequent `Intl`-backed formatting on THIS adapter instance,
   *  and bumps {@link DateAdapter.localeChanges}. Mirrors upstream `DateAdapter.setLocale()`. */
  setLocale(locale: string): void;

  /** Gets the year component of the given date. */
  getYear(date: D): number;
  /** Gets the month component of the given date (0-indexed, 0 = January). */
  getMonth(date: D): number;
  /** Gets the date-of-month component of the given date (1-indexed). */
  getDate(date: D): number;
  /** Gets the day-of-week component of the given date (0-indexed, 0 = Sunday). */
  getDayOfWeek(date: D): number;
  /** Gets a list of names for the months, starting with January. */
  getMonthNames(style: 'long' | 'short' | 'narrow'): string[];
  /** Gets a list of names for the dates of the month, starting with '1'. */
  getDateNames(): string[];
  /** Gets a list of names for the days of the week, starting with Sunday. */
  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];
  /** Gets the name for the year of the given date (e.g. '2017'). */
  getYearName(date: D): string;
  /** Gets the first day of the week (0-indexed, 0 = Sunday). */
  getFirstDayOfWeek(): number;
  /** Gets the number of days in the month of the given date. */
  getNumDaysInMonth(date: D): number;
  /** Clones the given date. */
  clone(date: D): D;
  /** Creates a date with the given year/month(0-indexed)/date-of-month. */
  createDate(year: number, month: number, date: number): D;
  /** Gets today's date. */
  today(): D;
  /** Parses a date from a user-provided value. */
  parse(value: unknown, parseFormat: unknown): D | null;
  /** Formats a date as a string according to the given format. */
  format(date: D, displayFormat: unknown): string;
  /** Adds the given number of years to the date. */
  addCalendarYears(date: D, years: number): D;
  /** Adds the given number of months to the date. */
  addCalendarMonths(date: D, months: number): D;
  /** Adds the given number of days to the date. */
  addCalendarDays(date: D, days: number): D;
  /** Gets the RFC 3339 / ISO 8601 date-only string for the given date. */
  toIso8601(date: D): string;
  /** Checks whether the given object is considered a date instance by this adapter. */
  isDateInstance(obj: unknown): boolean;
  /** Checks whether the given date is valid. */
  isValid(date: D): boolean;
  /** Gets a date instance that is not valid. */
  invalid(): D;

  /** Sets the time (hours/minutes/seconds) of one date, returning a new date. */
  setTime(target: D, hours: number, minutes: number, seconds: number): D;
  /** Gets the hours component of the given date. */
  getHours(date: D): number;
  /** Gets the minutes component of the given date. */
  getMinutes(date: D): number;
  /** Gets the seconds component of the given date. */
  getSeconds(date: D): number;
  /** Parses a date with a specific time from a user-provided value. */
  parseTime(value: unknown, parseFormat?: unknown): D | null;
  /** Adds an amount of seconds to the specified date. */
  addSeconds(date: D, amount: number): D;

  /** Given a potential date object, returns that same object if valid, else `null`. */
  getValidDateOrNull(obj: unknown): D | null;
  /** Attempts to deserialize a value (e.g. from a backend) into a valid date object, `null`, or
   *  an invalid date — see upstream's doc comment; the default implementation (ported as
   *  {@link deserializeDefault}) only ever accepts an already-valid `D` or `null`. */
  deserialize(value: unknown): D | null;

  /** Compares the date (year/month/day) components of two dates. */
  compareDate(first: D, second: D): number;
  /** Compares the time (hours/minutes/seconds) components of two dates. */
  compareTime(first: D, second: D): number;
  /** Whether the dates of two dates are equal (null-safe). */
  sameDate(first: D | null, second: D | null): boolean;
  /** Whether the times of two dates are equal (null-safe). */
  sameTime(first: D | null, second: D | null): boolean;
  /** Clamps `date` between `min`/`max` (date components only). */
  clampDate(date: D, min?: D | null, max?: D | null): D;
}

/** Ported default implementation of `DateAdapter.compareDate` — see the module doc comment. */
export function compareDateDefault<D>(
  adapter: Pick<DateAdapter<D>, 'getYear' | 'getMonth' | 'getDate'>,
  first: D,
  second: D,
): number {
  return (
    adapter.getYear(first) - adapter.getYear(second) ||
    adapter.getMonth(first) - adapter.getMonth(second) ||
    adapter.getDate(first) - adapter.getDate(second)
  );
}

/** Ported default implementation of `DateAdapter.compareTime` — see the module doc comment. */
export function compareTimeDefault<D>(
  adapter: Pick<DateAdapter<D>, 'getHours' | 'getMinutes' | 'getSeconds'>,
  first: D,
  second: D,
): number {
  return (
    adapter.getHours(first) - adapter.getHours(second) ||
    adapter.getMinutes(first) - adapter.getMinutes(second) ||
    adapter.getSeconds(first) - adapter.getSeconds(second)
  );
}

/** Ported default implementation of `DateAdapter.sameDate` — see the module doc comment. */
export function sameDateDefault<D>(
  adapter: Pick<DateAdapter<D>, 'isValid' | 'compareDate'>,
  first: D | null,
  second: D | null,
): boolean {
  if (first && second) {
    const firstValid = adapter.isValid(first);
    const secondValid = adapter.isValid(second);
    if (firstValid && secondValid) {
      return !adapter.compareDate(first, second);
    }
    return firstValid === secondValid;
  }
  return first === second;
}

/** Ported default implementation of `DateAdapter.sameTime` — see the module doc comment. */
export function sameTimeDefault<D>(
  adapter: Pick<DateAdapter<D>, 'isValid' | 'compareTime'>,
  first: D | null,
  second: D | null,
): boolean {
  if (first && second) {
    const firstValid = adapter.isValid(first);
    const secondValid = adapter.isValid(second);
    if (firstValid && secondValid) {
      return !adapter.compareTime(first, second);
    }
    return firstValid === secondValid;
  }
  return first === second;
}

/** Ported default implementation of `DateAdapter.clampDate` — see the module doc comment. */
export function clampDateDefault<D>(
  adapter: Pick<DateAdapter<D>, 'compareDate'>,
  date: D,
  min?: D | null,
  max?: D | null,
): D {
  if (min && adapter.compareDate(date, min) < 0) {
    return min;
  }
  if (max && adapter.compareDate(date, max) > 0) {
    return max;
  }
  return date;
}

/** Ported default implementation of `DateAdapter.getValidDateOrNull` — see the module doc
 *  comment. */
export function getValidDateOrNullDefault<D>(
  adapter: Pick<DateAdapter<D>, 'isDateInstance' | 'isValid'>,
  obj: unknown,
): D | null {
  return adapter.isDateInstance(obj) && adapter.isValid(obj as D) ? (obj as D) : null;
}

/** Ported default implementation of `DateAdapter.deserialize` — see the module doc comment.
 *  `NativeDateAdapter` overrides this to also accept ISO 8601 strings before falling back here. */
export function deserializeDefault<D>(
  adapter: Pick<DateAdapter<D>, 'isDateInstance' | 'isValid' | 'invalid'>,
  value: unknown,
): D | null {
  if (value == null || (adapter.isDateInstance(value) && adapter.isValid(value as D))) {
    return value as D | null;
  }
  return adapter.invalid();
}
