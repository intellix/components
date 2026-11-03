// Public API for @angular-community/qwik-material/datepicker.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md and
// datepicker/SYNC.md.

export {MatCalendar, type MatCalendarProps} from './mat-calendar';
export {MatCalendarHeader, type MatCalendarHeaderProps} from './mat-calendar-header';
export {MatMonthView, type MatMonthViewProps} from './mat-month-view';
export {MatYearView, type MatYearViewProps} from './mat-year-view';
export {MatMultiYearView, type MatMultiYearViewProps} from './mat-multi-year-view';
export {MatCalendarBody, type MatCalendarBodyProps} from './mat-calendar-body';
export type {
  CalendarCell,
  CalendarView,
  SelectionValue,
  MatCalendarCellClassFunction,
  MatCalendarCellCssClasses,
} from './calendar-math';
export type {DateRange} from './date-range-selection';
export {DATEPICKER_INTL, formatYearRange, formatYearRangeLabel} from './datepicker-intl';

// Popup / input / toggle / range / actions — see SYNC.md for the full public-API usage example.
export {
  useMatDatepicker,
  useMatDateRangePicker,
  type MatDatepickerHandle,
  type MatDateRangePickerHandle,
  type MatDatepickerCore,
  type UseMatDatepickerOptions,
  type UseMatDateRangePickerOptions,
} from './use-mat-datepicker';
export {
  MatDatepicker,
  MatDateRangePicker,
  type MatDatepickerProps,
  type MatDateRangePickerProps,
} from './mat-datepicker';
export {MatDatepickerInput, type MatDatepickerInputProps} from './mat-datepicker-input';
export {MatDateRangeInput, type MatDateRangeInputProps} from './mat-date-range-input';
export {
  MatDatepickerToggle,
  openAnyDatepickerPanel,
  type MatDatepickerToggleProps,
  type AnyDatepickerHandle,
} from './mat-datepicker-toggle';
export {MatDatepickerContent, type MatDatepickerContentProps} from './mat-datepicker-content';
export {
  formatDateForDisplay,
  formatDateWithAdapter,
  setMatDatepickerValue,
  openDatepickerPanel,
  openDateRangePickerPanel,
  closeDatepickerPanel,
  handleDatepickerUserSelect,
  handleRangePickerUserSelect,
  handleDatepickerInput,
  handleDatepickerBlur,
  applyDatepickerSelection,
  cancelDatepickerSelection,
  applyDateRangePickerSelection,
  cancelDateRangePickerSelection,
} from './datepicker-runtime';
