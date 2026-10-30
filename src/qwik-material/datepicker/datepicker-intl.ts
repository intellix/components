/**
 * Default i18n strings — ported from upstream `datepicker-intl.ts`'s `MatDatepickerIntl`. Plain
 * module-level constants/functions (no live-override mechanism, no `Subject<void>` changes
 * channel) — same "no live locale switching" deviation this port's other components already
 * accept (see `core/datetime/SYNC.md`). No scenario in this port's contract overrides any of
 * these strings.
 */
export const DATEPICKER_INTL = {
  calendarLabel: 'Calendar',
  openCalendarLabel: 'Open calendar',
  closeCalendarLabel: 'Close calendar',
  prevMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
  prevYearLabel: 'Previous year',
  nextYearLabel: 'Next year',
  prevMultiYearLabel: 'Previous 24 years',
  nextMultiYearLabel: 'Next 24 years',
  switchToMonthViewLabel: 'Choose date',
  switchToMultiYearViewLabel: 'Choose month and year',
  comparisonDateLabel: 'Comparison range',
};

/** Mirrors `formatYearRange` — en-dash-joined, used for the VISIBLE multi-year period text. */
export function formatYearRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** Mirrors `formatYearRangeLabel` — TTS-friendly, used for the hidden live-announcement span. */
export function formatYearRangeLabel(start: string, end: string): string {
  return `${start} to ${end}`;
}
